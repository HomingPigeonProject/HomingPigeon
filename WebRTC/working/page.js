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

    url: "https://localhost:8888/"

    /* TODO
    url: ,
    socketio: ,
    (connection): , ?
    ...
    */
});


if (room) {
    // create the room
    setRoom(room);
} else {
    var f = document.getElementById("createRoom");
    var sessionInput = document.getElementById("sessionInput");

    $(f).submit(function () {
        var val = $('#createRoomInput').val().toLowerCase().replace(/\s/g, '-').replace(/[^A-Za-z0-9_\-]/g, '');
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


/* ------------------- */
/*       Messages      */
/* ------------------- */

SimpleWebRTC.prototype.sendMessage= function(msg, event , peer, opts){
    this.webrtc.peers.forEach(function (peer) {
        if (peer.enableDataChannels) {
            var dataChannel =  peer.getDataChannel('messagechannel');
            peer.emit('addChannel', dataChannel);
            dataChannel.onopen = sendData;
            if (dataChannel.readyState === 'open')   sendData(dataChannel);
            return true;
        }

       function sendData(dataChannel) {
        dataChannel = dataChannel.send?dataChannel:dataChannel.srcElement;
        dataChannel.send(JSON.stringify(msg));
        };
  });
};


function sendMessage(msg) {
  var date =  new Date();
  var author = "Pierre";
  var importance = document.getElementById("importance-list").selectedIndex;


  // MESSAGE PROTOCOL
  var toSend = date + "-" + author + "-" + importance + "-" + msg;

  webrtc.sendMessage(toSend);
  displayMessage(msg, date, author, importance, 1);
}

function receiveMessage(data) {
  console.log("received bit");

  // DATA TREATMENT
  var pre = data.split("-");
  var date = pre[0];
  var author = pre[1];
  var importance = pre[2];
  var msg = pre.slice(3);

  displayMessage(msg, date, author, importance, 0);
}

function displayMessage(msg, date, author, importance, sender) {
    var ul = document.getElementById("chat-list");
    var li = document.createElement("li");

    var span = document.createElement("span");

    if (sender == 0) {
      // not the sender : left
      span.className = "chat-img pull-left";
      li.className = "left clearfix";
    } else {
      // it is the sender's message : right
      span.className = "chat-img pull-right";
      li.className = "right clearfix";
    }

        var img = document.createElement("img");
        img.src = "http://placehold.it/50/FA6F57/fff";
        img.alt = "User Avatar";
        img.className = "img-circle";
        span.appendChild(img);

      var div1 = document.createElement("div");
      div1.className = "chat-body clearfix";

        var div2 = document.createElement("div");
        div2.className = "header";

          var small = document.createElement("small");
          small.className = " text-muted"

          var i = document.createElement("i");
          i.className = "fa fa-clock-o fa-fw";

          var string = importance + " " + date.toString();
          var dateP = document.createTextNode(string);
          dateP.id="importance&date"
          small.appendChild(dateP);

          var strong = document.createElement("strong");
          strong.className = "pull-right primary-font";
          var authorP = document.createTextNode(author);
          strong.appendChild(authorP);

          div2.appendChild(small);
          div2.appendChild(strong);

        var p = document.createElement("p");
        var text = document.createTextNode(msg);
        p.appendChild(text);

        div1.appendChild(div2);
        div1.appendChild(p);

      li.appendChild(span);
      li.appendChild(div1);
      li.id = date + "-" + author + "-" + importance + "-" + msg;
    ul.appendChild(li);

}


/* ------------------- */
/*    Event Handlers   */
/* ------------------- */

document.getElementById("btn-chat").addEventListener("click", function() {
  var msg = document.getElementById("btn-input").value;
  sendMessage(msg);
}, false);


document.getElementById("imp-dl-btn").addEventListener("click", function() {
  var level = document.getElementById("importance-choice-dl").selectedIndex;

  // selecting every message with the same importance or higher

  var chatList = document.getElementById("chat-list");
  var children = chatList.children;

  var result = "";
  for (var i = 0; i < children.length; i++) {
    var item = children[i];
    var data = item.id;

    var pre = data.split("-");
    var importance = pre[2];

    // selecting enough importance
    if(importance >= level) {
      // treatment
      var date = pre[0];
      var author = pre[1];
      var msg = pre.slice(3);

      var string =  'Date: "' + date + '" Author: "' + author + '" Importance: "' + importance + '" Message: "' + msg + '";' + "\n";
      result += string;
    }
  }

  var filename = "summary.txt";
  var pom = document.createElement('a');
  pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(result));
  pom.setAttribute('download', filename);

  if (document.createEvent) {
    var event = document.createEvent('MouseEvents');
    event.initEvent('click', true, true);
    pom.dispatchEvent(event);
  }
  else {
    pom.click();
  }

}, false);

// when it's ready, join if we got a room from the URL
webrtc.on('readyToCall', function () {
    // you can name it anything
    if (room) webrtc.joinRoom(room);
});

webrtc.on('channelMessage', function (peer, label, data) {
  // Only handle messages from your dataChannel
  if(label == 'messagechannel') {
    console.log(data);
    receiveMessage(data);
  }
});

webrtc.on('videoAdded', function (video, peer) {
    console.log('video added', peer);
    var remotes = document.getElementById('remotes');
    if (remotes) {
        // we create a div element
        var d = document.createElement('div');
        // which is a video container
        d.className = 'videoContainer';
        d.id = 'container_video_' + webrtc.getDomId(peer);
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
    var vid = document.getElementById('container_video_' + webrtc.getDomId(peer));

    if (remotes) {
        if (el) {
          remotes.removeChild(el);
        }
        if (vid) {
          remotes.removeChild(vid);
        }
    }
});


webrtc.on('volumeChange', function (volume, treshold) {
    //console.log('own volume', volume);
    // TODO
    //showVolume(document.getElementById('localVolume'), volume);
});

// Since we use this twice we put it here
function setRoom(name) {
  var parent = document.getElementById("body");

  var child = document.getElementById("createRoom");
  parent.removeChild(child);

  child = document.getElementById("title");
  parent.removeChild(child);

  //$('#subTitle').text('Link to join: ' + location.href);
  $('body').addClass('active');
}



// File transfer
webrtc.on('createdPeer', function (peer) {
    //console.log('createdPeer', peer);
    var remotes = document.getElementById('remotes');
    if (!remotes) return;
    var container = document.createElement('div');
    container.className = 'peerContainer';
    container.id = 'container_' + webrtc.getDomId(peer);

    // show the peer id
    // TODO : show the username
    var peername = document.createElement('div');
    peername.className = 'peerName';
    peername.appendChild(document.createTextNode('Peer: ' + peer.id));
    container.appendChild(peername);

    // show a list of files received / sending
    var filelist = document.createElement('ul');
    filelist.className = 'fileList';
    container.appendChild(filelist);

    // show a file select form
    var fileinput = document.createElement('input');
    fileinput.type = 'file';

    // send a file
    fileinput.addEventListener('change', function() {
        fileinput.disabled = true;

        var file = fileinput.files[0];
        var sender = peer.sendFile(file);

        // create a file item
        var item = document.createElement('li');
        item.className = 'sending';

        // make a label
        var span = document.createElement('span');
        span.className = 'filename';
        span.appendChild(document.createTextNode(file.name));
        item.appendChild(span);

        span = document.createElement('span');
        span.appendChild(document.createTextNode(file.size + ' bytes'));
        item.appendChild(span);

        // create a progress element
        var sendProgress = document.createElement('progress');
        sendProgress.max = file.size;
        item.appendChild(sendProgress);

        // hook up send progress
        sender.on('progress', function (bytesSent) {
            sendProgress.value = bytesSent;
        });
        // sending done
        sender.on('sentFile', function () {
            item.appendChild(document.createTextNode('sent'));

            // we allow only one filetransfer at a time
            fileinput.removeAttribute('disabled');
        });
        // receiver has actually received the file
        sender.on('complete', function () {
            // safe to disconnect now
        });
        filelist.appendChild(item);
    }, false);
    fileinput.disabled = 'disabled';
    container.appendChild(fileinput);

    if (peer && peer.pc) {
        var connstate = document.createElement('div');
        connstate.className = 'connectionstate';
        container.appendChild(connstate);
        peer.pc.on('iceConnectionStateChange', function (event) {
            var state = peer.pc.iceConnectionState;
            console.log('state', state);
            container.className = 'peerContainer p2p' + state.substr(0, 1).toUpperCase()
                + state.substr(1);
            switch (state) {
            case 'checking':
                connstate.innerText = 'Connecting to peer...';
                break;
            case 'connected':
            case 'completed': // on caller side
                connstate.innerText = 'Connection established.';
                // enable file sending on connnect
                fileinput.removeAttribute('disabled');
                break;
            case 'disconnected':
                connstate.innerText = 'Disconnected.';
                break;
            case 'failed':
                // not handled here
                break;
            case 'closed':
                connstate.innerText = 'Connection closed.';

                // disable file sending
                fileinput.disabled = 'disabled';
                // FIXME: remove container, but when?
                break;
            }
        });
    }
    remotes.appendChild(container);

    // receiving an incoming filetransfer
    peer.on('fileTransfer', function (metadata, receiver) {
        console.log('incoming filetransfer', metadata);


        var item = document.createElement('li');
        item.className = 'receiving';

        // make a label
        var span = document.createElement('span');
        span.className = 'filename';
        span.appendChild(document.createTextNode(metadata.name));
        item.appendChild(span);

        span = document.createElement('span');
        span.appendChild(document.createTextNode(metadata.size + ' bytes'));
        item.appendChild(span);

        // create a progress element
        var receiveProgress = document.createElement('progress');
        receiveProgress.max = metadata.size;
        item.appendChild(receiveProgress);

        // hook up receive progress
        receiver.on('progress', function (bytesReceived) {
            receiveProgress.value = bytesReceived;
        });
        // get notified when file is done
        receiver.on('receivedFile', function (file, metadata) {
            console.log('received file', metadata.name, metadata.size);
            var href = document.createElement('a');
            href.href = URL.createObjectURL(file);
            href.download = metadata.name;
            href.appendChild(document.createTextNode('download'));
            item.appendChild(href);

            // close the channel
            receiver.channel.close();
        });
        filelist.appendChild(item);
    });

});
