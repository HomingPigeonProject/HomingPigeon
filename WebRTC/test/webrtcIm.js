// grab the room from the URL
var room = location.search && location.search.split('?')[1];




// create our webrtc connection
var webrtc = new SimpleWebRTC({
    // the id/element dom element that will hold "our" video
    localVideoEl: 'localVideo',
    // the id/element dom element that will hold remote videos
    remoteVideosEl: '',
    // immediately ask for camera access
    autoRequestMedia: true,
    debug: false,
    detectSpeakingEvents: true,

    enableDataChannels: true,

    url: "http://localhost:8888/"

    /* TODO
    url: ,
    socketio: ,
    (connection): , ?
    ...
    */
});




/* ------------------- */
/*    Event Handlers   */
/* ------------------- */

// when it's ready, join if we got a room from the URL
webrtc.on('readyToCall', function () {
    // you can name it anything
    if (room) webrtc.joinRoom(room);
});

webrtc.on('channelMessage', function (peer, label, data) {
  // Only handle messages from your dataChannel

  // TODO : Prints the message

  if(label == 'messagechannel') {
    console.log(data);
  }

  /*
  if (label !== 'text chat') return;
  else if (data.type == 'chat') {
    console.log('Received message: ' + data.payload + ' from ' + peer.id);
  }
  */
});



webrtc.on('videoAdded', function (video, peer) {
    console.log('video added', peer);
    var remotes = document.getElementById('remotes');
    if (remotes) {
        // we create a div element
        var d = document.createElement('div');
        // which is a video container
        d.className = 'videoContainer';
        d.id = 'container_' + webrtc.getDomId(peer);
        d.appendChild(video);
        var vol = document.createElement('div');
        vol.id = 'volume_' + peer.id;
        vol.className = 'volume_bar';
        video.onclick = function () {
            video.style.width = video.videoWidth + 'px';
            video.style.height = video.videoHeight + 'px';
        };
        d.appendChild(vol);
        remotes.appendChild(d);
    }
});
webrtc.on('videoRemoved', function (video, peer) {
    console.log('video removed ', peer);
    var remotes = document.getElementById('remotes');
    var el = document.getElementById('container_' + webrtc.getDomId(peer));
    if (remotes && el) {
        remotes.removeChild(el);
    }
});
webrtc.on('volumeChange', function (volume, treshold) {
    //console.log('own volume', volume);
    // TODO
    //showVolume(document.getElementById('localVolume'), volume);
});
// Since we use this twice we put it here
function setRoom(name) {
    $('form').remove();
    $('h1').text(name);
    $('#subTitle').text('Link to join: ' + location.href);
    $('body').addClass('active');
}
if (room) {
    // create the room
    setRoom(room);
} else {
    $('form').submit(function () {
        var val = $('#sessionInput').val().toLowerCase().replace(/\s/g, '-').replace(/[^A-Za-z0-9_\-]/g, '');
        webrtc.createRoom(val, function (err, name) {
            console.log(' create room cb', arguments);

            var newUrl = location.pathname + '?' + name;
            if (!err) {
                history.replaceState({foo: 'bar'}, null, newUrl);
                setRoom(name);
            } else {
                console.log(err);
            }
        });
        return false;
    });
}
