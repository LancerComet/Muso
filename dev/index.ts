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
  'https://cdn.discordapp.com/attachments/1022482470068826162/1101171634729127936/LancerComet_Many_coins_popped_out_from_two_girls_bilibili_22_33_0deda81d-53c9-4c0a-95cf-a3c0440bd2f5.png',
  'https://cdn.discordapp.com/attachments/1022482470068826162/1098518866369450004/LancerComet_Many_coins_popped_out_from_two_girls_bilibili_22_33_d6e038e5-57d2-48fd-bf79-c11b976b6199.png',
  'https://cdn.discordapp.com/attachments/1022482470068826162/1098518869586477138/LancerComet_Many_coins_popped_out_from_two_girls_bilibili_22_33_c8554f08-40e8-44a8-9911-d845ba000133.png',
  'https://cdn.discordapp.com/attachments/1022482470068826162/1089860274514829372/LancerComet_a_catgirl_walking_on_the_street_in_traditional_chin_c7b84bbb-9ef8-463a-ade2-9b06a71a82fc.png',
  'https://cdn.discordapp.com/attachments/1022482470068826162/1101172129497632879/LancerComet_an_image_that_presents_the_file_caching_black_and_w_49c20d40-32a9-45ad-9b2a-f1ace655f697.png',
  'https://cdn.discordapp.com/attachments/1022482470068826162/1101174246899712104/LancerComet_a_picture_of_city_scene_black_and_white_japanese_ma_770bf965-74a3-4dff-818c-e390bafa5662.png',
  'https://cdn.discordapp.com/attachments/1022482470068826162/1098152458846470165/LancerComet_an_image_that_presents_the_file_caching_black_and_w_567e0751-ae9d-4b5e-9dd0-fa1df570f301.png',
  'https://cdn.discordapp.com/attachments/1022482470068826162/1098152018801078313/LancerComet_an_image_that_presents_the_file_caching_d2ede472-b362-495c-a52a-f72ca28be29d.png'
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
}

main()
