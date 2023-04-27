import { ScrollingMode } from '../types'
import { EventType } from '../types/event-type'
import { eventBus } from './muso.eventbus'
import { Stage } from './muso.stage'

class StageResizer {
  private stage: Stage = null
  private enabled: boolean = false

  private async onResize (event: Event) {
    if (this.enabled) {
      this.stage.setCanvasSize()
      await this.stage.updateAllImagesPosition()
      if (this.stage.scrollingMode === ScrollingMode.Vertical) {
        this.stage.setVerticalQueueOffsetByPage()
      }
      eventBus.emit(EventType.Resize, event)
    }
  }

  enable () {
    this.enabled = true
  }

  disable () {
    this.enabled = false
  }

  destroy () {
    window.removeEventListener(EventType.Resize, this.onResize)
    this.onResize = null
  }

  constructor (stage: Stage) {
    this.stage = stage
    this.onResize = this.onResize.bind(this)
    window.addEventListener('resize', this.onResize)
  }
}

export {
  StageResizer
}
