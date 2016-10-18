var socket = io.connect('http://localhost:30000');
console.log("pas d'erreurs ????");
  $('#chatEntries').append('<div class="message"></p>' + pseudo + ' : ' + msg +   '</p></div>');
}

function sentMessage(){
    if ($('#messageInput').val() != ""){
      socket.emit('message', $('#messageInput').val());
      addMessage($('#messageInput').val(), "Me" , new Date().toISOString(), true);
      $('#messageInput').val('');
    }
}

function setPseudo(){
  if ($('#pseudoInput').val() != "" ){
    socket.emit('setPseudo',$('#pseudoInput').val());
    $("#chatControls").show();
    $("#pseudoInput").hide();
    $("#pseudoSet").hide();
  }
}

socket.on('message', function(date){
    addMessage(data['message'], data['pseudo']);
});

$(function(){
  $("#chatControls").hide();
  $("#pseudoSet").click(function(){setPseudo()});
  $("#submit").click(function(){sentMessage()});
});
