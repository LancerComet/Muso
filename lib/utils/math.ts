abstract class MathUtils {
  /**
   * 计算两个数之间平均插值.
   *
   * @param start
   * @param stop
   * @param step
   */
  static calcInsertion (start: number, stop: number, step: number) {
    const avg = (stop - start) / step
    return new Array(step).fill(start).map((value, index) => {
      return parseFloat((value + avg * index).toFixed(2))
    })
  }

  /**
   * 计算直线长度.
   *
   * @param x1
   * @param y1
   * @param x2
   * @param y2
   */
  static calcLineLength (x1: number, y1: number, x2: number, y2: number) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
  }

  /**
   * 计算两点中心点坐标.
   *
   * @param x1
   * @param y1
   * @param x2
   * @param y2
   */
  static calcCenterPoint (x1: number, y1: number, x2: number, y2: number) {
    return {
      x: Math.min(x1, x2) + Math.abs(x1 - x2) / 2,
      y: Math.min(y1, y2) + Math.abs(y1 - y2) / 2
    }
  }

  /**
   * 计算图片在画布中的四点坐标位置.
   *
   * @param x0
   * @param y0
   * @param w
   * @param h
   */
  static calcFourPointsForImage (x0: number, y0: number, w: number, h: number) {
    return {
      p0: [x0, y0],          // 左上.
      p1: [x0 + w, y0],      // 右上.
      p2: [x0 + w, y0 + h],  // 右下.
      p3: [x0, y0 + h]       // 左下.
    }
  }

  /**
   * 将屏幕触摸坐标映射为图片坐标比率.
   *
   * @param touchX 触摸坐标 X.
   * @param touchY 触摸坐标 Y.
   * @param x0 图片左上 X 坐标.
   * @param y0 图片左上 Y 坐标.
   * @param w 图片原始宽度.
   * @param h 图片原始高度.
   * @param s 缩放倍率.
   */
  static reflectTouchPointToImagePoint (
    touchX: number, touchY: number,
    x0: number, y0: number, w: number, h: number,
    s: number = 1
  ) {
    const x = touchX - x0
    const y = touchY - y0

    // if (x < 0) { x = 0 }
    // if (y < 0) { y = 0 }
    // if (x > w * s) { x = w * s }
    // if (y >h * s) { y = h * s }

    const ratioX = x / (w * s)
    const ratioY = y / (h * s)

    return {
      x,
      y,
      rx: ratioX,
      ry: ratioY
    }
  }

  /**
   * 计算将图片保持在中央的 p0 坐标点.
   * @param x0
   * @param y0
   * @param w
   * @param h
   * @param s
   */
  static keepImageInCenter (x0: number, y0: number, w: number, h: number, s: number) {
    return {
      x: x0 + w * (1 - s),
      y: y0 + h * (1 - s)
    }
  }

  /**
   * 小数点保留.
   *
   * @param float
   * @param fix
   */
  static toFixed (float: number, fix: number = 6): number {
    return parseFloat(float.toFixed(fix))
  }
}

export {
  MathUtils
}
