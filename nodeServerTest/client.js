var logined = false;
var server = io.connect('http://localhost:4000');

window.addEventListener('load', function() {
	var controlDiv = document.getElementById('control');

	server.on('connect', function() {
		console.log('connected to server');
	});
	server.on('reconnect', function() {
		console.log('reconnected to server');
		reset();
	});
	server.on('disconnect', function() {
		console.log('diconnected from server');
		logined = false;
	});
	server.on('error', function() {
		console.log('connection error');
	});

	server.on('login', function(data) {
		console.log(data);
		if (data.status == 'success') {
			$('#loginStatus').text('status : logined');
			logined = true;
			$('#control').append("<button id='getContactList' type='button'>get contact list</button>");
			$('#control').append("<button id='getPendingContactList' type='button'>get pending contact list</button>");
			$('#getContactList').click(function() {
				server.emit('getContactList');
			});
			$('#getPendingContactList').click(function() {
				server.emit('getPendingContactList');
			});

			// set profile
			me = data.data;

			// create contact list manage panel
			var contactForm = document.createElement('form');
			var contactInput = document.createElement('input');
			var contactAddButton = document.createElement('button');
			var contactRemoveButton = document.createElement('button');
			var contactAcceptButton = document.createElement('button');
			var contactDenyButton = document.createElement('button');
			var contactChatButton = document.createElement('button');

			contactForm.action = 'javascript:void(0);';

			contactInput.id = 'contactInput';
			contactInput.placeholder = 'put contact email';
			contactInput.type = 'text';

			contactAddButton.id = 'contactAddButton';
			contactAddButton.type = 'button';
			contactAddButton.innerHTML = 'add contact';

			contactRemoveButton.id = 'contactRemoveButton';
			contactRemoveButton.type = 'button';
			contactRemoveButton.innerHTML = 'remove contact';

			contactAcceptButton.id = 'contactAcceptButton';
			contactAcceptButton.type = 'button';
			contactAcceptButton.innerHTML = 'accept contact';

			contactDenyButton.id = 'contactDenyButton';
			contactDenyButton.type = 'button';
			contactDenyButton.innerHTML = 'deny contact';

			contactChatButton.id = 'contactChatButton';
			contactChatButton.type = 'button';
			contactChatButton.innerHTML = 'create contact chat';

			contactForm.appendChild(contactInput);
			contactForm.appendChild(contactAddButton);
			contactForm.appendChild(contactRemoveButton);
			contactForm.appendChild(contactAcceptButton);
			contactForm.appendChild(contactDenyButton);
			contactForm.appendChild(contactChatButton);

			var groupListButton = document.createElement('button');
			groupListButton.id = 'groupListButton';
			groupListButton.type = 'button';
			groupListButton.innerHTML = 'get group list';

			var groupForm = document.createElement('form');
			var groupNameInput = document.createElement('input');
			var memberNameInput = document.createElement('input');
			var groupAddButton = document.createElement('button');
			var inviteMemberButton = document.createElement('button');
			var exitGroupButton = document.createElement('button');
			groupNameInput.id = 'groupNameInput';
			groupNameInput.placeholder = 'put group name or id';
			groupNameInput.type = 'text';
			memberNameInput.id = 'memberNameInput';
			memberNameInput.placeholder = 'put member email(a, b, c)';
			memberNameInput.type = 'text';
			groupAddButton.id = 'groupAddButton';
			groupAddButton.type = 'button';
			groupAddButton.innerHTML = 'add group';
			inviteMemberButton.id = 'inviteMemberButton';
			inviteMemberButton.type = 'button';
			inviteMemberButton.innerHTML = 'invite contacts';
			exitGroupButton.id = 'exitGroupButton';
			exitGroupButton.type = 'button';
			exitGroupButton.innerHTML = 'exit group';

			groupForm.appendChild(groupNameInput);
			groupForm.appendChild(memberNameInput);
			groupForm.appendChild(groupAddButton);
			groupForm.appendChild(inviteMemberButton);
			groupForm.appendChild(exitGroupButton);

			var chatControlTitle = document.createElement('p');
			var chatForm = document.createElement('form');
			var groupIdInput = document.createElement('input');
			var chatJoinButton = document.createElement('button');
			var chatRefreshButton = document.createElement('button');
			chatControlTitle.innerHTML = 'Join chat';
			groupIdInput.id = 'groupIdInput';
			groupIdInput.placeholder = 'put group id for chat';
			groupIdInput.type = 'text';
			chatJoinButton.id = 'chatJoinButton';
			chatJoinButton.type = 'button';
			chatJoinButton.innerHTML = 'join chat';
			chatRefreshButton.id = 'chatRefreshButton';
			chatRefreshButton.type = 'button';
			chatRefreshButton.innerHTML = 'refresh';

			chatForm.appendChild(groupIdInput);
			chatForm.appendChild(chatJoinButton);
			chatForm.appendChild(chatRefreshButton);
			
			var eventListButton = document.createElement('button');
			eventListButton.id = 'eventListButton';
			eventListButton.type = 'button';
			eventListButton.innerHTML = 'get event list';

			var eventForm = document.createElement('form');
			var eventNameInput = document.createElement('input');
			var participantNameInput = document.createElement('input');
			var eventAckInput = document.createElement('input');
			var eventDescInput = document.createElement('input');
			var eventDateInput = document.createElement('input');
			var eventLLocationInput = document.createElement('input');
			var eventLDateInput = document.createElement('input');
			var eventCreateButton = document.createElement('button');
			var eventExitButton = document.createElement('button');
			var eventAckButton = document.createElement('button');
			eventNameInput.id = 'eventNameInput';
			eventNameInput.placeholder = 'put event name or id';
			eventNameInput.type = 'text';
			participantNameInput.id = 'participantNameInput';
			participantNameInput.placeholder = 'put participants emails, ack';
			participantNameInput.type = 'text';
			eventDescInput.id = 'eventDescInput';
			eventDescInput.placeholder = 'event description';
			eventDescInput.type = 'text';
			eventDescInput.style.height='100px';
			eventAckInput.id = 'eventAckInput';
			eventAckInput.placeholder = 'event ack';
			eventAckInput.type = 'text';
			eventDateInput.id = 'eventDateInput';
			eventDateInput.placeholder = 'event description';
			eventDateInput.type = 'datetime-local';
			eventLLocationInput.id = 'eventLLocationInput';
			eventLLocationInput.placeholder = 'location';
			eventLLocationInput.type = 'text';
			eventLDateInput.id = 'eventLDateInput';
			eventLDateInput.placeholder = 'event description';
			eventLDateInput.type = 'datetime-local';
			eventCreateButton.id = 'eventCreateButton';
			eventCreateButton.type = 'button';
			eventCreateButton.innerHTML = 'create event';
			eventExitButton.id = 'eventExitButton';
			eventExitButton.type = 'button';
			eventExitButton.innerHTML = 'exit event';
			eventAckButton.id = 'eventAckButton';
			eventAckButton.type = 'button';
			eventAckButton.innerHTML = 'ack event';
			
			eventForm.appendChild(eventNameInput);
			eventForm.appendChild(participantNameInput);
			eventForm.appendChild(eventCreateButton);
			eventForm.appendChild(eventExitButton);
			eventForm.appendChild(eventAckButton);
			
			eventDescInput.value = 'fff';
			eventDateInput.value = '2016-12-03T18:45';
			
			eventNameInput.value = 'test event';
			participantNameInput.value = 'korea@kaist.ac.kr';
			
			var eventSecondLine = document.createElement('div');
			eventSecondLine.appendChild(eventDescInput);
			eventSecondLine.appendChild(eventDateInput);
			eventSecondLine.appendChild(eventLLocationInput);
			eventSecondLine.appendChild(eventLDateInput);
			
			controlDiv.appendChild(contactForm);
			controlDiv.appendChild(groupListButton);
			controlDiv.appendChild(groupForm);
			controlDiv.appendChild(chatControlTitle);
			controlDiv.appendChild(chatForm);
			controlDiv.appendChild(eventListButton);
			controlDiv.appendChild(eventForm);
			controlDiv.appendChild(eventSecondLine);

			$('#eventAckButton').click(function() {
				server.emit('eventAck', {eventId: $('#eventNameInput').val(), 
					ack: $('#participantNameInput').val()});
			});
			$('#eventExitButton').click(function() {
				server.emit('eventExit', {eventId: $('#eventNameInput').val()});
			});
			$('#eventCreateButton').click(function() {
				var participants = $('#participantNameInput').val().split(',');
				for (var i = 0; i < participants.length; i++) 
					participants[i] = participants[i].trim();
				
				function parseYMDHM(s) {
					if (!s)
						return s;
					
					// regex match non digit(\D) character '+'
				    var b = s.split(/\D+/);
					return new Date(b[0], --b[1], b[2], b[3], b[4], b[5]||0, b[6]||0).getTime();
				}
				
				var date = parseYMDHM($('#eventDateInput').val());
				var ldate = parseYMDHM($('#eventLDateInput').val());
				
				var localization = {location: $('#eventLLocationInput').val(), 
						date: ldate};
				if (!localization.location || !localization.date)
					localization = null;
				
				server.emit('createEvent', {name: $('#eventNameInput').val(),
					participants: participants, description: $('#eventDescInput').val(), 
					date: date, localization: localization});
			});
			$('#eventListButton').click(function() {
				server.emit('getEventList');
			});
			$('#chatRefreshButton').click(function() {
				if (chatRoom.groupId)
					server.emit('readMessage', {groupId: chatRoom.groupId});
			});
			$('#chatJoinButton').click(function() {
				var groupId = $('#groupIdInput').val();
				$('.chat').html('');
				setGroup(groupId);
				server.emit('readMessage', {groupId: groupId});
				console.log('start chat in group ' + groupId);
			});
			$('#contactAddButton').click(function() {
				server.emit('addContact', { email: $('#contactInput').val() });
			});
			$('#contactRemoveButton').click(function() {
				server.emit('removeContact', { email: $('#contactInput').val() });
			});
			$('#contactAcceptButton').click(function() {
				server.emit('acceptContact', { email: $('#contactInput').val() });
			});
			$('#contactDenyButton').click(function() {
				server.emit('denyContact', { email: $('#contactInput').val() });
			});
			$('#contactChatButton').click(function() {
				server.emit('joinContactChat', { email: $('#contactInput').val() });
			});
			$('#groupListButton').click(function() {
				server.emit('getGroupList');
			});
			$('#groupAddButton').click(function() {
				var members = $('#memberNameInput').val().split(',');
				for (var i = 0; i < members.length; i++)
					members[i] = members[i].trim();

				server.emit('addGroup', {name: $('#groupNameInput').val(),
					members: members});
			});
			$('#inviteMemberButton').click(function() {
				var members = $('#memberNameInput').val().split(',');
				for (var i = 0; i < members.length; i++)
					members[i] = members[i].trim();

				server.emit('inviteGroupMembers', {groupId: $('#groupNameInput').val(),
					members: members});
			});
			$('#exitGroupButton').click(function() {
				server.emit('exitGroup', {groupId: $('#groupNameInput').val()});
			});
		}
	});
	server.on('eventStarted', function(data) {
		console.log('eventStarted');
		console.log(data);
	});
	server.on('eventAck', function(data) {
		console.log('eventAck');
		console.log(data);
	});
	server.on('eventParticipantExited', function(data) {
		console.log('eventParticipantExited');
		console.log(data);
	});
	server.on('eventExit', function(data) {
		console.log('eventExit');
		console.log(data);
	});
	server.on('eventCreated', function(data) {
		console.log('eventCreated');
		console.log(data);
	});
	server.on('readMessage', function(data) {
		console.log('readMessage');
		console.log(data);
		if (data.status == 'success') {
			addOldMessages(data.messages);
		}
		if (data.messages.length > 0) {
			var ackEnd = data.messages[0].messageId;
			var ackStart = data.messages[data.messages.length - 1].messageId;
			server.emit('ackMessage', {groupId: data.messages[0].groupId,
				ackStart: ackStart, ackEnd: ackEnd});
		}
	});
	server.on('sendMessage', function(data) {
		console.log('sendMessage');
		console.log(data);
	});
	server.on('messageAck', function(data) {
		console.log('ack');
		console.log(data);
	});
	server.on('newMessage', function(data) {
		// if message was sent for the chat
		if (chatRoom.groupId == data.groupId) {
			//console.log(chatRoom.members);
			if (data.userId == me.userId)
				addMyMessage(data.content, chatRoom.members[data.userId].nickname, data.date.toString(),
						data.importance, data.nbread);
			else {
				addMessage(data.content, chatRoom.members[data.userId].nickname, data.date.toString(),
						data.importance, data.nbread);
				server.emit('ackMessage', {groupId: data.groupId,
					ackStart: data.messageId, ackEnd: data.messageId});
			}
		} else {
			var str = data.content;
			if (chatRoom.members[data.userId] != undefined) {
				str = chatRoom.members[data.userId].nickname + " \n" + str;
			}
			notifyMessage(str);
			
			// else, it is a notification
			console.log('newMessage');
			console.log(data);
		}
	});
	server.on('membersInvited', function(data) {
		console.log('membersInvited');
		console.log(data);
		var group = getGroup(data.groupId);
		
		data.members.forEach(function(member) {
			addMember(group, member);
		});
	});
	server.on('membersExit', function(data) {
		console.log('membersExit');
		console.log(data);
		var group = getGroup(data.groupId);
		
	});
	server.on('exitGroup', function(data) {
		if (data.status == 'success') {
			console.log('exited group!');
			console.log(data);
		} else {
			console.log('failed to exit group...');
		}
	});
	server.on('inviteGroupMembers', function(data) {
		if (data.status == 'success') {
			console.log('invited group members!');
			console.log(data);
		} else {
			console.log('failed to invite group members...');
		}
	});
	server.on('addGroup', function(data) {
		if (data.status == 'success') {
			console.log('added group!');
			console.log(data);
			groups.push(data.group);
		} else {
			console.log('failed to add group...');
		}
	});
	server.on('contactChatRemoved', function(data) {
		console.log('contact chat removed');
		console.log(data);
	});
	server.on('joinContactChat', function(data) {
		if (data.status == 'success') {
			console.log('contact chat created');
			console.log(data);
			groups.push(data);
		} else {
			console.log('failed to create contact chat');
		}
	});
	server.on('contactDenied', function(data) {
		console.log('contact denied');
		console.log(data);
	});
	server.on('newContact', function(data) {
		console.log('new contact!');
		console.log(data);
	});
	server.on('newPendingContact', function(data) {
		console.log('new pending contact!');
		console.log(data);
	});
	server.on('acceptContact', function(data) {
		if (data.status == 'success') {

		} else {
			console.log('failed to accept contact...');
		}
	});
	server.on('denyContact', function(data) {
		if (data.status == 'success') {

		} else {
			console.log('failed to deny contact...');
		}
	});
	server.on('addContact', function(data) {
		if (data.status == 'success') {

		} else {
			console.log('failed to add contact...');
		}
	});
	server.on('contactRemoved', function(data) {
		console.log('removed contact!');
		console.log(data);
	});
	server.on('removeContact', function(data) {
		if (data.status == 'success') {

		} else {
			console.log('failed to remove contact...');
		}
	});
	server.on('getEventList', function(data) {
		if (data.status == 'success')
			console.log(data);
	});
	server.on('getGroupList', function(data) {
		if (data.status == 'success') {
			console.log(data);
			groups = data.groups;
			//console.log(groups);
		} else {
			console.log('failed to get group list...');
		}
	});
	server.on('getPendingContactList', function(data) {
		if (data.status == 'success')
			console.log(data);
	});
	server.on('getContactList', function(data) {
		if (data.status == 'success')
			console.log(data);
	});
	reset();

	//click on the send button
	$("#btn-chat").on('click', function(){
	  sentMessage();
	});

	//check the pressed key and if it is enter then send message
	$(document).keypress(function(e){
	  if (e.which == 13){
	    sentMessage();
	  }
	});
});

var groups = [];
// my info
var me;

// chat room info
var chatRoom = {
	groupId: null,
	members: {},
};

function reset() {
	$('#control').html("<label id='loginStatus'>status : not logined</label>\
			<form id='sessionLogin' action='javascript:void(0);'>\
			<input id='sessionId' type='text' placeholder='put your session id'></input>\
			<button type='submit'>session login</button>\
			</form>");
	logined = false;

	$('#sessionLogin').submit(function() {
		if (!logined)
			server.emit('login', {userId: $('#sessionId').val()});
	});
}

function addOldMessages(messages) {
	var chats = $('.chat > .chatMessage');
	var j = messages.length - 1;

	for (; j >= 0; j--) {
		var chat = $('.chat');
		var newMessage = messages[j];

		var content = newMessage.content;
		var date = newMessage.date;
		var name = chatRoom.members[newMessage.userId].nickname;
		var importance = newMessage.importance;
		var nbread = newMessage.importance;
		
		if (newMessage.userId == me.userId)
			addMyMessage(content, me.nickname, date, importance, nbread);
		else
			addMessage(content, name, date, importance, nbread);

		$('.chatTog').animate({ scrollTop: 50000 }, 1);
	}
}

// find group and set for chat
function setGroup(groupId) {
	for (var i = 0; i < groups.length; i++) {
		var group = groups[i];

		if (group.groupId == groupId) {
			var members = group.members;

			chatRoom.groupId = groupId;
			chatRoom.members = {};

			for (var j = 0; j < members.length; j++) {
				var member = members[j];

				chatRoom.members[member.userId] = member;
			}

			return;
		}
	}
}

function getGroup(groupId) {
	for (var i in groups)
		if (groups[i].groupId == groupId) {
			return groups[i];
		}
	
	return null;
}

// add member to group
function addMember(group, member) {
	group.members.push(member);
	if (chatRoom.groupId == group.groupId)
		chatRoom.members[member.userId] = member;
}

function makeMyMessage(msg, name, date, importance, nread) {
	var id = date + "-" + name + "-" + importance + "-" + msg;
	var r = '<li class="chatMessage right clearfix" ' + 'id="' + id +'">' +
						'<span class="chat-img pull-right">' +
							'<img src="https://placehold.it/50/55C1E7/fff" alt="User Avatar" class="img-circle" />' +
						'</span>' +
						'<div class="chat-body clearfix">' +
							'<div class="header">' +
								'<strong class="pull-right primary-font">' +
									name +
								'</strong>' +
								'<small class="text-muted">' +
									'<i class="fa fa-clock-o fa-fw"></i> ' +
									date.toLocaleString().toString() + " " + importance.toString() +
								'</small>' +
							'</div>' +
							'<p>'+msg+'</p>' +
						'</div>' +
					'</li>';
	return r;
}

function makeMessage(msg, name, date, importance, nread) {
	var id = date + "-" + name + "-" + importance + "-" + msg;
	var r = '<li class="chatMessage left clearfix" ' + 'id="' + id + '">' +
						'<span class="chat-img pull-left">' +
							'<img src="https://placehold.it/50/55C1E7/fff" alt="User Avatar" class="img-circle"/> ' +
						'</span>' +
						'<div class="chat-body clearfix">' +
							'<div class="header">' +
								'<strong class="primary-font">' +
									name +
								'</strong>' +
								'<small class="pull-right text-muted">' +
									'<i class="fa fa-clock-o fa-fw">' + '</i>' +
									date.toLocaleString().toString() + " " + importance.toString() +
								'</small>' +
							'</div>' +
							'<p>' + msg + '</p>' +
						'</div>' +
					'</li>';


	return r;
}

function addMyMessage(msg, name, date, importance, nread){
	$('.chat').append(makeMyMessage(msg, name, date, importance, nread));
	$('.chatTog').animate({ scrollTop: 50000 }, 1);
}

function addMessage(msg, name, date, importance, nread){
	$('.chat').append(makeMessage(msg, name, date, importance, nread));
	$('.chatTog').animate({ scrollTop: 50000 }, 1);
}

//verification if text is not null then send to server and write it locally
function sentMessage(){
    if ($('.messageInput').val() != "" && logined){
    	var content = $('.messageInput').val();
      server.emit('sendMessage', {groupId: chatRoom.groupId, content: content, importance: 0, location: 'test'} );

      addMyMessage(content, me.nickname , new Date().toString(), 0, chatRoom.members.length - 1);
      $('.messageInput').val('');
    }
}


function notifyMessage(message) {
	message = message;

  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
  }

  // Let's check whether notification permissions have already been granted
  else if (Notification.permission === "granted") {
    // If it's okay let's create a notification
    var notification = new Notification(message);
  }

  // Otherwise, we need to ask the user for permission
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission(function (permission) {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        var notification = new Notification(message);
      }
    });
  }
}
