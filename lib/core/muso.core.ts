import { HorizontalDirection, IMusoOption, ScrollingMode } from '../types'
import { EventType } from '../types/event-type'
import { eventBus, EventBusCallback } from './muso.eventbus'
import { Stage } from './muso.stage'

/**
 * 漫画阅读器类型.
 *
 * @class Muso
 */
class Muso {
  private option: IMusoOption = Object.create(null)
  private stage: Stage = null

  /**
   * Swiper 对象, 用于业务自行控制触摸操作.
   */
  get swiper () { return this.stage.swiper }

  /**
   * 在目标节点上初始化阅读器.
   *
   * @param canvas
   */
  mount (canvas: HTMLCanvasElement) {
    const stage = new Stage(this, this.option, canvas)
    this.option.autoResizing && stage.enableResizing()
    this.stage = stage
  }

  /**
   * 销毁播放器实例.
   *
   */
  destroy () {
    eventBus.destroy()
    this.stage.destroy()
    this.stage = null
    this.option = null
  }

  /**
   * 设置滚动模式.
   *
   * @param {ScrollingMode} mode
   * @memberof Stage
   */
  setScrollingMode (mode: ScrollingMode) {
    this.stage.setScrollingMode(mode)
  }

  /**
   * 添加漫画图片.
   *
   * @param {string} url
   */
  addImage (url: string): number {
    return this.stage.addImage(url)
  }

  /**
   * 向头部添加图片.
   *
   * @param url
   */
  prependImage (url: string): number {
    return this.stage.prependImage(url)
  }

  /**
   * 移除漫画图片.
   *
   * @param index
   */
  removeImage (index: number) {
    this.stage.removeImage(index)
  }

  /**
   * 重新载入图片.
   *
   * @param index
   */
  reload (index: number) {
    this.stage.reload(index)
  }

  /**
   * 进入上一页.
   */
  goPrevPage () {
    this.stage.goPrevPage()
  }

  /**
   * 进入下一页.
   */
  goNextPage () {
    this.stage.goNextPage()
  }

  /**
   * 移动至目标页面.
   *
   * @param page
   */
  goTargetPage (page: number) {
    this.stage.goTargetPage(page)
  }

  /**
   * Set flip direction in Horizontal scrolling mode.
   *
   * @param direction
   */
  setHorizontalDirection (direction: HorizontalDirection) {
    return this.stage.setHorizontalDirection(direction)
  }

  /**
   * 注册事件.
   *
   * @param eventName
   * @param callback
   */
  on (eventName: EventType, callback: EventBusCallback) {
    eventBus.on(eventName, callback)
  }

  /**
   * 取消事件注册.
   *
   * @param eventName
   * @param callback
   */
  off (eventName: EventType, callback: EventBusCallback) {
    eventBus.off(eventName, callback)
  }

  /**
   * 创建阅读器实例.
   *
   * @param {IMusoOption} option 阅读器设置.
   */
  constructor (option: Partial<IMusoOption> = {}) {
    this.option.autoResizing = typeof option.autoResizing === 'boolean' ? option.autoResizing : true
    this.option.stagePadding = option.stagePadding || 0
    this.option.stageColor = option.stageColor || '#222'
    this.option.swipeDistanceOfPaging = option.swipeDistanceOfPaging || 50
    this.option.renderingImageCount = option.renderingImageCount || 5
    this.option.horizontalDirection = option.horizontalDirection || HorizontalDirection.LTR
    this.option.maxWidth = option.maxWidth || (() => this.stage.canvas.offsetWidth ?? 0)
    this.option.minWidth = option.minWidth || function () { return 0 }
    this.option.maxHeight = option.maxHeight || (() => this.stage.canvas.offsetHeight ?? 0)
    this.option.minHeight = option.minHeight || function () { return 0 }
    this.option.restoreScaleRate = option.restoreScaleRate || 1.3
    this.option.scrollingMode = option.scrollingMode || ScrollingMode.Horizontal
    this.option.noDefaultControl = option.noDefaultControl || false
    this.option.beforeImageLoad = option.beforeImageLoad || null
    this.option.vTouchMoveAcc = option.vTouchMoveAcc || 1.35
    this.option.zoomTouchMoveAcc = option.zoomTouchMoveAcc || 1.05
    this.option.placeholder = option.placeholder || null
    this.option.imageTimeout = option.imageTimeout || 5000
    this.option.otherPageAlpha = option.otherPageAlpha || function () { return 1 }
  }
}

export {
  Muso
}
