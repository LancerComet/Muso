import {
  GLOBAL_BEZIER,
  MAX_SCALE_RATE,
  MIN_SCALE_RATE,
  SCALE_BEZIER,
  SCREEN_RATIO,
  SCROLL_BEZIER,
  TOUCH_MOVE_DETECT_DELTA,
  V_EXTRA_MOVE_TIMEOUT
} from '../config'
import { HorizontalDirection, ScrollingMode, TouchDirection } from '../types'
import { EventType } from '../types/event-type'
import { MathUtils } from '../utils/math'
import { eventBus } from './muso.eventbus'
import { Stage } from './muso.stage'

class StageSwiper {
  private stage: Stage = null
  private get stageCanvas () { return this.stage.canvas }
  private get stageOption () { return this.stage.option }

  private touchId: number = 0 // Touch 周期 Id.
  private currentTouchId: number = 0 // 当前周期的 Touch Id, 每次触摸时将设置. 两者的值在离开触摸后将不同步.
  private touchStartTs: number = null // 当前周期的触摸起始 TS.

  private touchList: TouchList = null
  get inTouch () { return this.touchList && this.touchList.length > 0 }
  get touchPointCount () { return this.touchList ? this.touchList.length : 0 }
  get isDuoTouch () { return this.touchPointCount === 2 }

  private touchDirectionX: TouchDirection = null
  private touchDirectionY: TouchDirection = null

  private p1 = { x: null, y: null, startX: null, startY: null, ts: 0 }
  private get p1DeltaX (): number {
    return this.p1.x === null
      ? 0
      : this.p1.x - this.p1.startX
  }

  private get p1DeltaY (): number {
    return this.p1.y === null
      ? 0
      : this.p1.y - this.p1.startY
  }

  private p2 = { x: null, y: null, startX: null, startY: null, ts: 0 }
  private get p2DeltaX (): number {
    return this.p2.x === null
      ? 0
      : this.p2.x - this.p2.startX
  }

  private get p2DeltaY (): number {
    return this.p2.y === null
      ? 0
      : this.p2.y - this.p2.startY
  }

  // 横屏单指触摸的 X 方向位移.
  private _touchMoveX: number = 0
  private get touchMoveX () { return this._touchMoveX }
  private set touchMoveX (value: number) {
    this._touchMoveX = value

    if (this.inTouch) {
      this.touchDirectionX = value > this._touchMoveX
        ? TouchDirection.Right
        : TouchDirection.Left
    }

    eventBus.emit(EventType.TouchMoveX, value)

    // 处理单指触摸的 X 轴方向.
    // 如果触摸小于触动范围 || 多点触摸 || 非横向模式则退出不继续设置横向坐标.
    if (this.isDuoTouch || !this.isHorizontalMode) {
      return
    }

    if (this.stage.displayScale === 1) {
      this.stage.touchMoveX = value
    }

    if (this.stage.displayScale > 1 && this.currentTouchId === this.touchId) {
      const newCenterX = this.lastCenterX + (
        (-value * (1 / this.stage.displayScale) * SCREEN_RATIO) * this.stageOption.zoomTouchMoveAcc
      )
      if (newCenterX > 0 && newCenterX < this.stage.canvasLogicWidth) {
        this.rawCenterX = newCenterX
      }
    }
  }

  // 横屏单指触摸的 Y 方向位移.
  private _touchMoveY: number = 0
  private get touchMoveY () { return this._touchMoveY }
  private set touchMoveY (value: number) {
    if (this.inTouch) {
      this.touchDirectionY = value > this._touchMoveY
        ? TouchDirection.Bottom
        : TouchDirection.Top
    }

    this._touchMoveY = value
    eventBus.emit(EventType.TouchMoveY, value)

    // 这里只需要处理单指触摸时的 Y 轴方向.
    if (this.isDuoTouch || !this.isHorizontalMode) {
      return
    }

    if (this.stage.displayScale === 1) {
      this.stage.touchMoveY = value
      return
    }

    if (this.stage.displayScale > 1 && this.currentTouchId === this.touchId) {
      const newCenterY = this.lastCenterY + (
        (-value * (1 / this.stage.displayScale) * SCREEN_RATIO) * this.stageOption.zoomTouchMoveAcc
      )

      if (newCenterY > 0 && newCenterY < this.stage.canvasLogicHeight) {
        this.rawCenterY = newCenterY
      }
    }
  }

  private touchSpeedX = {
    value: 0,
    touchId: null
  }

  private touchSpeedY = {
    value: 0,
    touchId: null
  }

  // 舞台原始缩放数据, 触摸后直接设定.
  private startRawScale: number = null
  private _rawScale: number = 1
  private get rawScale () { return this._rawScale }
  private set rawScale (value: number) {
    this._rawScale = value
    const stage = this.stage
    SCALE_BEZIER.tick(stage.displayScale, value, 50, value => {
      if (this.stopScaleTicking) {
        this.resetStopScaleTicking()
        return true
      }
      stage.displayScale = value
      eventBus.emit(EventType.Zooming, value)
    })
  }

  // 是否为横屏模式.
  private get isHorizontalMode (): boolean {
    return this.stageOption.scrollingMode === ScrollingMode.Horizontal
  }

  // 停止 Scale Ticking.
  private stopScaleTicking: boolean = false
  private stopScaleTickingTimer = null
  private resetStopScaleTicking () {
    clearTimeout(this.stopScaleTickingTimer)
    this.stopScaleTickingTimer = setTimeout(() => {
      this.stopScaleTicking = false
    }, 10)
  }

  // 双指触摸坐标位信息.
  private _centerX = 0
  get centerX () { return this._centerX }
  private set centerX (value: number) { this._centerX = value }

  private _centerY = 0
  get centerY () { return this._centerY }
  private set centerY (value: number) { this._centerY = value }

  private startCenterX: number = null
  private startCenterY: number = null
  private lastCenterX: number = null
  private lastCenterY: number = null

  private _rawCenterX: number = 0
  private get rawCenterX (): number { return this._rawCenterX }
  private set rawCenterX (value: number) {
    this._rawCenterX = value
    GLOBAL_BEZIER.tick(this.centerX, value, 20, value => {
      this.centerX = value
    })
  }

  private _rawCenterY = 0
  private get rawCenterY (): number { return this._rawCenterY }
  private set rawCenterY (value: number) {
    this._rawCenterY = value
    GLOBAL_BEZIER.tick(this.centerY, value, 20, value => {
      this.centerY = value
    })
  }

  // 触摸等待标识, 在 isTouchDisabled 时候用户如果触摸则标识为 true, 然后在本触摸周期内有效.
  // 用于防止用户在触摸时 isTouchDisabled 突然变为 false 时触摸瞬间生效产生的抖动.
  private holds: boolean = false

  // onTouchStart.
  onTouchStart (event: TouchEvent) {
    event.preventDefault()

    if (this.stage.isTouchDisabled) {
      this.holds = true
      return
    }

    this.touchList = event.touches
    if (this.touchStartTs === null) {
      this.touchStartTs = Date.now()
    }

    if (this.touchPointCount > 0) {
      const p1 = event.touches[0]
      this.p1.startX = p1.clientX
      this.p1.startY = p1.clientY
      this.p1.ts = Date.now()

      if (this.touchPointCount === 2) {
        const p2 = event.touches[1]
        this.p2.startX = p2.clientX
        this.p2.startY = p2.clientY
        this.p2.ts = Date.now()

        if (this.startRawScale === null) {
          this.startRawScale = this.rawScale
        }

        eventBus.emit(EventType.EnterDuoTouch, event)
      }
    }

    this.currentTouchId = this.touchId
    eventBus.emit(EventType.TouchStart, event)
  }

  // onTouchMove.
  onTouchMove (event: TouchEvent) {
    event.preventDefault()

    if (this.stage.isTouchDisabled || this.holds) {
      return
    }

    const p1 = event.touches[0]
    this.p1.x = p1.clientX
    this.p1.y = p1.clientY

    if (Math.abs(this.p1DeltaX) > TOUCH_MOVE_DETECT_DELTA) {
      this.touchMoveX = this.p1DeltaX
    }

    if (Math.abs(this.p1DeltaY) > TOUCH_MOVE_DETECT_DELTA) {
      this.touchMoveY = this.p1DeltaY
    }

    // 处理两点情况.
    if (this.isDuoTouch && this.isHorizontalMode) {
      const p2 = event.touches[1]
      this.p2.x = p2.clientX
      this.p2.y = p2.clientY

      // 计算中心点.
      const { x: centerX, y: centerY } = MathUtils.calcCenterPoint(
        p1.clientX, p1.clientY, p2.clientX, p2.clientY
      )

      if (this.startCenterX === null) {
        this.startCenterX = centerX
      }
      if (this.startCenterY === null) {
        this.startCenterY = centerY
      }

      if (this.stage.displayScale >= 1) {
        this.rawCenterX = this.stage.canvasLogicWidth - centerX
        this.rawCenterY = this.stage.canvasLogicHeight - centerY
      } else {
        this.rawCenterX = centerX
        this.rawCenterY = centerY
      }

      // 计算缩放比率, 和起始时直线长度对比.
      const currentLength = MathUtils.calcLineLength(p1.clientX, p1.clientY, p2.clientX, p2.clientY)
      const originalLength = MathUtils.calcLineLength(this.p1.startX, this.p1.startY, this.p2.startX, this.p2.startY)

      const deltaScale = currentLength / originalLength
      let newRawScale = this.startRawScale * deltaScale

      // 限制缩放.
      if (newRawScale < MIN_SCALE_RATE) {
        newRawScale = MIN_SCALE_RATE
      } else if (newRawScale > MAX_SCALE_RATE) {
        newRawScale = MAX_SCALE_RATE
      }

      // 防止抖动.
      if (Math.abs(newRawScale - this.rawScale) > 0.1) {
        this.rawScale = newRawScale
      }

      const centerDeltaX = centerX - this.startCenterX
      const centerDeltaY = centerY - this.startCenterY

      eventBus.emit(EventType.ZoomCenterMove, {
        position: [this.centerX, this.centerY],
        delta: [centerDeltaX, centerDeltaY]
      })
    }

    eventBus.emit(EventType.TouchMove, event)
  }

  // onTouchEnd.
  // 请注意, 此事件在双指变单指时依旧触发.
  onTouchEnd (event: TouchEvent) {
    event.preventDefault()

    if (this.stage.isTouchDisabled) {
      return
    }

    if (this.holds) {
      this.holds = false
    }

    this.touchList = event.touches

    // 计算触摸速度.
    const ts = Date.now()
    const touchDuration = (ts - this.touchStartTs)
    this.touchSpeedX.value = (this.p1.x - this.p1.startX) / touchDuration
    this.touchSpeedY.value = (this.p1.y - this.p1.startY) / touchDuration
    this.touchSpeedX.touchId = this.touchId
    this.touchSpeedY.touchId = this.touchId

    this.startCenterX = null
    this.startCenterY = null
    this.lastCenterX = this.centerX
    this.lastCenterY = this.centerY
    this.startRawScale = null
    this.touchStartTs = null

    this.touchId++ // 增加 touchId, 双指变单指时依然增加, 视为不同的触摸周期.

    if (!this.isDuoTouch) {
      eventBus.emit(EventType.LeaveDuoTouch, event)
    }

    if (!this.inTouch) {
      eventBus.emit(EventType.TouchEnd, event)
    }

    this.p1.x = null
    this.p1.startX = null
    this.p1.y = null
    this.p1.startY = null
    this.p2.x = null
    this.p2.startX = null
    this.p2.y = null
    this.p2.startY = null
  }

  // onScroll.
  // 仅在纵向模式下生效.
  async onMouseWheel (event: WheelEvent) {
    if (this.isHorizontalMode) {
      return
    }
    eventBus.emit(EventType.MouseWheel, -event.deltaY)
  }

  // 初始化触摸事件.
  private initTouchEvents () {
    this.onTouchStart = this.onTouchStart.bind(this)
    this.onTouchMove = this.onTouchMove.bind(this)
    this.onTouchEnd = this.onTouchEnd.bind(this)
    this.onMouseWheel = this.onMouseWheel.bind(this)

    const canvas = this.stageCanvas
    canvas.addEventListener('touchstart', this.onTouchStart)
    canvas.addEventListener('touchmove', this.onTouchMove)
    canvas.addEventListener('touchend', this.onTouchEnd)
    canvas.addEventListener('touchcancel', this.onTouchEnd)
    canvas.addEventListener('mousewheel', this.onMouseWheel)
  }

  // 初始化舞台控制逻辑.
  private initStageControl () {
    const stage = this.stage
    const restoreScaleRate = stage.option.restoreScaleRate

    // 释放 moveOffset 与 scale.
    const releaseMoveOffset = () => {
      GLOBAL_BEZIER.tick(this.touchMoveX, 0, 30, (value) => {
        // 在手指触摸时不赋值, 否则会造成抖动.
        if (!this.inTouch) {
          this.touchMoveX = value
        }
      })

      GLOBAL_BEZIER.tick(this.touchMoveY, 0, 30, (value) => {
        this.touchMoveY = value
      })
    }

    const releaseScaleRate = () => {
      GLOBAL_BEZIER.tick(stage.displayScale, 1, 30, (value) => {
        stage.displayScale = value
        this._rawScale = value
      })
    }

    const releaseZoomScaleCenterDelta = () => {
      GLOBAL_BEZIER.tick(this.rawCenterX, stage.canvasLogicWidth / 2, 30, value => {
        this.rawCenterX = value
      })

      GLOBAL_BEZIER.tick(this.rawCenterY, stage.canvasLogicHeight / 2, 30, value => {
        this.rawCenterY = value
      })
    }

    // 横屏模式处理滑动手势.
    eventBus.on(EventType.Swipe, direction => {
      // 在横屏模式时翻页.
      if (this.isHorizontalMode) {
        const isRtl = stage.option.horizontalDirection === HorizontalDirection.RTL
        switch (direction) {
          case TouchDirection.Right:
            isRtl ? stage.goNextPage() : stage.goPrevPage()
            break

          case TouchDirection.Left:
            isRtl ? stage.goPrevPage() : stage.goNextPage()
            break
        }
      }
    })

    // 上一次 queueOffsetForVertical.
    let lastQueueOffsetForVertical = null

    // 竖屏模式处理 Y 方向单指触摸.
    let newQueueOffsetY = 0
    let doExtraMoveTs = null // 发出执行额外纵向缓动滚动指令的时间戳.
    const handleVerticalScroll = (data: {
      deltaY: number
      lastQueueOffsetForVertical: number
      newQueueOffsetY: number
    }) => {
      if (this.isHorizontalMode) {
        return
      }

      const { deltaY, lastQueueOffsetForVertical, newQueueOffsetY } = data

      // 滚动至顶部时处理额外滚动.
      if (newQueueOffsetY > 0) {
        const start = newQueueOffsetY * 0.5
        this.stage.queueOffsetForVertical = start
        return GLOBAL_BEZIER.tick(start, 0, 30, (value) => {
          if (!this.inTouch) {
            this.stage.queueOffsetForVertical = value
          }
        })
      }

      // 处理滚动至最底部的情况.
      const isScrollDown = newQueueOffsetY - lastQueueOffsetForVertical < 0
      if (isScrollDown) {
        const totalHeight = stage.getImagesHeightByRange(0, stage.stageImages.length - 1)
        const availableScrollHeight = totalHeight - stage.canvasLogicHeight
        const touchMoveY = lastQueueOffsetForVertical + deltaY * 0.5

        // 滚动到最底部再次移动后加入缓动.
        if (Math.abs(touchMoveY) > availableScrollHeight) {
          this.stage.queueOffsetForVertical = touchMoveY
          return GLOBAL_BEZIER.tick(touchMoveY, -availableScrollHeight, 30, (value) => {
            if (!this.inTouch) {
              this.stage.queueOffsetForVertical = value
            }
          })
        }

        // 限制手指滑动到最底部的边界.
        if (Math.abs(newQueueOffsetY) > availableScrollHeight) {
          this.stage.queueOffsetForVertical = -availableScrollHeight
          return
        }
      }

      this.stage.queueOffsetForVertical = newQueueOffsetY
      this.stage.syncPageByVerticalQueueOffset()

      if (doExtraMoveTs === null) {
        doExtraMoveTs = Date.now()
      }
    }

    eventBus.on(EventType.TouchMoveY, deltaY => {
      if (this.isHorizontalMode) { return }

      if (lastQueueOffsetForVertical === null) {
        lastQueueOffsetForVertical = this.stage.queueOffsetForVertical
      }

      newQueueOffsetY = lastQueueOffsetForVertical + deltaY * this.stage.option.vTouchMoveAcc

      handleVerticalScroll({
        deltaY, newQueueOffsetY, lastQueueOffsetForVertical
      })
    })

    eventBus.on(EventType.MouseWheel, deltaY => {
      if (this.isHorizontalMode) { return }

      const lastQueueOffsetForVertical = this.stage.queueOffsetForVertical
      const newQueueOffsetY = this.stage.queueOffsetForVertical + deltaY * this.stage.option.vTouchMoveAcc
      handleVerticalScroll({ deltaY, newQueueOffsetY, lastQueueOffsetForVertical })
    })

    // 离开触摸.
    eventBus.on(EventType.TouchEnd, () => {
      if (!this.isHorizontalMode) {
        const isScrollDown = newQueueOffsetY < lastQueueOffsetForVertical
        eventBus.emit(EventType.Swipe, isScrollDown ? TouchDirection.Top : TouchDirection.Bottom)
        lastQueueOffsetForVertical = null
        newQueueOffsetY = 0
        return
      }

      const displayScale = this.stage.displayScale

      if (displayScale === 1) {
        const swipeDistanceOfPaging = this.stageOption.swipeDistanceOfPaging
        if (this.p1DeltaX < 0 && this.p1DeltaX * -1 > swipeDistanceOfPaging) {
          eventBus.emit(EventType.Swipe, TouchDirection.Left)
        } else if (this.p1DeltaX > swipeDistanceOfPaging) {
          eventBus.emit(EventType.Swipe, TouchDirection.Right)
        }

        releaseMoveOffset()
      } else if (displayScale < restoreScaleRate) {
        // 当缩放小于 1 时停止 ScaleTicking, 会与还原绘制冲突.
        this.stopScaleTicking = true

        // 释放缩放比率.
        releaseScaleRate()
        releaseMoveOffset()
        releaseZoomScaleCenterDelta()
      }
    })

    // 处理纵向模式的惯性持续滚动.
    eventBus.on(EventType.Swipe, (direction: TouchDirection) => {
      if (direction !== TouchDirection.Bottom && direction !== TouchDirection.Top) {
        return
      }

      const ts = Date.now()
      const touchDuration = ts - doExtraMoveTs

      // 超时检测, 若超过此事件则认为是移动而非滑动.
      if (touchDuration > V_EXTRA_MOVE_TIMEOUT) {
        doExtraMoveTs = null
        return
      }

      const touchId = this.touchId
      const moveOffset = newQueueOffsetY - lastQueueOffsetForVertical
      const speedY = this.p1DeltaY / touchDuration
      const distY = newQueueOffsetY + moveOffset * Math.abs(speedY) * SCREEN_RATIO

      // 图片数量提前定义且取已经载入的图片, 这样在代码持续 addImage 时不会出错.
      // const stageImageCount = stage.stageImages.filter(item => item.isLoaded).length
      const stageImageCount = stage.stageImages.length

      SCROLL_BEZIER.tick(newQueueOffsetY, distY, 100, value => {
        if (this.inTouch || touchId !== this.touchId || stage.inSetScrollingMode) {
          return true
        }

        if (value > 0) {
          this.stage.queueOffsetForVertical = 0
          this.stage.syncPageByVerticalQueueOffset()
          return true
        }

        // 处理滚动至底部的情况.
        const isLastPage = stage.currentPageIndex >= stageImageCount - 1
        if (direction === TouchDirection.Top && isLastPage) {
          const totalHeight = stage.getImagesHeightByRange(0, stage.stageImages.length - 1)
          const availableScrollHeight = totalHeight - stage.canvasLogicHeight
          if (Math.abs(value) > availableScrollHeight) {
            this.stage.queueOffsetForVertical = -availableScrollHeight
            this.stage.syncPageByVerticalQueueOffset()
            return true
          }
        }

        this.stage.queueOffsetForVertical = value
        this.stage.syncPageByVerticalQueueOffset()
      })

      doExtraMoveTs = null
    })
  }

  /**
   * 销毁 Swiper.
   */
  destroy () {
    const canvas = this.stageCanvas
    canvas.removeEventListener('touchstart', this.onTouchStart)
    canvas.removeEventListener('touchmove', this.onTouchMove)
    canvas.removeEventListener('touchend', this.onTouchEnd)
    canvas.removeEventListener('touchcancel', this.onTouchEnd)
    canvas.removeEventListener('scroll', this.onMouseWheel)
    this.stage = null
  }

  constructor (stage: Stage) {
    this.stage = stage
    if (!stage.option.noDefaultControl) {
      this.initTouchEvents()
      this.initStageControl()
    }
  }
}

export {
  StageSwiper
}
