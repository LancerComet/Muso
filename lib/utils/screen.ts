abstract class ScreenUtils {
  /**
   * 获取设备屏幕缩放比率.
   */
  static getScaleRatio (): number {
    let scaleRatio: number
    try {
      const ctx = document.createElement('canvas').getContext('2d') as any
      const dpr = window.devicePixelRatio || 1
      const bsr = ctx.webkitBackingStorePixelRatio ||
        ctx.mozBackingStorePixelRatio ||
        ctx.msBackingStorePixelRatio ||
        ctx.oBackingStorePixelRatio ||
        ctx.backingStorePixelRatio || 1

      const result = dpr / bsr
      scaleRatio = result > 2 ? 2 : result // 太高手机吃不消.
    } catch (error) {
      scaleRatio = 1
    }
    return scaleRatio
  }
}

export {
  ScreenUtils
}
