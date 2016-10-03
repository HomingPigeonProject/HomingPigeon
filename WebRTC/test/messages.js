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


  document.getElementById("btn-chat").addEventListener("click", function() {
    var msg = document.getElementById("btn-input").value;
    //window.alert("hehe");
    // console.log(msg);
    webrtc.sendMessage(msg);

    // prints the message

  }, false);
