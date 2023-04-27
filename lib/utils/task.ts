let jobTimer = null

abstract class TaskUtils {
  static nextTick (func: (...args: any[]) => any) {
    Promise.resolve().then(() => {
      typeof func === 'function' && func()
    })
  }

  static nextJob (func: (...args: any[]) => any) {
    clearTimeout(jobTimer)
    jobTimer = setTimeout(() => {
      typeof func === 'function' && func()
    }, 1)
    return jobTimer
  }
}

export {
  TaskUtils
}
