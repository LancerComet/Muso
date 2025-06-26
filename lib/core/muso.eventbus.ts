type EventBusCallback = (...args: any[]) => void

class EventBus {
  private _callbacks: { [eventName: string]: EventBusCallback[] } = {}

  emit (eventName: string, value?: any): void {
    const callbacks = this._callbacks[eventName]
    if (callbacks) {
      // Create a copy to avoid issues with callbacks that modify the listeners
      const callbacksCopy = [...callbacks]
      for (const func of callbacksCopy) {
        try {
          if (typeof func === 'function') {
            func(value)
          }
        } catch (error) {
          console.error('Error in event callback:', error)
        }
      }
    }
  }

  on (eventName: string, callback: EventBusCallback): void {
    if (!this._callbacks[eventName]) {
      this._callbacks[eventName] = []
    }

    if (this._callbacks[eventName].indexOf(callback) < 0) {
      this._callbacks[eventName].push(callback)
    }
  }

  off (eventName: string, callback: EventBusCallback): void {
    const callbacks = this._callbacks[eventName]
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Remove all listeners for a specific event or all events
   */
  removeAllListeners (eventName?: string): void {
    if (eventName) {
      this._callbacks[eventName] = []
    } else {
      this._callbacks = {}
    }
  }

  destroy (): void {
    Object.keys(this._callbacks).forEach(eventName => {
      this._callbacks[eventName] = []
    })
    this._callbacks = {}
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount (eventName: string): number {
    return this._callbacks[eventName] ? this._callbacks[eventName].length : 0
  }
}

// Keep the global event bus for backward compatibility, but it will be phased out
const eventBus = new EventBus()

export {
  EventBus,
  eventBus,
  EventBusCallback
}
