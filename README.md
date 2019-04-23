# MediaStream-GifRecorder
This library provides an implementation of the [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) interface for recording MediaStreams, such as those from a webcam or desktop capture, to GIFs.

## Basic Usage
The following will record a 5 seconds GIF at 5 frames per second.
```
navigator.mediaDevices.getUserMedia({ video: true })
.then((stream) => {
  document.getElementById('preview-video').srcObject = stream

  let recorder = new GifRecorder(stream, {
    videoFramesPerSecond: 5,
    videoQuality: 10,
    videoDithering: false,
  })

  recorder.addEventListener('dataavailable', (e) => {
    document.getElementById('preview-gif').src = URL.createObjectURL(e.data)
  })

  recorder.start()

  setTimeout(() => {
    recorder.stop()
  }, 5000)
})
.catch((err) => {
  console.log(err)
}
```
