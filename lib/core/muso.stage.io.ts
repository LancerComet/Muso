import { ScrollingMode } from '../types'
import { EventType } from '../types/event-type'
import { eventBus } from './muso.eventbus'
import { Stage } from './muso.stage'
import { StageImage } from './muso.stage.image'

class StageIO {
  private stage: Stage = null // 舞台.
  stageImages: StageImage[] = [] // 图片对象列表.

  /**
   * 添加图片并返回图片所处 Index.
   */
  addImage (url: string): number {
    const newImage = new StageImage({ url, stage: this.stage })
    this.stageImages.push(newImage)
    return this.stageImages.length - 1
  }

  /**
   * 向队列首部添加图片.
   *
   * @param url
   */
  prependImage (url: string): number {
    const newImage = new StageImage({ url, stage: this.stage })
    this.stageImages = [newImage].concat(this.stageImages)
    return 0
  }

  /**
   * 移除图片.
   */
  removeImage (index: number) {
    this.stageImages.splice(index, 1)
  }

  /**
   * 根据情况自动载入图片.
   *
   * @param loadCount
   * @param option
   */
  async autoLoadImages (loadCount: number) {
    const currentIndex = this.stage.currentPageIndex

    // 横屏模式从当前图片开始载入, 纵向模式从第一张图片开始检查, 这样可以载入滚到的图片之前的所有图片.
    let i = this.stage.scrollingMode === ScrollingMode.Vertical
      ? currentIndex
      : currentIndex

    for (const length = currentIndex + loadCount; i < length; i++) {
      const item = this.stageImages[i]
      if (item) {
        try {
          await item.load()
        } catch (error) {
          console.error(`[Muso] Failed to load image ${item.url}:`, error)
          eventBus.emit(EventType.ImageLoadingFailure, this)
        }
      }
    }
  }

  /**
   * 载入单张图片.
   *
   * @param index
   */
  async loadImage (index: number) {
    if (index < 0 || index >= this.stageImages.length) {
      return
    }

    const image = this.stageImages[index]
    if (image) {
      try {
        await image.load()
      } catch (error) {
        console.error(`[Muso] Failed to load image ${image.url}:`, error)
        eventBus.emit(EventType.ImageLoadingFailure, this)
      }
    }
  }

  /**
   * 销毁 IO.
   */
  destroy () {
    this.stage = null
    this.stageImages.forEach(item => item.destroy())
    this.stageImages = []
  }

  constructor (stage: Stage) {
    this.stage = stage
  }
}

export {
  StageIO
}
