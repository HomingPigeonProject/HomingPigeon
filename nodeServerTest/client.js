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
			
			contactForm.appendChild(contactInput);
			contactForm.appendChild(contactAddButton);
			contactForm.appendChild(contactRemoveButton);
			contactForm.appendChild(contactAcceptButton);
			contactForm.appendChild(contactDenyButton);

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

			controlDiv.appendChild(contactForm);
			controlDiv.appendChild(groupListButton);
			controlDiv.appendChild(groupForm);
			controlDiv.appendChild(chatControlTitle);
			controlDiv.appendChild(chatForm);

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
	server.on('readMessage', function(data) {
		console.log('readMessage');
		console.log(data);
		if (data.status == 'success') {
			addOldMessages(data.messages);
		}
	});
	server.on('sendMessage', function(data) {
		console.log('sendMessage');
		console.log(data);
	});
	server.on('newMessage', function(data) {
		// if message was sent for the chat
		if (chatRoom.groupId == data.groupId) {
			//console.log(chatRoom.members);
			if (data.userId == me.userId)
				addMyMessage(data.content, chatRoom.members[data.userId].nickname, new Date().toString());
			else
				addMessage(data.content, chatRoom.members[data.userId].nickname, new Date().toString());
		} else {
			// else, it is a notification
			console.log('newMessage!!');
			console.log(data);
		}
	});
	server.on('membersJoin', function(data) {
		console.log('membersJoin');
		console.log(data);
	});
	server.on('membersLeave', function(data) {
		console.log('membersLeave');
		console.log(data);
	});
	server.on('membersInvited', function(data) {
		console.log('membersInvited');
		console.log(data);
	});
	server.on('membersExit', function(data) {
		console.log('membersExit');
		console.log(data);
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
	server.on('getGroupList', function(data) {
		if (data.status == 'success') {
			console.log(data);
			groups = data.groups;
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

var groups;
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
	var j = 0;
	
	for (var i = chats.length - 1; i >= 0; i--) {
		do {
			var chat = chats[i];
			var newChat = messages[j];
			var chatId = chat['data-messageId'];
			var newId = messages[j].messageId;

			var content = newChat.content;
			var date = newChat.date;
			var name = chatRoom.members[newChat.userId].nickname;
			
			if (chatId == newId)
				j++;
			else if (chatId < newId) {
				if (newChat.userId == me.userId)
					$(chat).append(makeMyMessage(content, me.nickname, date));
				else
					$(chat).append(makeMessage(content, name, date));
			} else
				continue;
			
			if (newChat.userId == me.userId)
				$(chat).append(makeMyMessage(content, me.nickname, date));
			else
				$(chat).append(makeMessage(content, name, date));
				
		} while (chatId < newId);
	}
	
	for (; j < messages.length; j++) {
		var chat = $('.chat');
		var newMessage = messages[j];
		
		var content = newMessage.content;
		var date = newMessage.date;
		var name = chatRoom.members[newMessage.userId].nickname;
		
		if (newMessage.userId == me.userId)
			chat.prepend(makeMyMessage(content, me.nickname, date));
		else
			chat.prepend(makeMessage(content, name, date));
		
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
			
			break;
		}
	}
}

function makeMyMessage(msg, name, date) {
	return '<li class="chatMessage right clearfix"><span class="chat-img pull-right"><img src="http://placehold.it/50/55C1E7/fff" alt="User Avatar" class="img-circle" /></span><div class="chat-body clearfix"><div class="header"><strong class="pull-right primary-font">'+name+'</strong><small class="text-muted"><i class="fa fa-clock-o fa-fw"></i> '+date+'</small></div><p>'+msg+'</p></div></li>';
}

function makeMessage(msg, name, date) {
	return '<li class="chatMessage left clearfix"><span class="chat-img pull-left"><img src="http://placehold.it/50/55C1E7/fff" alt="User Avatar" class="img-circle" /></span><div class="chat-body clearfix"><div class="header"><strong class="primary-font">'+name+'</strong><small class="pull-right text-muted"><i class="fa fa-clock-o fa-fw"></i>'+date+'</small></div><p>'+msg+'</p></div></li>';
}

function addMyMessage(msg, name, date){
	$('.chat').append(makeMyMessage(msg, name, date));/*'<div class="message"></p>' + name + ' : ' + msg +   '</p></div>');*/
	$('.chatTog').animate({ scrollTop: 50000 }, 1);
}

function addMessage(msg, name, date){
	$('.chat').append(makeMessage(msg, name, date));/*'<div class="message"></p>' + name + ' : ' + msg +   '</p></div>');*/
	$('.chatTog').animate({ scrollTop: 50000 }, 1);
}

//verification if text is not null then send to server and write it locally
function sentMessage(){
    if ($('.messageInput').val() != "" && logined){
    	var content = $('.messageInput').val();
      server.emit('sendMessage', {groupId: chatRoom.groupId, content: content, importance: 0, location: null} );
      
      addMyMessage(content, me.nickname , new Date().toString(), true);
      $('.messageInput').val(''); //reset the messageInput
    }
}