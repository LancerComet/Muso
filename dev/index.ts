import { Muso } from '../lib'
import { StageImage } from '../lib/core/muso.stage.image'
import { HorizontalDirection, ScrollingMode } from '../lib/types'
import { EventType } from '../lib/types/event-type'
import './index.css'

const loadImg = (url: string) => {
  return new Promise<HTMLImageElement>(resolve => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.src = url
  })
}

const imageUrls = [
  'https://static.lancercomet.com/lancercomet/misc/MusoImages/001.png?imageView2/2/format/jpg',
  'https://static.lancercomet.com/lancercomet/misc/MusoImages/002.png?imageView2/2/format/jpg',
  'https://static.lancercomet.com/lancercomet/misc/MusoImages/003.png?imageView2/2/format/jpg',
  'https://static.lancercomet.com/lancercomet/misc/MusoImages/004.png?imageView2/2/format/jpg',
  'https://static.lancercomet.com/lancercomet/misc/MusoImages/005.png?imageView2/2/format/jpg',
  'https://static.lancercomet.com/lancercomet/misc/MusoImages/006.png?imageView2/2/format/jpg',
  'https://static.lancercomet.com/lancercomet/misc/MusoImages/007.png?imageView2/2/format/jpg',
  'https://static.lancercomet.com/lancercomet/misc/MusoImages/008.png?imageView2/2/format/jpg'
]

const main = async () => {
  const placeholderImg = await loadImg('logo.png')

  // Reader.
  let scrollingMode: ScrollingMode = ScrollingMode.Horizontal

  const muso = new Muso({
    scrollingMode,
    renderingImageCount: 5,
    stageColor: '#111',
    placeholder: placeholderImg,
    otherPageAlpha: () => scrollingMode === ScrollingMode.Vertical
      ? 1
      : 0.3
  })

  muso.on(EventType.TouchStart, () => {
    console.log('Touch start')
  })

  muso.on(EventType.Swipe, direction => {
    console.log('Swipe:', direction)
  })

  muso.on(EventType.ScrollingMode, (mode: ScrollingMode) => {
    console.log('Scrolling mode changed:', mode)
    scrollingMode = mode
  })

  muso.on(EventType.Paging, page => {
    console.log('Paging:', page)
  })

  muso.on(EventType.ImageLoadingFailure, (image: StageImage) => {
    console.error('Image load failure:', image)
  })

  const canvas = document.querySelector('#muso') as HTMLCanvasElement
  muso.mount(canvas)

  // Add images.
  imageUrls.forEach(url => muso.addImage(url))

  // Control btns.
  const prevBtn = document.getElementById('prev-btn')
  prevBtn.addEventListener('click', () => muso.goPrevPage())

  const nextBtn = document.getElementById('next-btn')
  nextBtn.addEventListener('click', () => muso.goNextPage())

  const rtlBtn = document.getElementById('rtl-btn')
  rtlBtn.addEventListener('click', () => {
    muso.setScrollingMode(ScrollingMode.Horizontal)
    muso.setHorizontalDirection(HorizontalDirection.RTL)
  })

  const ltrBtn = document.getElementById('ltr-btn')
  ltrBtn.addEventListener('click', () => {
    muso.setScrollingMode(ScrollingMode.Horizontal)
    muso.setHorizontalDirection(HorizontalDirection.LTR)
  })

  const verticalBtn = document.getElementById('vertical-btn')
  verticalBtn.addEventListener('click', () => {
    muso.setScrollingMode(ScrollingMode.Vertical)
  })

  // Keyboard.
  window.addEventListener('keyup', event => {
    const key = event.key
    if (key === 'ArrowLeft') {
      muso.goPrevPage()
    } else if (key === 'ArrowRight') {
      muso.goNextPage()
    } else if (key === 'Home') {
      muso.goTargetPage(0)
    } else if (key === 'End') {
      muso.goTargetPage(imageUrls.length - 1)
    }
  })

  window.addEventListener('wheel', event => {
    const deltaY = event.deltaY
    if (deltaY > 0) {
      muso.goNextPage()
    } else {
      muso.goPrevPage()
    }
  })
}

main()
