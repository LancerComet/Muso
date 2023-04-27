import { SCREEN_RATIO } from '../config'

abstract class CanvasUtils {
  /**
   * 设置 Canvas 尺寸.
   *
   * @param canvas
   * @param logicalWidth
   * @param logicalHeight
   */
  static setCanvasSize (canvas: HTMLCanvasElement, logicalWidth: number, logicalHeight: number) {
    canvas.width = logicalWidth * SCREEN_RATIO
    canvas.height = logicalHeight * SCREEN_RATIO
    canvas.style.width = logicalWidth + 'px'
    canvas.style.height = logicalHeight + 'px'
    canvas.getContext('2d').setTransform(SCREEN_RATIO, 0, 0, SCREEN_RATIO, 0, 0)
  }

  /**
   * 创建 Canvas.
   *
   * @param logicalWidth
   * @param logicalHeight
   */
  static createCanvas (logicalWidth: number, logicalHeight: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas') as HTMLCanvasElement
    this.setCanvasSize(canvas, logicalWidth, logicalHeight)
    return canvas
  }
}

export {
  CanvasUtils
}
