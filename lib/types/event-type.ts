/**
 * 阅读器事件.
 *
 * @enum {EventType}
 */
enum EventType {
  /**
   * 进入两点触摸模式.
   */
  EnterDuoTouch = 'enter-double-touch',

  /**
   * 图片载入失败.
   */
  ImageLoadingFailure = 'image-loading-failure',

  /**
   * 离开两点触摸模式.
   */
  LeaveDuoTouch = 'leave-double-touch',

  /**
   * 鼠标滚轮事件.
   */
  MouseWheel = 'mousewheel',

  /**
   * 切换 ScrollingMode.
   */
  ScrollingMode = 'scrolling-mode',

  /**
   * 手势滑动事件.
   */
  Swipe = 'touch-swipe',

  /**
   * 触摸事件.
   */
  TouchStart = 'touch-start',
  TouchMove = 'touch-move',
  TouchEnd = 'touch-end',

  /**
   * X 轴触摸偏移量变换事件.
   */
  TouchMoveX = 'touch-move-x',

  /**
   * Y 轴触摸偏移量变换事件.
   */
  TouchMoveY = 'touch-move-y',

  /**
   * 翻页.
   */
  Paging = 'paging',

  /**
   * 屏幕尺寸变化.
   */
  Resize = 'resize',

  /**
   * 手势缩放事件.
   */
  Zooming = 'zooming',

  /**
   * 缩放移动事件, 在缩放时候移动将触发此事件, 返回双指中心点坐标.
   */
  ZoomCenterMove = 'zoom-center-move'
}

export {
  EventType
}
