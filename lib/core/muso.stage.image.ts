import { EMPTY_PNG_BASE64 } from '../assets/empty-png-base64'
import { GLOBAL_BEZIER, SCREEN_RATIO } from '../config'
import { IStageImagePosition, ScrollingMode } from '../types'
import { RAFUtils } from '../utils/raf'
import { Stage } from './muso.stage'

const EMPTY_IMAGE = new Image()
EMPTY_IMAGE.src = EMPTY_PNG_BASE64

// let updatePositionTimer = null

/**
 * 舞台图片信息对象.
 * 用来代表舞台中的一个图片.
 *
 * @class ImageCanvasItem
 */
class StageImage {
  /**
   * 所属舞台.
   */
  private stage: Stage = null

  /**
   * Image 对象.
   */
  image: HTMLImageElement | HTMLCanvasElement | ImageBitmap = EMPTY_IMAGE

  /**
   * 占位图对象.
   */
  get placeholder (): HTMLImageElement | HTMLCanvasElement | ImageBitmap {
    return this.stage.option.placeholder || EMPTY_IMAGE
  }

  /**
   * 图片 URL.
   */
  url: string

  /**
   * 是否在载入中.
   */
  inLoading: boolean = false

  /**
   * 图片是否已载入.
   */
  isLoaded: boolean = false

  /**
   * 图片在舞台中的逻辑 X 坐标, 包含其他图片在内的总坐标量.
   */
  private _rawX: number = 0
  private _x: number = null
  get x (): number { return this._x }

  /**
   * 图片在舞台中的逻辑 Y 坐标, 包含其他图片在内的总坐标量.
   */
  private _rawY: number = 0
  private _y: number = 0
  get y (): number { return this._y }

  /**
   * 图片真实宽度.
   */
  originalWidth: number = 0

  /**
   * 图片真实高度.
   */
  originalHeight: number = 0

  /**
   * 计算图片在当前画布的位置.
   * 本函数由舞台调取, 进行计算.
   */
  updatePosition (positionData: IStageImagePosition, noBezier?: boolean) {
    if (!positionData) {
      return
    }

    this._rawX = positionData.x * SCREEN_RATIO
    this._rawY = positionData.y * SCREEN_RATIO

    if (this.x === null) { this._x = this._rawX }
    if (this.y === null) { this._y = this._rawY }

    // 纵屏阅读时模式关闭缓动, 否则载入图片时会抽.
    // 图片载入前关闭缓动, 免除一些没有必要的效果, prepend 时也可避免动画.
    if (
      noBezier ||
      (this.stage.scrollingMode === ScrollingMode.Vertical && !this.stage.inSetScrollingMode) ||
      !this.isLoaded
    ) {
      this._x = this._rawX
      this._y = this._rawY
    } else {
      this.tickPosition()
    }
  }

  /**
   * 图片尺寸.
   * 在小于窗口尺寸时为实际尺寸, 大于窗口尺寸时为窗口尺寸.
   * 请注意此尺寸不为缩放时的渲染尺寸, 是图片放在舞台中的 1 倍缩放时的数值.
   *
   * @readonly
   * @memberof StageImage
   */
  get size () {
    const { minWidth, maxWidth, minHeight, maxHeight } = this.stage.option

    const _maxWidth = maxWidth()
    const _maxHeight = maxHeight()
    const _minWidth = minWidth()
    const _minHeight = minHeight()

    // 图片比例.
    // 在图片没有载入且有 placeholder 时使用 placeholder 的数据.
    const sizeRatio = this.isLoaded
      ? this.originalWidth / this.originalHeight
      : this.placeholder.width / this.placeholder.height

    // 计算显示尺寸.
    let width = this.isLoaded
      ? this.originalWidth
      : this.placeholder.width

    if (_maxWidth > 0 && width > _maxWidth) {
      width = _maxWidth
    }
    if (_minWidth > 0 && width < _minWidth) {
      width = _minWidth
    }

    let height = width / sizeRatio
    if (_maxHeight > 0 && height > _maxHeight) {
      height = _maxHeight
    }
    if (_minHeight > 0 && height < _minHeight) {
      height = _minHeight
    }
    width = height * sizeRatio

    return {
      width,
      height
    }
  }

  /**
   * 将此图片放入画布中时的 X 坐标.
   *
   * @type {number}
   * @readonly
   * @memberof StageImage
   */
  get positionX () {
    const { width } = this.stage.canvasRect
    return (width - this.size.width) / 2 * SCREEN_RATIO
  }

  /**
   * 将此图片放入画布中时的 Y 坐标.
   *
   * @type {number}
   * @readonly
   * @memberof StageImage
   */
  get positionY () {
    const { height } = this.stage.canvasRect
    return (height - this.size.height) / 2 * SCREEN_RATIO
  }

  /**
   * 获取图片在阅读器中的 Index.
   *
   * @type {number}
   */
  get index (): number {
    return this.stage.stageImages.indexOf(this)
  }

  /**
   * 对位置移动进行动画插值.
   *
   * @private
   */
  private tickPosition () {
    const xStart = this._x
    const xEnd = this._rawX
    const xValues = GLOBAL_BEZIER.createPositionsByStep(xStart, xEnd, 30)

    const yStart = this._y
    const yEnd = this._rawY
    const yValues = GLOBAL_BEZIER.createPositionsByStep(yStart, yEnd, 30)

    const tick = () => {
      this._x = xValues.shift()
      this._y = yValues.shift()

      if (xValues.length || yValues.length) {
        RAFUtils.tick(() => tick())
      }
    }

    tick()
  }

  /**
   * 加载图片.
   *
   * @returns {Promise<void>}
   */
  load (): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if (!this.isLoaded && !this.inLoading) {
        this.inLoading = true

        const timeoutTimer = setTimeout(() => {
          reject(new Error('Image loading timeout'))
        }, this.stage.option.imageTimeout)

        const image = new Image()
        const beforeLoad = this.stage.option.beforeImageLoad

        if (typeof beforeLoad === 'function') {
          try {
            this.url = await beforeLoad(this.url)
          } catch (error) {
            return reject(error)
          }
        }

        image.onload = async () => {
          clearTimeout(timeoutTimer)
          this.originalWidth = image.width
          this.originalHeight = image.height
          this.inLoading = false
          this.isLoaded = true
          this.image = image

          // 加载完成后更新图片位置.
          // 推送至队列结尾执行, 否则纵向模式可能出现问题.
          // clearTimeout(updatePositionTimer)
          // updatePositionTimer = setTimeout(() => {
          //   console.log('updateAllImagePosition')
          //   this.stage.updateAllImagesPosition({ noBezier })
          // }, 50)

          resolve()
        }

        image.onerror = (error) => {
          clearTimeout(timeoutTimer)
          this.inLoading = false
          reject(error)
        }

        image.src = this.url
      } else {
        resolve()
      }
    })
  }

  /**
   * 重新载入图片.
   */
  reload () {
    this.isLoaded = false
    return this.load()
  }

  /**
   * 销毁对象.
   */
  destroy () {
    this.stage = null
  }

  constructor (param: IStageImageOption) {
    this.stage = param.stage
    this.url = param.url
  }
}

export {
  StageImage
}

interface IStageImageOption {
  url: string
  stage: Stage
}
