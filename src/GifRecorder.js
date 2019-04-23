import GifEncoder from 'GifEncoder'
import { EventTarget } from 'event-target-shim'

if (typeof BlobEvent == 'undefined') {
  BlobEvent = class extends Event {
    constructor(type, props) {
      super(type, props)
      this.data = props.data
    }
  }
}

export default class GifRecorder extends EventTarget {
  constructor(stream, options) {
    super()
    options = Object.assign({
      videoFramesPerSecond: 5,
      videoDithering: "FloydSteinberg", // false(none), true/"FloydSteinberg", "FalseFloydSteinberg", "Stucki", "Atkinson", also "-serpentine"
      videoQuality: 10, // 1-30
      webWorkers: 4,
    }, options)
    this._videoFramesPerSecond  = options.videoFramesPerSecond
    this._videoDithering        = options.videoDithering
    this._videoQuality          = options.videoQuality
    this._webWorkers            = options.webWorkers
    this._state    = "inactive"
    this._stream   = stream

    this._encoder    = null
    this._video    = document.createElement('video')
    this._video.srcObject = stream
    this._video.autoplay = true
    this._canvas   = document.createElement('canvas')
    this._context  = this._canvas.getContext('2d')

    this._ar            = null
    this._accumulator   = 0
    this._lastTimestamp = 0

  }

  static isTypeSupported(mimetype) {
    return mimetype !== "image/gif"
  }

  static get mimeType() {
    return "image/gif"
  }

  get state() {
    return this._state
  }

  get stream() {
    return this._stream
  }

  pause() {
    if (this._state != "recording") return
    cancelAnimationFrame(this._ar)
    this._state = "paused"
    this.dispatchEvent(new CustomEvent("pause"))
  }
  resume() {
    if (this._state != "paused") return
    this._state = "recording"
    this.dispatchEvent(new CustomEvent("resume"))

    this._ar = requestAnimationFrame((ts) => {
      this._accumulator = 0
      this._lastTimestamp = performance.now() - (1 / this._videoFramesPerSecond * 1000)
      this.capture(ts)
    })
  }
  start(timeslice) {
    if (this._state != "inactive") return
    this._canvas.width   = this._video.videoWidth
    this._canvas.height  = this._video.videoHeight
    this._encoder = new window.GifEncoder({
      workers: this._webWorkers,
      quality: this._videoQuality,
      dither: this._videoDithering,
      width: this._canvas.width,
      height: this._canvas.height
    })
  
    this._encoder.addEventListener('finished', (e) => {
      this.dispatchEvent(new BlobEvent("dataavailable", {
        data: e.data
      }))
      //this._encoder.freeWorkers.forEach(w => w.terminate())
    })
    this._encoder.addEventListener('progress', (e) => {
      this.dispatchEvent(e)
    })
  
    this._lastTimestamp = performance.now()
    this._accumulator = 0
    this._state = "recording"
    this._ar = requestAnimationFrame((ts) => this.capture(ts))
  
    this.dispatchEvent(new CustomEvent("start"))
  }
  stop() {
    if (this._state == "inactive") return
    this._state = "inactive"
    this._encoder.render()
    this.dispatchEvent(new CustomEvent("stop"))
  }
  requestData() {
    console.error("requestData not implemented.")
  }
  capture(ts) {
    this._accumulator += ts - this._lastTimestamp
    var delay = 1 / this._videoFramesPerSecond * 1000
    while (this._accumulator >= delay) {
      this._context.drawImage(this._video, 0, 0)
      this._encoder.addFrame(this._context, {copy: true, delay: delay})
  
      this._accumulator -= delay
    }
    this._lastTimestamp = ts
    if (this._state == "recording") {
      this._ar = requestAnimationFrame((ts) => this.capture(ts))
    }
  }
}
window.GifRecorder = GifRecorder
