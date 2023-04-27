import { RAFUtils } from './raf'

class FpsCounter {
  private _fps: number = 60
  private _frames: number = 0
  private _lastTs: number = Date.now()
  private _isStarted: boolean = false

  private tick () {
    const ts = Date.now()
    this._frames++
    if (ts > this._lastTs + 20) {
      const fps = Math.round((this._frames * 1000) / (ts - this._lastTs))
      this._lastTs = ts
      this._frames = 0
      this._fps = fps
    }

    if (this._isStarted) {
      RAFUtils.tick(() => this.tick())
    }
  }

  getFps () {
    return this._fps
  }

  start () {
    this._isStarted = true
    this.tick()
  }

  dispose () {
    this._isStarted = false
  }
}

const fpsCounter = new FpsCounter()
fpsCounter.start()

export {
  FpsCounter,
  fpsCounter
}
