import { GLOBAL_BEZIER, SCREEN_RATIO } from '../config'
import { HorizontalDirection, IMusoOption, IStageImagePosition, ScrollingMode } from '../types'
import { EventType } from '../types/event-type'
import { CanvasUtils } from '../utils/canvas'
import { SleepUtils } from '../utils/sleep'
import { TaskUtils } from '../utils/task'
import { Muso } from './muso.core'
import { eventBus } from './muso.eventbus'
import { StageImage } from './muso.stage.image'
import { StageIO } from './muso.stage.io'
import { StageResizer } from './muso.stage.resizer'
import { StageSwiper } from './muso.stage.swiper'
import { Ticker } from './muso.ticker'

interface IDrawImageOption {
  index: number
  alpha?: number
  scale?: number
  isCurrentImage?: boolean
}

/**
 * 阅读器舞台, 用于处理交互与展示图片.
 *
 * @class Stage
 */
class Stage {
  option: IMusoOption = null

  private _canvas: HTMLCanvasElement = null
  private _context: CanvasRenderingContext2D = null
  get canvas () { return this._canvas }
  get context () { return this._context }

  // 舞台的逻辑尺寸, 排除比例问题.
  get canvasLogicWidth () { return this.canvas.width / SCREEN_RATIO }
  get canvasLogicHeight () { return this.canvas.height / SCREEN_RATIO }

  get canvasRect () {
    return this.canvas.parentElement.getBoundingClientRect()
  }

  private muso: Muso = null
  private originalPlaceHolder: HTMLImageElement | HTMLCanvasElement | ImageBitmap = null

  private stopDrawing: boolean = false

  // Resize.
  // ================================
  private resizer: StageResizer = new StageResizer(this) // 窗口尺寸变换控制器.

  /**
   * 设置舞台尺寸.
   */
  setCanvasSize () {
    const stage = this._canvas
    const { width: logicalWidth, height: logicalHeight } = this.canvasRect
    stage.width = logicalWidth * SCREEN_RATIO
    stage.height = logicalHeight * SCREEN_RATIO
    stage.style.width = logicalWidth + 'px'
    stage.style.height = logicalHeight + 'px'
  }

  /**
   * 启动画布自缩放功能.
   *
   * @memberof Stage
   */
  enableResizing () {
    this.resizer.enable()
  }

  /**
   * 关闭自缩放功能,
   *
   * @memberof Stage
   */
  disableResizing () {
    this.resizer.disable()
  }

  // IO.
  // ================================
  private stageIO = new StageIO(this)
  get stageImages (): StageImage[] { return this.stageIO.stageImages }
  get currentImage (): StageImage { return this.stageImages[this.currentPageIndex] }

  /**
   * 自动载入图片.
   */
  private async autoLoadImages () {
    return await this.stageIO.autoLoadImages(4)
  }

  /**
   * 向队列尾部添加图片.
   *
   * @memberof Stage
   * @param url
   */
  addImage (url: string): number {
    const index = this.stageIO.addImage(url)

    if (index < this.currentPageIndex + this.option.renderingImageCount) {
      this.stageIO.loadImage(index).then(() => {
        this.updateAllImagesPosition({ noBezier: true })
      })
    }
    return index
  }

  /**
   * 向头部添加图片.
   *
   * @param url
   */
  prependImage (url: string): number {
    const index = this.stageIO.prependImage(url)
    this.currentPageIndex++

    // 加载图片. 仅在渲染范围内加载.
    if (this.currentPageIndex - index < this.option.renderingImageCount) {
      this.stageIO.loadImage(index).then(() => {
        if (this.scrollingMode === ScrollingMode.Vertical) {
          this.setVerticalQueueOffsetByPage({ noBezier: true })
        }
        TaskUtils.nextJob(() => {
          this.updateAllImagesPosition({ noBezier: true })
        })
      })
    }

    return index
  }

  /**
   * 从舞台中移除图片.
   *
   * @memberof Stage
   * @param index
   */
  removeImage (index: number) {
    this.stageIO.removeImage(index)
    this.updateAllImagesPosition()
  }

  /**
   * 重新载入目标图片.
   *
   * @param index
   */
  reload (index: number) {
    const image = this.stageImages[index]
    image && image.reload()
  }

  // Paging.
  // ================================
  currentPageIndex: number = 0 // 当前查看图片.
  private inPaging: boolean = false

  get scrollingMode (): ScrollingMode { return this.option.scrollingMode }

  private get isHorizontalRTL (): boolean {
    return this.option.horizontalDirection === HorizontalDirection.RTL
  }

  /**
   * 显示上一页图片.
   *
   * @memberof Stage
   */
  goPrevPage () {
    this.goTargetPage(this.currentPageIndex - 1)
  }

  /**
   * 显示下一页图片.
   *
   * @memberof Stage
   */
  goNextPage () {
    this.goTargetPage(this.currentPageIndex + 1)
  }

  private pagingTimer = null

  /**
   * 移动至目标页面.
   *
   * @param {number} index 目标页码下标, 起始为 0.
   */
  async goTargetPage (index: number) {
    if (index > -1 && index < this.stageImages.length) {
      this.inPaging = true
      this.currentPageIndex = index
      eventBus.emit(EventType.Paging, this.currentPageIndex)
      this.setQueueOffset()
      await this.autoLoadImages()
      await this.updateAllImagesPosition()
      if (this.scrollingMode === ScrollingMode.Vertical) {
        this.setVerticalQueueOffsetByPage()
      }
      clearTimeout(this.pagingTimer)
      this.pagingTimer = setTimeout(() => {
        this.inPaging = false
      }, 500)
    }
  }

  /**
   * 根据 Vertical Queue Offset 设置页码.
   *
   * @private
   */
  async syncPageByVerticalQueueOffset () {
    if (this.scrollingMode !== ScrollingMode.Vertical) {
      return
    }

    let newPageIndex = 0 // 将设置为已展示的最大页码.

    for (let i = 0, length = this.stageImages.length; i < length; i++) {
      // Index limitation, otherwise it will go to the last.
      if (newPageIndex > this.currentPageIndex + this.option.renderingImageCount) {
        break
      }

      const image = this.stageImages[i]
      if (image) {
        const y = image.y / SCREEN_RATIO + this.queueOffsetForVertical
        if (y < this.canvasLogicHeight * 0.8 && i > newPageIndex) {
          newPageIndex = i
        }
      }
    }

    this.currentPageIndex = newPageIndex
    await this.autoLoadImages()
    await this.updateAllImagesPosition()
    eventBus.emit(EventType.Paging, this.currentPageIndex)
  }

  // View Mode.
  // ================================
  /**
   * Set flip direction in Horizontal scrolling mode.
   *
   * @param direction
   */
  async setHorizontalDirection (direction: HorizontalDirection) {
    this.option.horizontalDirection = direction
    await this.updateAllImagesPosition()
  }

  /**
   * 是否处于滚动模式切换中.
   */
  inSetScrollingMode: boolean = false

  /**
   * 设置滚动模式.
   *
   * @param {ScrollingMode} mode
   * @memberof Stage
   */
  async setScrollingMode (mode: ScrollingMode) {
    if (this.inSetScrollingMode || this.scrollingMode === mode || this.inPaging) {
      return
    }

    this.inSetScrollingMode = true
    this.option.scrollingMode = mode
    await this.updateAllImagesPosition()

    // 垂直模式等待动画结束后执行, 否则可能会造成切换时动画抖动.
    if (mode === ScrollingMode.Vertical) {
      await SleepUtils.sleep(500)
    }

    this.setQueueOffset()
    await this.autoLoadImages()
    await this.updateAllImagesPosition()

    eventBus.emit(EventType.Paging, this.currentPageIndex)
    eventBus.emit(EventType.ScrollingMode, mode)
    this.inSetScrollingMode = false

    // 1. 由于 Worker 无法实时获取 Stage 中的实时数据, 比如 scrollingMode 和 isLeftHandMode 等,
    //    因此在这里再次更新画布, 否则可能会出现画布布局错误的问题 (已经切换到另一种模式但 Worker 还在计算之前的模式).
    // 2. 在横纵切换时会出现布局不更新不完整的问题, 在队列结尾再次执行更新操作.
    setTimeout(() => this.updateAllImagesPosition(), 1)
  }

  // Image Position and sizing.
  // ================================
  // 图片逻辑尺寸, 排除比例问题.
  get imageLogicalWidth () { return this.currentImage.size.width * this.displayScale }
  get imageLogicalHeight () { return this.currentImage.size.height * this.displayScale }

  displayScale: number = 1 // 当前图片的缩放比例.
  imageX: number = 0 // 当前图片在舞台中的 X 位置.
  imageY: number = 0 // 当前图片在舞台中的 Y 位置.
  imageWidth: number = 0 // 当前图片在舞台中的宽度.
  imageHeight: number = 0 // 当前图片在舞台中的高度.

  get zoomCenterX (): number { return this.swiper.centerX } // 双指触摸中心 X 坐标.
  get zoomCenterY (): number { return this.swiper.centerY } // 双指触摸中心 Y 坐标.

  // 队列偏移量.
  queueOffsetForHorizontal: number = 0 // 横屏模式的队列偏移量.

  // 竖屏模式的队列偏移量.
  queueOffsetForVertical: number = 0

  /**
   * 计算每张图片的位置信息.
   * 数组成员对应 imageList 中的成员.
   */
  async calcPositionData (): Promise<IStageImagePosition[]> {
    const result: IStageImagePosition[] = []
    const imageList = this.stageImages
    if (!imageList.length) {
      return result
    }

    for (let i = 0, length = this.stageImages.length; i < length; i++) {
      const item = imageList[i]
      let positionX = 0
      let positionY = 0

      switch (this.scrollingMode) {
        case ScrollingMode.Horizontal:
          if (this.isHorizontalRTL) {
            positionX -= item.size.width // 先将图片靠 0 移动至左边.
            positionX -= this.getImagesWidthBefore(i) // 将图片按照顺序位移.
          } else {
            positionX = this.getImagesWidthBefore(i)
          }
          break

        case ScrollingMode.Vertical:
          positionY += this.getImagesHeightBefore(i)
          break
      }

      result.push({ x: positionX, y: positionY })
    }

    return result
  }

  /**
   * 更新队列偏移量.
   *
   * @param option
   */
  setQueueOffset (option: { noBezier?: boolean } = {}) {
    const { noBezier } = option
    if (this.scrollingMode === ScrollingMode.Horizontal) {
      this.setHorizontalQueueOffsetByPage({ noBezier })
      this.setVerticalQueueOffsetByPage({ noBezier }) // 横屏模式翻页依然要同步纵向偏移.
    }
  }

  /**
   * 根据页码设置横向模式队列偏移.
   *
   * @param option
   */
  private setHorizontalQueueOffsetByPage (option: { noBezier?: boolean } = {}) {
    const { noBezier } = option

    // 设置横向偏移.
    let newValueX = 0
    if (this.isHorizontalRTL) {
      newValueX = this.getImagesWidthBefore(this.currentPageIndex + 1)
      newValueX += this.currentImage.positionX / SCREEN_RATIO
    } else {
      newValueX = this.getImagesWidthBefore(this.currentPageIndex)
    }

    if (noBezier) {
      this.queueOffsetForHorizontal = newValueX
    } else {
      GLOBAL_BEZIER.tick(this.queueOffsetForHorizontal, newValueX, 30, value => {
        this.queueOffsetForHorizontal = value
      })
    }
  }

  /**
   * 根据页码设置纵向模式队列偏移.
   *
   * @param option
   */
  setVerticalQueueOffsetByPage (option: { noBezier?: boolean } = {}) {
    const { noBezier } = option
    const newValueY = -this.getImagesHeightBefore(this.currentPageIndex)
    if (noBezier) {
      this.queueOffsetForVertical = newValueY
    } else {
      GLOBAL_BEZIER.tick(this.queueOffsetForVertical, newValueY, 30, value => {
        this.queueOffsetForVertical = value
      })
    }
  }

  /**
   * 更新图片位置.
   *
   * @param option
   */
  async updateAllImagesPosition (option: { noBezier?: boolean } = {}) {
    const { noBezier } = option
    const allPositionData = await this.calcPositionData()

    for (let i = 0, length = this.stageImages.length; i < length; i++) {
      const image = this.stageImages[i]
      const positionData = allPositionData[i]
      if (image && positionData) {
        image.updatePosition(positionData, noBezier)
      }
    }

    // 橫屏模式更新 QueueOffset.
    this.setQueueOffset({ noBezier })
  }

  // Image Size.
  // ================================
  /**
   * 获取目标图片前的所有图片宽度.
   *
   * @private
   * @param {number} index
   */
  private getImagesWidthBefore (index: number) {
    return this.getImagesWidthByRange(0, index - 1)
  }

  /**
   * 获取目标图片前的所有图片高度.
   *
   * @param index
   * @private
   */
  private getImagesHeightBefore (index: number) {
    return this.getImagesHeightByRange(0, index - 1)
  }

  /**
   * 使用范围获取图片宽度.
   *
   * @param start
   * @param end
   * @private
   */
  private getImagesWidthByRange (start: number, end: number) {
    let width: number = 0
    for (let i = start; i <= end; i++) {
      const image = this.stageImages[i]
      width += image.size.width
    }
    return width
  }

  /**
   * 使用范围获取图片高度.
   *
   * @param start
   * @param end
   * @private
   */
  getImagesHeightByRange (start: number, end: number) {
    let height: number = 0
    for (let i = start; i <= end; i++) {
      const image = this.stageImages[i]
      height += image.size.height
    }
    return height
  }

  // Init.
  // ================================
  private initCanvas (canvas: HTMLCanvasElement) {
    this._canvas = canvas
    this._context = canvas.getContext('2d')

    const { width, height } = this.canvasRect
    CanvasUtils.setCanvasSize(canvas, width, height)

    canvas.className = 'muso-stage'
    canvas.style.padding = this.option.stagePadding + 'px'
    canvas.style.backgroundColor = this.option.stageColor
    canvas.style.boxSizing = 'border-box'
  }

  private initPlaceHolder () {
    const placeHolder = this.originalPlaceHolder
    if (!placeHolder) {
      return
    }

    const canvas = CanvasUtils.createCanvas(this.canvasLogicWidth, this.canvasLogicHeight)
    const context = canvas.getContext('2d')

    if (this.option.stageColor) {
      context.fillStyle = this.option.stageColor
      context.fillRect(0, 0, canvas.width, canvas.height)
    }

    const x = (this.canvasLogicWidth - placeHolder.width) / 2
    const y = (this.canvasLogicHeight - placeHolder.height) / 2
    context.drawImage(placeHolder, x, y)

    this.option.placeholder = canvas
  }

  private initTicker () {
    const ticker = new Ticker()
    ticker.on(() => {
      if (!this.stopDrawing) {
        this.clearStage()
        this.drawImages()
      }
    })
    ticker.start()

    this.ticker = ticker
  }

  // Ticking Process.
  // ================================
  private ticker: Ticker = null

  private clearStage () {
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height)
  }

  private drawImages () {
    for (let i = 0, length = this.stageImages.length; i < length; i++) {
      if (i !== this.currentPageIndex) {
        this.drawSingleImage({
          index: i,
          alpha: this.option.otherPageAlpha()
        })
      }
    }

    // 最后绘制当前图片保证显示在其他图片上方.
    this.drawSingleImage({
      index: this.currentPageIndex,
      alpha: 1,
      isCurrentImage: true,
      scale: this.displayScale
    })
  }

  private drawSingleImage (param: IDrawImageOption) {
    param.scale = param.scale || 1

    const img = this.stageImages[param.index]
    if (!img) {
      return
    }

    this.context.globalAlpha = param.alpha

    let distX = img.x
    let distY = img.y
    const distWidth = img.size.width * SCREEN_RATIO * param.scale
    const distHeight = img.size.height * SCREEN_RATIO * param.scale

    // 处理横竖屏模式.
    switch (this.scrollingMode) {
      case ScrollingMode.Horizontal: {
        const firstImgOffset = this.isHorizontalRTL
          ? 0
          : this.currentImage.positionX
        distX += this.queueOffsetForHorizontal * SCREEN_RATIO * (this.isHorizontalRTL ? 1 : -1) // 加入总队列偏移.
        distX += this.touchMoveX * SCREEN_RATIO + firstImgOffset // 手指触摸偏移 + 首位图片偏移.
        distY += (this.canvasLogicHeight - img.size.height) / 2 * SCREEN_RATIO // 居中偏移.
        break
      }

      case ScrollingMode.Vertical: {
        distY += this.queueOffsetForVertical * SCREEN_RATIO // 队列偏移.
        distX += (this.canvasLogicWidth - img.size.width) / 2 * SCREEN_RATIO // 居中偏移.
        break
      }
    }

    if (param.isCurrentImage && this.displayScale !== 1) {
      distX += img.size.width * (1 - this.displayScale)
      distY += img.size.height * (1 - this.displayScale)

      const xToCenterX = this.zoomCenterX - this.canvasLogicWidth / 2
      const yToCenterY = this.zoomCenterY - this.canvasLogicHeight / 2

      const scalechange = this.displayScale - 1
      const offsetX = -(xToCenterX * scalechange) * SCREEN_RATIO
      const offsetY = -(yToCenterY * scalechange) * SCREEN_RATIO

      distX += offsetX
      distY += offsetY
    }

    this.imageX = distX
    this.imageY = distY
    this.imageWidth = distWidth
    this.imageHeight = distHeight

    this._context.drawImage(
      img.isLoaded ? img.image : img.placeholder,
      Math.floor(distX),
      Math.floor(distY),
      Math.floor(distWidth),
      Math.floor(distHeight)
    )

    this.context.globalAlpha = 1
  }

  // Touch control.
  // ================================
  swiper: StageSwiper = null
  touchMoveX: number = 0 // 触摸偏移 X.
  touchMoveY: number = 0 // 触摸偏移 Y.

  isTouchDisabled: boolean = false

  // 触摸点数量.
  get touchPointCount () {
    return this.swiper.touchPointCount
  }

  // 初始化 Swiper.
  private initSwiper () {
    this.swiper = new StageSwiper(this)
  }

  // ================================

  /**
   * 销毁舞台.
   */
  destroy () {
    this.resizer.destroy()
    this.stageIO.destroy()
    this.swiper.destroy()
    this.ticker.stop()

    const canvas = this._canvas
    canvas.parentElement.removeChild(canvas)
  }

  constructor (muso: Muso, option: IMusoOption, canvas?: HTMLCanvasElement) {
    this.muso = muso
    this.option = option
    this.originalPlaceHolder = option.placeholder

    this.initCanvas(canvas)
    this.initPlaceHolder()
    this.setCanvasSize()
    this.initSwiper()
    this.initTicker()
  }
}

export {
  Stage
}
