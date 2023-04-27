/* eslint-disable dot-notation */

const raf = window.requestAnimationFrame ||
  window['webkitRequestAnimationFrame'] ||
  window['mozRequestAnimationFrame'] ||
  window['oRequestAnimationFrame'] ||
  window['msRequestAnimationFrame'] ||
  function (callback) {
    return window.setTimeout(callback, 1000 / 60)
  }

const clearRaf = window.cancelAnimationFrame ||
  window['webkitCancelAnimationFrame'] ||
  window['mozCancelAnimationFrame'] ||
  window['msCancelAnimationFrame'] ||
  window.clearTimeout

abstract class RAFUtils {
  static tick (callback: () => void) {
    return raf(callback)
  }

  static stop (id: number) {
    clearRaf(id)
  }
}

export {
  RAFUtils
}
