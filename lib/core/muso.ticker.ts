import { RAFUtils } from '../utils/raf'

/**
 * Ticker 是用于在 RAF 周期中执行任务的对象.
 */
class Ticker {
  private _rafId: number = null
  private _isEnabled: boolean = false
  private _callbacks: Array<(...args: any[]) => void> = []

  /**
   * 执行回调任务.
   *
   * @private
   * @memberof Ticker
   */
  private _execCallbacks () {
    for (const func of this._callbacks) {
      typeof func === 'function' && func()
    }
  }

  /**
   * 单次任务执行.
   *
   * @private
   * @memberof Ticker
   */
  private _tick () {
    this._execCallbacks()
    if (this._isEnabled) {
      this._rafId = RAFUtils.tick(() => this._tick())
    }
  }

  /**
   * 启动 Ticker.
   *
   * @memberof Ticker
   */
  start () {
    this._isEnabled = true
    this._tick()
  }

  /**
   * 停止 Ticker 运行.
   *
   * @memberof Ticker
   */
  stop () {
    this._isEnabled = false
  }

  /**
   * 注册新的执行函数.
   *
   * @param {(...args: any[]) => void} callback
   * @memberof Ticker
   */
  on (callback: (...args: any[]) => void) {
    if (this._callbacks.indexOf(callback) < 0) {
      this._callbacks.push(callback)
    }
  }

  /**
   * 反注册执行函数.
   *
   * @param {(...args: any[]) => void} callback
   * @memberof Ticker
   */
  off (callback: (...args: any[]) => void) {
    const index = this._callbacks.indexOf(callback)
    if (index > -1) {
      this._callbacks.splice(index, 1)
    }
  }

  /**
   * 销毁 Ticker.
   */
  destroy () {
    this.stop()
    this._callbacks = []
  }
}

export {
  Ticker
}
