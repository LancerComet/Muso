import { CubicBezier } from '../core/muso.bezier'
import { ScreenUtils } from '../utils/screen'

const MIN_SCALE_RATE = 0.3 // 最小缩放倍率.
const MAX_SCALE_RATE = 5 // 最大缩放倍率.

const GLOBAL_BEZIER = new CubicBezier(0.18, 0.83, 0.16, 0.99, true) // 全局贝塞尔.
const SCALE_BEZIER = new CubicBezier(0.08, 0.94, 0.09, 1, true) // 缩放贝塞尔.
const SCROLL_BEZIER = new CubicBezier(0.14, 0.57, 0.47, 0.93, false) // 滚动贝塞尔.

const SCREEN_RATIO = ScreenUtils.getScaleRatio() // 屏幕缩放比率.
const TOUCH_MOVE_DETECT_DELTA = 10 // 触摸检测触发像素.
const V_EXTRA_MOVE_TIMEOUT = 220 // 纵向模式下触发额外滚动延迟毫秒.

export {
  MIN_SCALE_RATE,
  MAX_SCALE_RATE,
  GLOBAL_BEZIER,
  SCALE_BEZIER,
  SCROLL_BEZIER,
  SCREEN_RATIO,
  TOUCH_MOVE_DETECT_DELTA,
  V_EXTRA_MOVE_TIMEOUT
}
