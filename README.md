# Muso

![logo](static/logo.png)

Yet another photo viewer. Especially designed for manga reading.

Is implemented in canvas to have the native-like touching experience.

## Feature

- Implement in canvas. Native-like touching experience.
- Reactive sizing. Suitable for all type of devices.
- Three viewing mode: left swipe, right swipe, vertical scrolling.
- Zero dependency.

## Demo

 - [Demo](https://lancercomet.github.io/Muso/) - This is a basic demo showing a fullscreen Muso. 
 - [Bilibili Manga](https://manga.bilibili.com/m/mc28201/463667) - Please use mobile device to visit this page, otherwise it will redirect to the desktop version which is nothing to do with Muso. And this Muso is a little different from the one in the repo, some bugs are not fixed yet, and the animation is too fast if the refresh rate is > 60 fps.

## Quick Start

```ts
import { Muso } from '@lancercomet/muso'

const myCanvas = document.querySelector('#my-canvas')
const muso = new Muso({...})
muso.mount(myCanvas)
```

## API

```ts
class Muso {
  // Mount to target canvas element.
  mount (canvas: HTMLCanvasElement): void
  
  // Destroy muso instance.
  destroy (): void

  // Add an image to the end.  
  addImage (url: string): number
  
  // Prepend an image to the front.
  prependImage (url: string): number
  
  // Remove an image at specific index.
  removeImage (index: number): void
  
  // Reload target index.
  reload (index: number): void
  
  // Pagination.
  goPrevPage(): void
  goNextPage(): void
  goTargetPage(page: number): void

  // Set scrolling mode.
  setScrollingMode(mode: ScrollingMode): void
  
  // Set flip direction in Horizontal scrolling mode.
  setHorizontalDirection (direction: HorizontalDirection): Promise<void>
  
  // Events.
  on(eventName: EventType, callback: EventBusCallback): void
  off(eventName: EventType, callback: EventBusCallback): void
  
  constructor(option?: Partial<IMusoOption>)
}
```

```ts
interface IMusoOption {
  /**
   * Enable auto resizing.
   * 
   * @default true
   */
  autoResizing: boolean

  /**
   * The background color of Muso.
   * 
   * @default #222
   */
  stageColor: string

  /**
   * The padding around every images.
   * 
   * @default 0
   */
  stagePadding: number

  /**
   * How many pixels should user swipe to trigger paging.
   * 
   * @default 150
   */
  swipeDistanceOfPaging: number

  /**
   * How many images to display at same time.
   * 
   * @default 5
   */
  renderingImageCount: number

  /**
   * The flip direction in Horizontal Scrolling Mode.
   * 
   * @default HorizontalDirection.LTR
   */
  horizontalDirection: HorizontalDirection

  /**
   * The max display width of the image.
   * 
   * @default () => 0
   */
  maxWidth: () => number

  /**
   * The min display width of the image.
   *
   * @default () => 0
   */
  minWidth: () => number

  /**
   * The max display height of the image.
   *
   * @default () => 0
   */
  maxHeight: () => number

  /**
   * The min display height of the image.
   *
   * @default () => 0
   */
  minHeight: () => number

  /**
   * The image will scale to 1.0 if the current scale factor is less than this value.
   * 
   * @default 1.3
   */
  restoreScaleRate: number

  /**
   * The scrolling mode of Muso.
   * Horizontal and Vertical.
   * 
   * @default ScrollingMode.Horizontal
   */
  scrollingMode: ScrollingMode

  /**
   * If true, built-in input will be unavailable (like touching).
   * You can use the "swiper" object to manipulate Muso.
   * 
   * @default false
   */
  noDefaultControl: boolean

  /**
   * This function will be invoked before every single image was loaded. 
   * 
   * @default null
   */
  beforeImageLoad: (url: string) => Promise<string>

  /**
   * The acceleration ratio in vertical scrolling mode.
   * 
   * @default 1.35
   */
  vTouchMoveAcc: number

  /**
   * The acceleration ratio for zooming.
   * 
   * @default 1.05
   */
  zoomTouchMoveAcc: number

  /**
   * The placeholder image.
   * 
   * @default null
   */
  placeholder: HTMLImageElement | HTMLCanvasElement | ImageBitmap

  /**
   * Image loading timeout.
   * 
   * @default 5000
   */
  imageTimeout: number

  /**
   * The rendering alpha for non current page.
   * 
   * @default 1
   */
  otherPageAlpha: () => number
}
```

```ts
enum ScrollingMode {
  Horizontal = "horizontal",
  Vertical = "vertical"
}

enum HorizontalDirection {
  LTR = "ltr",
  RTL = "rtl"
}
```

```ts
enum EventType {
  EnterDuoTouch = "enter-double-touch",
  ImageLoadingFailure = "image-loading-failure",
  LeaveDuoTouch = "leave-double-touch",
  MouseWheel = "mousewheel",
  ScrollingMode = "scrolling-mode",
  Swipe = "touch-swipe",
  TouchStart = "touch-start",
  TouchMove = "touch-move",
  TouchEnd = "touch-end",
  TouchMoveX = "touch-move-x",
  TouchMoveY = "touch-move-y",
  Paging = "paging",
  Resize = "resize",
  Zooming = "zooming",
  ZoomCenterMove = "zoom-center-move"
}
```

## License

Apache-2.0

Logo was generated by MidJourney.
