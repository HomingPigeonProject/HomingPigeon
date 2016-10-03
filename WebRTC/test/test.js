var signalingServer = 'http://localhost:8888';


var webrtc = new SimpleWebRTC({
  url: signalingServer,
  //socketio:
  //connection:


  enableDataChannels: true,
  media: { video: true, audio: true },

  // the id/element dom element that will hold "our" video
  localVideoEl: 'localVideo',
  // the id/element dom element that will hold remote videos
  remoteVideosEl: 'remoteVideos',
  // immediately ask for camera access
  autoRequestMedia: true

});

// we have to wait until it's ready
webrtc.on('readyToCall', function () {
    // you can name it anything
    webrtc.joinRoom('your awesome room name');
});


webrtc.on('connectionReady', function (sessionId) {
    // ...
})

function createRoom() {
  createRoom('myroom');
  joinRoom('myroom', callback);
}

function pauseVideoAndAudio() {
  webrtc.pause();
}
function resumeVideoAndAudio() {
  webrtc.resume();
}
