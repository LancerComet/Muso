/**
 * 阅读器设置参数接口.
 *
 * @interface IMusoOption
 */
interface IMusoOption {
  /**
   * 是否自动进行尺寸计算, 默认开启.
   *
   * @type {boolean}
   * @default true
   */
  autoResizing: boolean

  /**
   * Stage 背景颜色.
   * 默认值为 #222.
   *
   * @type {string}
   * @default '#222'
   */
  stageColor: string

  /**
   * 舞台边距, 单位 px.
   *
   * @type {number}
   * @default 0
   */
  stagePadding: number

  /**
   * 触发翻页的滑动距离.
   * 单位 px, 默认为 150.
   *
   * @type {number}
   * @default 150
   */
  swipeDistanceOfPaging: number

  /**
   * 同时渲染的图片数量.
   * 默认 5 张.
   *
   * @type {number}
   * @default 5
   */
  renderingImageCount: number

  /**
   * Horizontal Scrolling Mode direction.
   *
   * @default HorizontalDirection.LTR
   */
  horizontalDirection: HorizontalDirection

  /**
   * 最大图片显示宽度.
   *
   * @type {() => number}
   * @default () => 0
   */
  maxWidth: () => number

  /**
   * 最小图片显示宽度.
   *
   * @type {() => number}
   * @default () => 0
   */
  minWidth: () => number

  /**
   * 最大图片显示高度.
   *
   * @type {() => number}
   * @default () => 0
   */
  maxHeight: () => number

  /**
   * 最小图片显示高度.
   *
   * @type {() => number}
   * @default () => 0
   */
  minHeight: () => number

  /**
   * 缩放恢复比率边界, 当缩放等级小于此设定时, 自动将画布缩放恢复至 1.
   * 默认为 1.3.
   *
   * @type {number}
   * @default 1.3
   */
  restoreScaleRate: number

  /**
   * 图片滚动模式.
   *
   * @type {ScrollingMode}
   * @default ScrollingMode.Horizontal
   */
  scrollingMode: ScrollingMode

  /**
   * 是否关闭默认的操作控制.
   * 在关闭后, Canvas 节点上不再注册默认的事件, 您可使用 swiper 对象自行处理操作.
   *
   * @type {boolean}
   * @default false
   */
  noDefaultControl: boolean

  /**
   * 图片载入钩子.
   * 在图片载入前执行, 传入之前传入的 Url, 返回的 Url 将作为真正载入的 Url 载入.
   *
   * @param {string} url
   * @returns {Promise<string>}
   * @default null
   */
  beforeImageLoad: (url: string) => Promise<string>

  /**
   * 纵向模式下的触摸速度加速倍率.
   *
   * @type {number}
   * @default 1.35
   */
  vTouchMoveAcc: number

  /**
   * 放大模式时的触摸加速倍率.
   *
   * @type {number}
   * @default 1.05
   */
  zoomTouchMoveAcc: number

  /**
   * 占位图片.
   *
   * @type {HTMLElement}
   * @default null
   */
  placeholder: HTMLImageElement | HTMLCanvasElement | ImageBitmap

  /**
   * 图片载入超时时间, 单位毫秒.
   *
   * @type {number}
   * @default 5000
   */
  imageTimeout: number

  /**
   * 其他页面的绘制 Alpha 值.
   *
   * @type {() => number}
   * @default () => 1
   */
  otherPageAlpha: () => number
}

/**
 * Scrolling mode.
 */
enum ScrollingMode {
  Horizontal = 'horizontal',
  Vertical = 'vertical'
}

/**
 * Flip direction in Horizontal scrolling mode.
 */
enum HorizontalDirection {
  LTR = 'ltr',
  RTL = 'rtl'
}

/**
 * 触摸操作方向.
 *
 * @enum {TouchDirection}
 */
enum TouchDirection {
  Left = 'left',
  Right = 'right',
  Top = 'top',
  Bottom = 'bottom'
}

/**
 * StageImage 位置信息.
 */
interface IStageImagePosition {
  x: number
  y: number
}

export {
  IMusoOption,
  ScrollingMode,
  TouchDirection,
  IStageImagePosition,
  HorizontalDirection
}
