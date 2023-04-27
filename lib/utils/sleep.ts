abstract class SleepUtils {
  static sleep (time: number) {
    return new Promise(resolve => {
      setTimeout(resolve, time)
    })
  }
}

export {
  SleepUtils
}
