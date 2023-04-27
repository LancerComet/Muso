class EventBus {
  private _callbacks: {[eventName: string]: EventBusCallback[]} = {}

  emit (eventName: string, value?: any) {
    const callbacks = this._callbacks[eventName]
    if (callbacks) {
      for (const func of callbacks) {
        typeof func === 'function' && func(value)
      }
    }
  }

  on (eventName: string, callback: EventBusCallback) {
    if (!this._callbacks[eventName]) {
      this._callbacks[eventName] = []
    }

    if (this._callbacks[eventName].indexOf(callback) < 0) {
      this._callbacks[eventName].push(callback)
    }
  }

  off (eventName: string, callback: EventBusCallback) {
    const callbacks = this._callbacks[eventName]
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  destroy () {
    Object.keys(this._callbacks).forEach(eventName => {
      this._callbacks[eventName] = undefined
    })
    this._callbacks = {}
  }
}

type EventBusCallback = (...args: any[]) => void

const eventBus = new EventBus()

export {
  eventBus,
  EventBusCallback
}
