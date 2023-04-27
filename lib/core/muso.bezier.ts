/**
 * Solver for cubic bezier curve with implicit control points at (0,0) and (1.0, 1.0)
 * Code from webkit:
 * @url https://stackoverflow.com/questions/11696736/recreating-css3-transitions-cubic-bezier-curve
 */
import { fpsCounter } from '../utils/fps-counter'
import { MathUtils } from '../utils/math'
import { RAFUtils } from '../utils/raf'

class UnitBezier {
  private cx: number = null
  private bx: number = null
  private ax: number = null

  private cy: number = null
  private by: number = null
  private ay: number = null

  private epsilon: number = 1e-6 // Precision

  private sampleCurveX (t: number): number {
    return ((this.ax * t + this.bx) * t + this.cx) * t
  }

  private sampleCurveY (t: number): number {
    return ((this.ay * t + this.by) * t + this.cy) * t
  }

  private sampleCurveDerivativeX (t) {
    return (3.0 * this.ax * t + 2.0 * this.bx) * t + this.cx
  }

  private solveCurveX (x: number) {
    let t0
    let t1
    let t2
    let x2
    let d2
    let i

    // First try a few iterations of Newton's method -- normally very fast.
    for (t2 = x, i = 0; i < 8; i++) {
      x2 = this.sampleCurveX(t2) - x
      if (Math.abs(x2) < this.epsilon) {
        return t2
      }
      d2 = this.sampleCurveDerivativeX(t2)
      if (Math.abs(d2) < this.epsilon) {
        break
      }
      t2 = t2 - x2 / d2
    }

    // No solution found - use bi-section
    t0 = 0.0
    t1 = 1.0
    t2 = x

    if (t2 < t0) { return t0 }
    if (t2 > t1) { return t1 }

    while (t0 < t1) {
      x2 = this.sampleCurveX(t2)
      if (Math.abs(x2 - x) < this.epsilon) {
        return t2
      }
      if (x > x2) { t0 = t2 } else { t1 = t2 }

      t2 = (t1 - t0) * 0.5 + t0
    }

    // Give up
    return t2
  }

  // Find new T as a function of Y along curve X
  solve (x: number) {
    return this.sampleCurveY(
      this.solveCurveX(x)
    )
  }

  constructor (p1x: number, p1y: number, p2x: number, p2y: number) {
    // pre-calculate the polynomial coefficients
    // First and last control points are implied to be (0,0) and (1.0, 1.0)
    this.cx = 3.0 * p1x
    this.bx = 3.0 * (p2x - p1x) - this.cx
    this.ax = 1.0 - this.cx - this.bx

    this.cy = 3.0 * p1y
    this.by = 3.0 * (p2y - p1y) - this.cy
    this.ay = 1.0 - this.cy - this.by
  }
}

/**
 * 三次贝塞尔曲线对象.
 *
 * @class CubicBezier
 */
class CubicBezier {
  private _bezier: UnitBezier = null
  private _fpsCompensate: boolean = false

  /**
   * 使用时间获取位置信息.
   *
   * @param time
   */
  getPositionByTime (time: number) {
    return this._bezier.solve(time)
  }

  /**
   * 根据步进数量创建坐标位.
   *
   * @param start
   * @param end
   * @param step
   */
  createPositionsByStep (start: number, end: number, step: number) {
    return MathUtils.calcInsertion(0, 1, step)
      .map(t => this.getPositionByTime(t))
      .map(b => start + (end - start) * b)
  }

  /**
   * 根据参数执行贝塞尔坐标.
   *
   * @param start
   * @param end
   * @param step
   * @param callback 回调函数, 返回 boolean 表示是否停止.
   */
  tick (start: number, end: number, step: number, callback: (value: number, isDone: boolean) => true | void) {
    if (this._fpsCompensate) {
      // Step 都是根据 60 帧设计, 那么这里根据当前帧率进行补偿.
      const fps = Math.min(144, Math.max(fpsCounter.getFps(), 60))
      const stepRatio = fps / 60
      step = Math.round(step * stepRatio)
    }

    const values = this.createPositionsByStep(start, end, step)
    values.push(end) // 确保精度.
    const tick = () => {
      if (values.length) {
        const stop = callback(values.shift(), !values.length)
        !stop && RAFUtils.tick(tick)
      }
    }
    tick()
  }

  constructor (p1x: number, p1y: number, p2x: number, p2y: number, fpsCompensate: boolean = false) {
    this._bezier = new UnitBezier(p1x, p1y, p2x, p2y)
    this._fpsCompensate = fpsCompensate
  }
}

export {
  CubicBezier
}
