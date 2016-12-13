
var userId = str = document.getElementById("phpUserId").textContent.replace(/\s/g, "");
var sessionId = document.getElementById("phpSessionId").textContent.replace(/\s/g, "");
var contactList;
var joinContactId;
var groups;
var eventList;
var me;
var logined = false;
var port = 4000;
var server;
var chatRoom = {
	groupId: null,
	members: {},
};
/* ------------------------	*/
/*			Event Listeners			*/
/* ------------------------	*/

window.addEventListener('load', function() {
	server = io.connect('https://vps332892.ovh.net:4000');

	var controlDiv = document.getElementById('control');

	$('#eventCreateButton').click(function() {
		console.log("pressed");
		var participants = $('#eventParticipantNameInput').val().split(',');
		console.log(participants);
		for (var i = 0; i < participants.length; i++) {
			participants[i] = participants[i].trim();
		}

		function parseYMDHM(s) {
			if (!s)
				return s;

			// regex match non digit(\D) character '+'
			var b = s.split(/\D+/);
			return new Date(b[0], --b[1], b[2], b[3], b[4], b[5]||0, b[6]||0).getTime();
		}

		var date = parseYMDHM($('#eventDateInput').val());
		var ldate = parseYMDHM($('#eventLDateInput').val());

		var localization = {location: $('#eventLLocationInput').val(), date: ldate};

		if (!localization.location || !localization.date) {
			localization = null;
		}

		var eventName = $('#eventNameInput').val();
		var eventDescription = $('#eventDescInput').val();

		console.log("Emit with args : ");
		console.log('name : ', eventName);
		console.log('participants : ', participants);
		console.log('description : ', eventDescription);
		console.log('date : ', date);
		console.log('localization : ', localization);

		server.emit('createEvent', {name: eventName,
			participants: participants, description: eventDescription,
			date: date, localization: localization});
	});

	server.on('connect', function() {
		console.log('connected to server at port ' + port);
		reset();
		server.emit('login', {userId: userId});
	});
	server.on('reconnect', function() {
		console.log('reconnected to server');
		reset();
		server.emit('login', {userId: userId});
	});
	server.on('disconnect', function() {
		console.log('diconnected from server');
		logined = false;
	});
	server.on('error', function() {
		console.log('connection error');
	});
	server.on('login', function(data) {
		if (data.status == 'success') {

			server.emit('getPendingContactList');
			server.emit('getContactList');
			server.emit('getGroupList');
			server.emit('getEventList');

			//$('#loginStatus').text('status : logined');
			logined = true;

			// HTML forms
			$('#contactAddButton').unbind("click").bind("click", function() {
				server.emit('addContact', { email: $('#contactInput').val() });
				server.emit('getPendingContactList');
			});
			$('#createGroupButton').unbind("click").bind("click", function () {
				server.emit('addGroup', {name: $('#createGroupNameInput').val(), members: new Array(me['email'])});
				server.emit('getGroupList');
			});

			me = data.data;
		}
	});
	server.on('exitGroup', function(data) {
		if (data.status == 'success') {
			console.log('group exited');
		} else {
			console.log('failed to exit group');
		}
	});
	server.on('inviteGroupMembers', function(data) {
		if (data.status == 'success') {
			console.log('members invited');
		} else {
			console.log('failed to invite group members');
		}
	});
	server.on('addGroup', function(data) {
		if (data.status == 'success') {
			console.log('group added');
			server.emit('getGroupList');
			groups.push(data.group);
		} else {
			console.log('failed to add group');
		}
	});
	server.on('addContact', function(data) {
		if (data.status == 'success') {
			console.log('contact added');
		} else {
			console.log('failed to add contact');
		}
	});
	server.on('removeContact', function(data) {
		if (data.status == 'success') {
			console.log('contact removed');
		} else {
			console.log('failed to remove contact');
		}
	});
	server.on('newContact', function(data) {
		server.emit('getGroupList');
		server.emit('getContactList');
		server.emit('getPendingContactList');
	});
	server.on('contactDenied', function (data) {
		server.emit('getPendingContactList');
	});
	server.on('contactRemoved', function (data) {
		server.emit('getContactList');
	});
	server.on('newPendingContact', function(data) {
		server.emit('getPendingContactList');
	});
	server.on('getPendingContactList', function(data) {
		if (data.status == 'success') {
			var pcontacts = data.contacts;
			var pendingContactListDiv = document.getElementById("pending-contact-list");
			printContactList(pcontacts, pendingContactListDiv, true);
		} else {
			console.log("failed to get pending contact list");
		}
	});
	server.on('getContactList', function(data) {
		if (data.status == 'success') {
			var contacts = data.contacts;
			var contactListDiv = document.getElementById("contact-list");
			printContactList(contacts, contactListDiv, false);
			contactList = contacts;
		} else {
			console.log("failed to get contact list");
		}
	});
	server.on('getGroupList', function(data) {
		console.log("get group list", data);
		if (data.status == 'success') {
			groups = data.groups;
			var groupListDiv = document.getElementById("group-list");
			printGroupList(groups, groupListDiv, false);
		} else {
			console.log('failed to get group list');
		}
	});
	server.on('readMessage', function(data) {
		console.log('readMessage', data);
		if (data.status == 'success') {
			resetChatBox();
			addOldMessages(data.messages);
		}
		if (data.messages.length > 0) {
			var ackEnd = data.messages[0].messageId;
			var ackStart = data.messages[data.messages.length - 1].messageId;
			server.emit('ackMessage', {groupId: data.messages[0].groupId,
				ackStart: ackStart, ackEnd: ackEnd});

			chatRoom.messageId = data.messages[0].messageId;
		}
	});

	server.on('messageAck', function(data) {
		console.log('ack', data);
		if (data.groupId == chatRoom.groupId) {
			var ackStart = data.ackStart;
			var ackEnd = data.ackEnd;
			var messages = $('.chat > .chatMessage');

			var lastId = chatRoom.messageId;
			//console.log('last id ' + lastId);
			var i = messages.length - chatRoom.nbNotSent - 1;
			for (; i >= 0; i--) {
				var message = messages[i];
				var userId = message.getAttribute('data-userId');

				if (lastId >= ackStart) {
					//console.log('look' + (i + 1));
					if (lastId <= ackEnd) {
						// decrement nbread when user id of message and user id of ack send is distinct
						if (data.userId != userId) {
							var nb = $(message).find('.nbread')[0];
							var nbread = parseInt(nb.innerHTML);

							nb.innerHTML = --nbread;

							// if all member read, don't display nbread
							if (nbread <= 0) {
								nb.style.display = 'none';
							}
						}
					}
				} else {
					break;
				}
				lastId--;
			}
		}
	});

	server.on('sendMessage', function(data) {
		console.log('sendMessage', data);
		if (data.status == 'success') {
			// my message send, add message id
			if (chatRoom.messageId > 0)
				chatRoom.messageId++;
			else
				chatRoom.messageId = data.messageId;

			chatRoom.nbNotSent--;
		}
	});
	server.on('newMessage', function(data) {
		console.log('newMessage', data);
		// if message was sent for the chat
		if (chatRoom.groupId == data.groupId) {

			if (chatRoom.messageId > 0) {
				chatRoom.messageId++;
			} else {
				chatRoom.messageId = data.messageId;
			}

			var location = data.location;

			if (data.userId == me.userId) {
				addMyMessage(data.content, chatRoom.members[data.userId].nickname, new Date(), data.importance, data.userId, data.nbread, location); // TODO
			}	else {
				notifySound();
				addMessage(data.content, chatRoom.members[data.userId].nickname, new Date(), data.importance, data.userId, data.nbread, location);
				// send ack to server
				server.emit('ackMessage', {groupId: data.groupId,
					ackStart: data.messageId, ackEnd: data.messageId});

				if (location !== null) {
					console.log('share location');
					addLocation(location);
				}
			}
		} else {
			/*
			var str = data.content;
			if (chatRoom.members[data.userId] != undefined) {
				str = chatRoom.members[data.userId].nickname + " \n" + str;
			}
			*/

			var content = data.content;
			var group = getGroup(data.groupId);
			var member = getMemberFromGroup(group, data.userId);
			var name = '';
			var picture = '';
			if (member) {
				name = member.nickname;
				picture = member.picture;
			}
			notifySound();
			notifyMessage(name, picture, content);
			if (group) {
   			if (group.contactId)
					incrementContactNbNewMessage(group.contactId);
				else
					incrementGroupNbNewMessage(group.groupId);
			}
		}
	});
	server.on('membersInvited', function(data) {
		console.log('membersInvited', data);
		var group = getGroup(data.groupId);

		data.members.forEach(function(member) {
			addMember(group, member);
		});
	});
	server.on('membersExit', function(data) {
		console.log('membersExit');
		server.emit('getGroupList');
	});
	server.on('contactChatRemoved', function(data) {
		console.log('contact chat removed');
		server.emit('getContactList');
		server.emit('getGroupList');
	});
	server.on('joinContactChat', function(data) {
		if (data.status == 'success') {
			console.log('contact chat created');
			resetChatBox();
			var groupId = data.groupId;
			var group = getGroup(groupId);
			if (!group)
				groups.push(data);
			if (joinContactId == data.contactId)
				setGroup(groupId);
			server.emit('readMessage', {groupId: groupId});
			server.emit('getGroupList');
		} else {
			console.log('failed to create contact chat');
		}
	});
	server.on('getLocation',function(data){
		            /*$('html, body').animate({
                    scrollTop: $(".shareLocation").offset().top
                }, 2000);*/
    $(".long").val(data.long);
		$(".latt").val(data.latt);
		$("input[id=long1]").val(data.long)
		$("input[id=latt1]").val(data.latt)
		$(".long1").val(data.long);
		$(".latt1").val(data.latt);
	});

	/* Events event handler*/

	server.on('eventStarted', function(data) {
		console.log('eventStarted');
		console.log(data);
		notifyMessage('', '', 'event started !');
	});
	server.on('eventAck', function(data) {
		console.log('eventAck');
		console.log(data);
	});
	server.on('eventParticipantExited', function(data) {
		console.log('eventParticipantExited');
		console.log(data);
		server.emit('getEventList');
	});
	server.on('eventExit', function(data) {
		console.log('eventExit');
		console.log(data);
		notifyMessage('','', 'event exit');
		server.emit('getEventList');
	});
	server.on('eventCreated', function(data) {
		console.log('eventCreated');
		console.log(data);
		notifyMessage('','', 'event created');
		server.emit('getEventList');
	});
	server.on('getEventList', function(data) {
		console.log("get list EVENT");
		if (data.status == 'success') {
			console.log(data);
			eventList = data.events;
			displayCalendar(data);
		}
	});



	//reset();


	//click on the share position button
	$(".shareLocation").on('click', function(){
		$('html, body').animate({
				scrollTop: $(".chat").offset().top
		}, 200);
		var long1 = $(".long").val().toString();
		var latt1 = $(".latt").val().toString();
		var importance = document.getElementById("importance-list").selectedIndex;
		sendMessage("location shared : ", importance, long1+"+"+latt1, 11);
		/*
		server.emit('sendMessage', {groupId: chatRoom.groupId, content: "location shared : ", importance: 0, location: long1+"+"+latt1} );
		chatRoom.nbNotSent++;
		addMyMessage("location sent", me.nickname , new Date(), 0); //send the message*/
	});

	//click on the send button
	$("#btn-chat").on('click', function(){
		sendChatMessage();
	});

	//check the pressed key and if it is enter then send message
	$(document).keypress(function(e){
 /*
		if (e.which == 13){
			sendChatMessage();
		}*/
	});

	$('#createEventButton').click(function() {
		if (!logined) {
			return;
		}

		var title = 'Create Event';
		var body = '<p>Please fill in the form below to create event</p>' +
		'<div>' +
		'<div id="eventError"></div>' +
		      '<form id="eventForm" class="events-div">' +
		        '<input id="eventNameInput" placeholder="event name" class="form-control" type="text" required></input>' +
		        '<br/><textarea id="eventDescInput" placeholder="event description" class="form-control" style="height:100px;resize:vertical;" required></textarea>' +
		        '<br/><p>Discussion start date</p><input id="eventDateInput"  class="form-control" type="datetime-local" required></input>' +
		        '<br/><p>Meeting Location</p><input id="eventLLocationInput"  class="form-control"type="text" placeholder="location"></input>' +
		        '<br/><p>Meeting Time</p><input id="eventLDateInput"  class="form-control" type="datetime-local"></input>' +
						'<br/><p>Participants</p><div id="modalContactList" style="max-height:400px;overflow: auto;"></div>' +
		      '</form>';
		var footer = '<div style="text-align:center;">' +
				'<button id="createEventConfirmButton" class="btn btn-primary" style="display:inline">Create Event</button>' +
				'</div>';
		toggleModal();
		setModal(title, body, footer);

		var emails = createModalContactList(contactList, function(userId) {
			return true;
		});

		// when click invite button
		$('#createEventConfirmButton').bind("click", function() {
			if (!$('#eventForm')[0].checkValidity()) {
				$('#eventError').show().html('<div class="alert alert-warning alert-dismissable">' +
	    '<a href="#" class="close" data-dismiss="alert" aria-label="close">×</a>' +
	    '<strong>Warning!</strong> Please fill out required entries (name, description, date)' +
	  '</div>');
		setTimeout(function() {
			$('#eventError').fadeOut();
		}, 5000);
				return;
			}

			toggleModal();

			function parseYMDHM(s) {
				if (!s)
					return s;

				// regex match non digit(\D) character '+'
				var b = s.split(/\D+/);
				return new Date(b[0], --b[1], b[2], b[3], b[4], b[5]||0, b[6]||0).getTime();
			}

			var date = parseYMDHM($('#eventDateInput').val());
			var ldate = parseYMDHM($('#eventLDateInput').val());

			var localization = {location: $('#eventLLocationInput').val(), date: ldate};

			if (!localization.location || !localization.date) {
				localization = null;
			}

			var eventName = $('#eventNameInput').val();
			var eventDescription = $('#eventDescInput').val();

			console.log("Emit with args : ");
			console.log('name : ', eventName);
			console.log('participants : ', emails);
			console.log('description : ', eventDescription);
			console.log('date : ', date);
			console.log('localization : ', localization);

			server.emit('createEvent', {name: eventName,
				participants: emails, description: eventDescription,
				date: date, localization: localization});

			return false;
		});
	});

// when user press enter, send message
// when user press shift + enter, newline
	$('.messageInput').keyup(function (event) {
	    if (event.keyCode == 13) {
	        var content = this.value;
	        var caret = getCaret(this);
	        if(event.shiftKey){
	            this.value = content.substring(0, caret - 1) + "\n" + content.substring(caret, content.length);
	            event.stopPropagation();
	        } else {
	            event.preventDefault();
							sendChatMessage();
	        }
	    }
	});
});

function getCaret(el) {
    if (el.selectionStart) {
        return el.selectionStart;
    } else if (document.selection) {
        el.focus();
        var r = document.selection.createRange();
        if (r == null) {
            return 0;
        }
        var re = el.createTextRange(), rc = re.duplicate();
        re.moveToBookmark(r.getBookmark());
        rc.setEndPoint('EndToStart', re);
        return rc.text.length;
    }
    return 0;
}

/* Contact, Group list functions */

// returns string how much time elapsed since date
function calcAgo(date) {
	if (!date)
		return '';
	//console.log(new Date().getTime()/1000);
	//console.log(date);
	//console.log(date.getTime()/ 1000);
	var left = new Date().getTime() - date.getTime();

	if (left <= 0)
		return '';

	left = Math.floor(left / 1000);
	if (left < 60)
		return left.toString() + ' seconds ago';
	left /= 60;
	if (left < 60)
		return Math.floor(left).toString() + ' mins ago';
	left /= 60;
	if (left < 24)
		return Math.floor(left).toString() + ' hours ago';
	left /= 24;
	if (left < 365)
		return Math.floor(left).toString() + ' days ago';
	left /= 365;
	return Math.floor(left).toString() + ' years ago';
}

// increment number of new message number for contact
function incrementContactNbNewMessage(contactId) {
	console.log(contactId);
	if (!contactId)
		return;

	var contactElems = $('#contact-list').find('.contactElem').each(function() {
		console.log($(this).data('contactid'));
		console.log(contactId);
		if ($(this).data('contactid') == contactId) {
			var badge = $(this).find('.nbNewMessages')
			badge.css({display:'inline'});
			var n = parseInt(badge.text()) || 0;
			badge.text(n + 1);
		}
	});
}

// increment number of new message number for group
function incrementGroupNbNewMessage(groupId) {
	console.log(groupId);
	if (!groupId)
		return;

	var contactElems = $('#group-list').find('.groupElem').each(function() {
		console.log($(this).data('groupid'));
		console.log(groupId);
		if ($(this).data('groupid') == groupId) {
			var badge = $(this).find('.nbNewMessages')
			badge.css({display:'inline'});
			var n = parseInt(badge.text()) || 0;
			badge.text(n + 1);
		}
	});
}

function parseYMDHM(s) {
	if (!s)
		return null;

	// regex match non digit(\D) character '+'
    var b = s.split(/\D+/);
    //console.log(b);
	return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5]||0));
}

function printContactList(contacts, parentDiv, pending) {
	parentDiv.innerHTML = "";
	var arrayLength = contacts.length;
	for (var i = 0; i < arrayLength; i++) {
		var contact = contacts[i];
		var invited = contact["invited"];

		// also add the links to the chats
		var url = document.getElementById("phpURL").textContent;

		var buttonList = '';
		var toggleList = '';
		var lastSeenStr = '';

		if (pending && invited) {
			buttonList = '<button id="' + contact.email + '" class="btn btn-primary acceptContactButton" style="width:100%">✔️</button>' +
						'<button id="' + contact.email + '" class="btn btn-primary denyContactButton" style="width:100%">❌ </button>';

		} else if (pending && !invited) {

			buttonList = '<button id="' + contact.email + '" class="btn btn-primary denyContactButton" style="width:100%">❌ </button>';

		} else {
			var display = contact.nbNewMessages > 0 ? 'inline' : 'none';
			var n = contact.nbNewMessages || 0;

			buttonList = '<button id="' + contact.email + '" class="btn btn-primary contactChatButton" style="width:100%" ' +
				        'data-groupId="' + contact.groupId + '" data-nickname="' + contact.nickname + '" data-contactId="'+
				        contact.contactId + '" onclick="notifySound()">Chat <span class="badge nbNewMessages" style="display:' + display + ';">' +
				        n + '</span></button>' +
				        '<a class="btn btn-success conferenceLink" style="width:100%" target="_blank"' +
				        'href="../Conference/page.php?c' + contact.contactId + '">Conference</a>';

			toggleList = '<li><a id="' + contact.email + '" href="#" class="removeContactButton2">Remove</a></li>';
			var lastSeen = calcAgo(parseYMDHM(contact.lastSeen));
			lastSeenStr = lastSeen ? '<i class="fa fa-clock-o fa-fw"></i><small>' + lastSeen + '</small>' : '';
			console.log("contact : ", contact);
		}
		//console.log(contact.lastSeen);

		var contactHTML = '<li class="clearfix listElem contactElem" data-contactId="' + contact.contactId + '">' +
        '<span class="chat-img pull-left" style="position:relative;">' +
        '<img src="https://placehold.it/50/55C1E7/fff" alt="User Avatar" class="img-circle" />' +
		    '</span>' +
		    '<div class="pull-left" style="padding-left:10px;">' +
		    '<strong class="primary-font group-contactName">' + contact.nickname + '</strong>' +
		    '<div class="chat-body clearfix">' +
		        '<div class="header">' +
			        '<ul style="list-style-type: none;padding-left:0;">' +
		            '<li class="primary-font"><small>' + contact.email + '</small></li>' +
		            '<li class="text-muted">' + lastSeenStr + '</li>' +
		            '</ul>' +
		        '</div>' +
		     '</div>' +
		    '</div>' +
		        '<div class="pull-right listElemRight">' + buttonList + '</div>' +
		        (toggleList ? '<ul class="dropdown-menu" data-toggle="dropdown">' + toggleList + '</ul>' : '') +
		'</li>';

		$(parentDiv).append(contactHTML);
	}
	$('.contactElem').unbind('contextmenu').bind('contextmenu', function(e) {
		e.preventDefault();
		$(this).find('.dropdown-menu').dropdown("toggle");
	});
	$('.acceptContactButton').unbind("click").bind("click", function() {
		server.emit('acceptContact', {email: this.id});
		//server.emit('getPendingContactList'); // reload the pending contact list to remove
		//server.emit('getContactList'); // reload the contact list to include the new contact
	});
	$('.denyContactButton').unbind("click").bind("click", function() {
		server.emit('denyContact', {email: this.id});
		//server.emit('getPendingContactList');
	});
	$('.removeContactButton2').unbind("click").bind("click", function() {
		server.emit('removeContact', {email: this.id});
		//server.emit('getContactList');
	});
	$('.contactChatButton').unbind("click").bind("click", function() {
		resetChatBox();
		var contactEmail = this.id;
		var groupId = $(this).data('groupid');
		var nickName = $(this).data('nickname');
		if (!groupId) {
			console.log("join contact chat");
			server.emit('joinContactChat', {email: contactEmail});
			joinContactId = $(this).data('contactid');
			console.log(joinContactId);
		} else {
			setGroup(groupId);
			server.emit('readMessage', {groupId: groupId});
		}

		$(this).find('.nbNewMessages').css({display:'none'}).text('0');

		var panelHeading = document.getElementById("panel-heading");
		panelHeading.innerHTML = "<i class='fa fa-comments fa-fw'></i> Chat - " + nickName;
							"<div class='btn-group pull-right'>" +
									"<button type='button' class='btn btn-default btn-xs chatToggle'>" +
										"<i class='fa fa-chevron-down chatChevron'></i>" +
									"</button>" +
								"</div>";
	});
}

function printGroupList(groups, parentDiv, pending) {
	parentDiv.innerHTML = "";
	var arrayLength = groups.length;
	for (var i = 0; i < arrayLength; i++) {
		var group = groups[i];
		if(!group["contactId"]) {

			var display = group.nbNewMessages > 0 ? 'inline' : 'none';
			var n = group.nbNewMessages || 0;

			var buttonList = '<button id="' + group.groupId + '" class="btn btn-primary groupChatButton" style="width:100%" ' +
				        'data-groupName="' + group.name + '" onclick="notifySound()">Chat <span class="badge nbNewMessages" style="display:' +
				        display + ';">' +
				        n + '</span></button>' +
				        '<a class="btn btn-success conferenceLink" style="width:100%" target="_blank"' +
				        'href="../Conference/page.php?g' + group.groupId + '">Conference</a>';

			var toggleList = '<li><a id="' + group.groupId + '" href="#" class="showGroupMemberButton" ' +
						'data-toggle="modal" data-target="#myModal">Show members</a></li>' +
						'<li><a id="' + group.groupId + '" href="#" class="inviteContactToGroupButton" ' +
						'data-toggle="modal" data-target="#myModal">Invite contacts</a></li>' +
						'<li><a id="' + group.groupId + '" href="#" class="exitGroupButton2">Remove</a></li>';

			var lastMessageDate = calcAgo(parseYMDHM(group.lastMessageDate));
			var lastMessageDateStr = lastMessageDate ? '<i class="fa fa-clock-o fa-fw"></i><small>' + lastMessageDate + '</small>' : '';

			var contactHTML = '<li class="clearfix listElem groupElem" data-groupId="' + group.groupId + '">' +
	        '<span class="chat-img pull-left" style="position:relative;">' +
	        '<img src="https://placehold.it/50/55C1E7/fff" alt="User Avatar" class="img-circle" />' +
			    '</span>' +
			    '<div class="pull-left" style="padding-left:10px;">' +
			    '<strong class="primary-font group-contactName">' + group.name + '</strong>' +
			    '<div class="chat-body clearfix">' +
			        '<div class="header">' +
				        '<ul style="list-style-type: none;padding-left:0;">' +
			            '<li class="text-muted">' + lastMessageDateStr + '</li>' +
			            '</ul>' +
			        '</div>' +
			     '</div>' +
			    '</div>' +
			        '<div class="pull-right listElemRight">' + buttonList + '</div>' +
			        (toggleList ? '<ul class="dropdown-menu" data-toggle="dropdown">' + toggleList + '</ul>' : '') +
			'</li>';

			$(parentDiv).append(contactHTML);
			continue;
		}

	}
	$('.groupElem').unbind('contextmenu').bind('contextmenu', function(e) {
		e.preventDefault();
		$(this).find('.dropdown-menu').dropdown("toggle");
	});
	$('.groupChatButton').unbind("click").bind("click", function() {
		resetChatBox();
		var groupId = this.id;
		var groupName = $(this).data('groupname');
		setGroup(groupId);
		server.emit('readMessage', {groupId: groupId});
		console.log('start chat in group ' + groupId);

		$(this).find('.nbNewMessages').css({display:'none'}).text('0');

		var panelHeading = document.getElementById("panel-heading");
		panelHeading.innerHTML = "<i class='fa fa-comments fa-fw'></i> Chat - " + groupName;
		          "<div class='btn-group pull-right'>" +
		              "<button type='button' class='btn btn-default btn-xs chatToggle'>" +
		                "<i class='fa fa-chevron-down chatChevron'></i>" +
		              "</button>" +
		            "</div>";
	});
	$('.exitGroupButton2').unbind("click").bind("click", function(){
		server.emit('exitGroup', {groupId: this.id});
		server.emit('getGroupList');
	});
	$('.showGroupMemberButton').unbind("click").bind("click", function(){
		var title = 'Group Members';
		var body = '<div id="modalContactList"></div>';
		var footer = '';

		var group = getGroup(this.id);
		console.log(group);
		if (group) {
			toggleModal();
			setModal(title, body, footer);

			var emails = createModalContactList(group.members, function(userId) {
				return true;
			});
		}
	});
	$('.inviteContactToGroupButton').unbind("click").bind("click", function(){
		var title = 'Invite Contacts to Group';
		var body = '<p>Please select contacts you want</p>' +
					'<div id="modalContactList"></div>';
		var footer = '<div style="text-align:center;">' +
				'<button id="inviteContactToGroupConfirmButton" class="btn btn-primary" style="display:inline">Invite</button>' +
				'</div>';
		var id = this.id;
		var group = getGroup(id);
		console.log(group);
		if (group) {
			toggleModal();
			setModal(title, body, footer);

			var emails = createModalContactList(contactList, function(userId) {
				if (getMemberFromGroup(group, userId))
					return false;
				return true;
			});

			// when click invite button
			$('#inviteContactToGroupConfirmButton').bind("click", function() {
				server.emit('inviteGroupMembers', {groupId: id, members: emails});
				console.log('sent', emails);
				toggleModal();
			});
		}
	});
}

/* Modal functions */

function toggleModal() {
	$('#myModal').modal('toggle');
}

function setModal(title, body, footer) {
	$('#myModal #myModalLabel').html(title);
	$('#myModal .modal-body').html(body);
	$('#myModal .modal-footer').html(footer);
}

function createModalContactList(users, filter) {
	var arrayLength = users.length;
	var emails = [];

	$('#myModal #modalContactList').append('<ul class="contactList" style="list-style-type: none;padding:0px;"></ul>');

	for (var i = 0; i < arrayLength; i++) {
		var user = users[i];

		if (!filter(user.userId))
			continue;

		var lastSeen = calcAgo(parseYMDHM(user.lastSeen));
		lastSeenStr = lastSeen ? '<i class="fa fa-clock-o fa-fw"></i><small>' + lastSeen + '</small>' : '';

		var contactHTML = '<li class="clearfix listElem modalContact" data-contactEmail="' + user.email + '">' +
        '<span class="chat-img pull-left" style="position:relative;">' +
        '<img src="https://placehold.it/50/55C1E7/fff" alt="User Avatar" class="img-circle" />' +
		    '</span>' +
		    '<div class="pull-left" style="padding-left:10px;">' +
		    '<strong class="primary-font group-contactName">' + user.nickname + '</strong>' +
		    '<div class="chat-body clearfix">' +
		        '<div class="header">' +
			        '<ul style="list-style-type: none;padding-left:0;">' +
		            '<li class="primary-font"><small>' + user.email + '</small></li>' +
		            '<li class="text-muted">' + lastSeenStr + '</li>' +
		            '</ul>' +
		        '</div>' +
		     '</div>' +
		    '</div>' +
		'</li>';

		$('#myModal #modalContactList .contactList').append(contactHTML);
	}

	$('.modalContact').unbind('click').bind('click', function(e) {
		e.preventDefault();
		// by clicking add or remove contacts
		var index = emails.indexOf($(this).data('contactemail'));
		$(this).toggleClass('selected');
		if (index < 0) {
			emails.push($(this).data('contactemail'));
		} else {
			emails.splice(index, 1);
		}
	});

	return emails;
}

/*
function printContactList(contacts, parentDiv, pending) {
	parentDiv.innerHTML = "";
	var arrayLength = contacts.length;
	for (var i = 0; i < arrayLength; i++) {
		var contact = contacts[i];
		var invited = contact["invited"];

		var div = document.createElement("div");
		div.className ="contact";

		var contactName = document.createElement("p"); // p ?
		contactName.textContent = contact["nickname"];
		contactName.className="group-contactName";
		div.appendChild(contactName);


		// also add the links to the chats
		var url = document.getElementById("phpURL").textContent;

		if (pending && invited) {
			var denyContactButton = document.createElement("button");
			denyContactButton.className = "denyContactButton";
			denyContactButton.innerHTML = "❌";
			denyContactButton.id = contact["email"];
			div.appendChild(denyContactButton);

			var acceptContactButton = document.createElement("button");
			acceptContactButton.className = "acceptContactButton";
			acceptContactButton.innerHTML = "✔️";
			acceptContactButton.id = contact["email"];
			div.appendChild(acceptContactButton);
			div.appendChild(document.createElement('br'));

		} else if (pending && !invited) {
			var denyContactButton = document.createElement("button");
			denyContactButton.className = "denyContactButton";
			denyContactButton.innerHTML = "❌";
			denyContactButton.id = contact["email"];
			div.appendChild(denyContactButton);
			div.appendChild(document.createElement('br'));

		} else {
			var removeContactButton = document.createElement("button");
			removeContactButton.className = "removeContactButton";
			removeContactButton.innerHTML = "❌";
			removeContactButton.id = contact["email"];
			div.appendChild(removeContactButton);

			var contactConferenceLink = document.createElement('a');
			contactConferenceLink.className = "conferenceLink";
			contactConferenceLink.classList.add("btn");
			contactConferenceLink.classList.add("btn-success");
			contactConferenceLink.appendChild(document.createTextNode("conference"));
			contactConferenceLink.title = "conference";
			contactConferenceLink.target = "_blank ";
			contactConferenceLink.href = "../Conference/page.php?" + "c" + contact["contactId"];
			div.appendChild(contactConferenceLink);

			var contactChatButton = document.createElement("button");
			contactChatButton.className ="contactChatButton";
			contactChatButton.classList.add("btn");
			contactChatButton.classList.add("btn-primary");
			contactChatButton.onclick = "notifySound()";
			contactChatButton.innerHTML = "join chat";
			contactChatButton.id = contact['email'];
			contactChatButton['data-groupId'] = contact['groupId'];
			contactChatButton['data-nickname'] = contact['nickname'];
			div.appendChild(document.createElement('br'));
			div.appendChild(contactChatButton);

			console.log("contact : ", contact);
		}
		parentDiv.appendChild(div);
	}

	$('.acceptContactButton').unbind("click").bind("click", function() {
		server.emit('acceptContact', {email: this.id});
		server.emit('getPendingContactList'); // reload the pending contact list to remove
		server.emit('getContactList'); // reload the contact list to include the new contact
	});
	$('.denyContactButton').unbind("click").bind("click", function() {
		server.emit('denyContact', {email: this.id});
		server.emit('getPendingContactList');
	});
	$('.removeContactButton').unbind("click").bind("click", function() {
		server.emit('removeContact', {email: this.id});
		server.emit('getContactList');
	});
	$('.contactChatButton').unbind("click").bind("click", function() {
		resetChatBox();
		var contactEmail = this.id;
		var groupId = this['data-groupId'];
		var nickName = this['data-nickname'];
		if (!groupId) {
			console.log("join contact chat");
			server.emit('joinContactChat', {email: contactEmail});
		} else {
			setGroup(groupId);
			server.emit('readMessage', {groupId: groupId});
		}

		var panelHeading = document.getElementById("panel-heading");
		panelHeading.innerHTML = "<i class='fa fa-comments fa-fw'></i> Chat - " + nickName;
							"<div class='btn-group pull-right'>" +
									"<button type='button' class='btn btn-default btn-xs chatToggle'>" +
										"<i class='fa fa-chevron-down chatChevron'></i>" +
									"</button>" +
								"</div>";

	});
}*/
/*
function printGroupList(groups, parentDiv, pending) {
	parentDiv.innerHTML = "";
	var arrayLength = groups.length;
	for (var i = 0; i < arrayLength; i++) {
		var group = groups[i];
		if(!group["contactId"]) {
			var invited = true;

			var div = document.createElement("div");
			div.className ="group";

			var groupName = document.createElement("p");
			groupName.textContent = group["name"];
			groupName.className="group-contactName";
			div.appendChild(groupName);

			var url = document.getElementById("phpURL").textContent;

			var groupConferenceLink = document.createElement('a');
			groupConferenceLink.className = "conferenceLink";
			groupConferenceLink.classList.add("btn");
			groupConferenceLink.classList.add("btn-success");
			groupConferenceLink.appendChild(document.createTextNode("conference"));
			groupConferenceLink.title = "conference";
			groupConferenceLink.target = "_blank ";
			groupConferenceLink.href = "../Conference/page.php?" + "g" + group["groupId"];

			var groupChatButton = document.createElement("button");
			groupChatButton.className = "groupChatButton";
			groupChatButton.innerHTML = "join chat";
			groupChatButton.classList.add("btn");
			groupChatButton.classList.add("btn-primary");
			groupChatButton.id = group["groupId"];
			groupChatButton["data-groupName"] = group["name"];

			var exitGroupButton = document.createElement("button");
			exitGroupButton.className = "exitGroupButton";
			exitGroupButton.innerHTML = "❌";
			exitGroupButton.id = group["groupId"];


			var addContactToGroupForm = document.createElement('form');
			var addContactToGroupEmail = document.createElement('input');
			addContactToGroupEmail.type = 'test';
			addContactToGroupEmail.placeholder = 'contact email';
			addContactToGroupEmail.className = "addContactToGroupEmail";
			addContactToGroupEmail.classList.add("form-control");


			var addContactToGroupButton = document.createElement('button');
			addContactToGroupButton.className = "addContactToGroupButton";
			addContactToGroupButton.classList.add("btn");
			addContactToGroupButton.classList.add("btn-primary")
			addContactToGroupButton.innerHTML = "➕";
			addContactToGroupButton.id = group["groupId"];

			//addContactToGroupForm.appendChild(addContactToGroupButton);
			addContactToGroupForm.appendChild(addContactToGroupEmail);

			div.appendChild(exitGroupButton);
			div.appendChild(groupConferenceLink);
			div.appendChild(document.createElement('br'));
			//div.appendChild(groupChatLink);
			div.appendChild(groupChatButton);

			div.appendChild(addContactToGroupForm);
			div.appendChild(addContactToGroupButton);

			parentDiv.appendChild(div);
		}

	}
	$('.groupChatButton').unbind("click").bind("click", function() {
		resetChatBox();
		var groupId = this.id;
		var groupName = this["data-groupName"];
		setGroup(groupId);
		server.emit('readMessage', {groupId: groupId});
		console.log('start chat in group ' + groupId);

		var panelHeading = document.getElementById("panel-heading");
		panelHeading.innerHTML = "<i class='fa fa-comments fa-fw'></i> Chat - " + groupName;
		          "<div class='btn-group pull-right'>" +
		              "<button type='button' class='btn btn-default btn-xs chatToggle'>" +
		                "<i class='fa fa-chevron-down chatChevron'></i>" +
		              "</button>" +
		            "</div>";
	});
	$('.exitGroupButton').unbind("click").bind("click", function(){
		server.emit('exitGroup', {groupId: this.id});
		server.emit('getGroupList');
	});

	$('.addContactToGroupButton').unbind("click").bind("click", function() {
		var truc = new Array();
		console.log("NEW : ", $(this).parent().find(".addContactToGroupEmail").val());
		//truc.push($(this).prev().val()); // the email given in the input field
		truc.push($(this).parent().find(".addContactToGroupEmail").val());
		server.emit('inviteGroupMembers', {groupId: this.id, members: truc});
	});


}
*/
function resetChatBox() {
	var ul = document.getElementById("ul-chatbox-messages");
	ul.innerHTML="";
}

function reset() {
	//$('#control').html("<label id='loginStatus'>status : not logined</label>");
	logined = false;
}

function addOldMessages(messages) {
	var chats = $('.chat > .chatMessage');
	var j = messages.length - 1;

	for (; j >= 0; j--) {
		var chat = $('.chat');
		var newMessage = messages[j];

		var content = newMessage.content;
		var userId = newMessage.userId;
		var date = new Date(newMessage.date);
		var name = chatRoom.members[newMessage.userId].nickname;
		var importance = newMessage.importance;
		var nbread = newMessage.nbread;
		var location = newMessage.location;

		if (userId == me.userId)
			addMyMessage(content, me.nickname, date, importance, userId, nbread, location);
		else
			addMessage(content, name, date, importance, userId, nbread, location);

		$('.chatTog').animate({ scrollTop: 50000 }, 1);
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
	if (chatRoom.groupId == group.groupId) {
		chatRoom.members[member.userId] = member;
		chatRoom.nbMember++;
	}
}

function getMemberFromGroup(group, userId) {
	if (!group)
		return null;

	for (var i = 0; i < group.members.length; i++) {
		var member = group.members[i];

		if (member.userId == userId)
			return member;
	}

	return null;
}


// find group and set for chat
function setGroup(groupId) {
	for (var i = 0; i < groups.length; i++) {
		var group = groups[i];

		if (group.groupId == groupId) {
			var members = group.members;

			chatRoom.groupId = groupId;
			chatRoom.members = {};
			chatRoom.messageId = 0;
			chatRoom.nbMember = 0;
			chatRoom.nbNotSent = 0;


			for (var j = 0; j < members.length; j++) {
				var member = members[j];

				chatRoom.members[member.userId] = member;
				chatRoom.nbMember++;
			}

			break;
		}
	}
}

function getColorOfImportance(importance) {
	var color = "";
	if (importance == 0) {
		color = "black";
	} else if (importance == 1) {
		color = "orange";
	} else if (importance == 2) {
		color = "red";
	}

	return color;
}

function makeMyMessage(msg, name, date, importance, userId, nbread) {
	var color = "black";
	if (importance) {
		color = getColorOfImportance(importance);
	}

	var id = date + "-" + name + "-" + importance;
	var display = nbread > 0 ? 'block' : 'none';
	var r = '<li class="chatMessage right clearfix" ' + 'id="' + id +'" data-userId=' + userId + ' >' +
						'<span class="chat-img pull-right" style="position:relative">' +
							'<img src="https://placehold.it/50/55C1E7/fff" alt="User Avatar" class="img-circle" />' +
							'<div class="bg-info nbread right-pull" style="display:' + display + '">' + nbread + '</div>' +
						'</span>' +
						'<div class="chat-body clearfix">' +
							'<div class="header">' +
								'<strong class="pull-right primary-font">' +
									name +
								'</strong>' +
								'<small class="text-muted">' +
									'<i class="fa fa-clock-o fa-fw"></i> ' +
									date.toLocaleString().toString() + " " +
								'</small>' +
							'</div>' +
							'<p class="content pull-right" style="color:' + color + ';">' +msg+'</p>' +
						'</div>' +
					'</li>';
	return r;
}

function makeMessage(msg, name, date, importance, userId, nbread) {
	var color = "black";
	if (importance) {
		color = getColorOfImportance(importance);
	}

	var id = date + "-" + name + "-" + importance;
	var display = nbread > 0 ? 'block' : 'none';
	var r = '<li class="chatMessage left clearfix" ' + 'id="' + id + '" data-userId=' + userId + ' >' +
						'<span class="chat-img pull-left" style="position:relative">' +
							'<img src="https://placehold.it/50/55C1E7/fff" alt="User Avatar" class="img-circle"/> ' +
							'<div class="bg-info nbread left-pull" style="display:' + display + '">' + nbread + '</div>' +
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
							'<p class="content" style="color:' + color + ';">' + msg + '</p>' +
						'</div>' +
					'</li>';


	return r;
}

function makeLocationMessage(msg, location) {
	return '<a onclick="addLocation(\'' + location + '\');showLocation();" style="cursor: pointer">' + msg + '</a>';
}

function proecessContent(msg) {
	return msg.replace(/(?:\r\n|\r|\n)/g, '<br />');
}

function addMyMessage(msg, name, date, importance, userId, nbread, location){
	if (location) {
		msg = makeLocationMessage(msg, location);
	}
	msg = proecessContent(msg);
	$('.chat').append(makeMyMessage(msg, name, date, importance, userId, nbread));
	$('.chatTog').animate({ scrollTop: 50000 }, 1);
}


function addMessage(msg, name, date, importance, userId, nbread, location){
	if (location) {
		msg = makeLocationMessage(msg, location);
	}
	msg = proecessContent(msg);
	$('.chat').append(makeMessage(msg, name, date, importance, userId, nbread));
	$('.chatTog').animate({ scrollTop: 50000 }, 1);
}

// send chat message to server
function sendChatMessage(){
    if ($('.messageInput').val() != ""){
		  var importance = document.getElementById("importance-list").selectedIndex;
    	var content = $('.messageInput').val();

			sendMessage(content, importance, null, 11);

	    $('.messageInput').val(''); //reset the messageInput
    }
}

// send message to server
function sendMessage(content, importance, location, sendId) {
	if (logined) {
		server.emit('sendMessage', {groupId: chatRoom.groupId, content: content, importance: importance, location: location, sendId: sendId});
		chatRoom.nbNotSent++;
		addMyMessage(content, me.nickname , new Date(), importance, me.userId, chatRoom.nbMember - 1, location);
	}
}

/* ------------------------	*/
/*			Notifications				*/
/* ------------------------	*/
var audio = new Audio('../../assets/notification.ogg');

// Notification audio
function notifySound() {
	audio.play();
}

// Notification text
function notifyMessage(name, picture, message) {
	name = name;
	picture = picture || 'https://placehold.it/50/55C1E7/fff';
	message = message;

  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
  }

  // Let's check whether notification permissions have already been granted
  else if (Notification.permission === "granted") {
    // If it's okay let's create a notification
	  var notification = new Notification(name, {icon: picture, body: message});
    setTimeout(function() { notification.close() }, 4000);
  }

  // Otherwise, we need to ask the user for permission
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission(function (permission) {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        var notification = new Notification(name, {icon: picture, body: message});
        setTimeout(function() { notification.close() }, 4000);
      }
    });
  }
}

/* ------------------------	*/
/*			Download Summary		*/
/* ------------------------	*/

document.getElementById("imp-dl-btn").addEventListener("click", function() {
	var level = document.getElementById("importance-choice-dl").selectedIndex;

	// selecting every message with the same importance or higher

	var chatList = document.getElementById("ul-chatbox-messages");
	var children = chatList.children;
	var result = "";


	for (var i = 0; i < children.length; i++) {
		var item = children[i];
		var data = item.id;

		var pre = data.split("-");
		var importance = pre[2];

		// selecting enough importance
		if (importance >= level) {
			// treatment
			var date = pre[0];
			var author = pre[1];
			var msg = $(item).find('.content').text();

			var string =  'Date: "' + date + '" Author: "' + author + '" Importance: "' + importance + '" Message: "' + msg + '";' + "\r\n";
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

});

/* ------------------------	*/
/*			Location						*/
/* ------------------------	*/

function addLocation(location) {
	if (location != null) {
		console.log('add location');
		var loca = location.split("+");
		//location.match(/.{1,17}/g);
		var e = jQuery.Event("keypress");
		e.which = 13; //choose the one you want
		e.keyCode = 13;
	$(".long").select();
	$(".long").val(loca[0]);
	$(".long").trigger(e);
	$(".latt").select();
	$(".latt").val(loca[1]);
	$(".latt").trigger(e);
	$(".long").select();

$(".long1").val(loca[0]);
$(".latt1").val(loca[1]);

	}
}

function showLocation() {
	console.log('show location');
	var input = $(".long1").val();
	var input2 = $(".latt1").val();
	$('#us6').locationpicker({
			location: {
					latitude: input,
					longitude: input2
			},
			radius: 0,
			inputBinding: {
					latitudeInput: $('#us6-lat'),
					longitudeInput: $('#us6-lon'),
					radiusInput: $('#us6-radius'),
					locationNameInput: $('#us6-address')
			},
			markerInCenter: true,
			enableAutocomplete: true
	});
	$('#us6-example')[0].scrollIntoView( false );
}

/* ------------------------	*/
/*			Calendar						*/
/* ------------------------	*/

function displayCalendar(data) {
$.getScript('fullcalendar.js', function()
	{
		$('#calendar').fullCalendar({
				header: {
					left: 'prev,next today',
					center: 'title',
					right: 'month,agendaWeek,agendaDay'
				},
				eventClick: function(event) {
					var getDateStr = function(date) {
						if (!date)
							return 'N/A';
							return date.toDateString() + ' ' + date.toLocaleTimeString();
					};
					if($("#deleteEventButton").hasClass("active") == false){ //check if try to remove it or not
					console.log(event);
					var title = event.title;
					var body = '<p>Description</p>' +
					'<div class="panel panel-default">' +
  '<div class="panel-body">' + proecessContent(event.description) +
	'</div></div><p>Discussion date</p>' +
	'<div class="panel panel-default">' +
  '<div class="panel-body">' + getDateStr(event.date) +
	'</div></div><p>Meeting location</p>' +
	'<div class="panel panel-default">' +
  '<div class="panel-body">' + proecessContent(event.meetingLocation || 'N/A') +
	'</div></div><p>Meeting time</p>' +
	'<div class="panel panel-default">' +
  '<div class="panel-body">' + (event.meetingTime ? getDateStr(event.meetingTime) : 'N/A') +
	'</div></div><p>Participants</p><div id="modalContactList" style="max-height:400px;overflow: auto;"></div>';
					var footer = '<div style="text-align:center;">' +
							'<button id="exitEventConfirmButton" class="btn btn-danger" style="display:inline">Exit Event</button>' +
							'</div>';
					toggleModal();
					setModal(title, body, footer);
					var emails = createModalContactList(event.participants, function(userId) {
						return true;
					});
					$('#exitEventConfirmButton').click(function() {
						toggleModal();
						console.log(event.eventId)
						server.emit('eventExit', {eventId: event.eventId});
					});
				}
					else{
						server.emit('eventExit', {eventId: event.eventId});
					}
				},
				editable: true,
				droppable: true, // this allows things to be dropped onto the calendar
				drop: function() {
				// is the "remove after drop" checkbox checked?
					if ($('#drop-remove').is(':checked')) {
						// if so, remove the element from the "Draggable Events" list
						$(this).remove();
					}
				}
			});
			$('#calendar').fullCalendar('removeEvents'); //we delete the old events to not see them double
				for(i=0;i <= data.events.length -1 ;i++){ //add all the events from data
					var event={id:data.events[i].id ,
						title: data.events[i].name,
						start:  parseYMDHM(data.events[i].date),
						eventId: data.events[i].eventId,
						date: parseYMDHM(data.events[i].date),
						description: data.events[i].description,
						participants: data.events[i].participants,
						editable: false};
						if (data.events[i].localization) {
							var localization = data.events[i].localization;
							event.meetingTime = parseYMDHM(localization.date);
							event.meetingLocation = localization.location;
						}
					$('#calendar').fullCalendar('renderEvent', event, true);
					}
					/*
			var date = new Date(2016,11,7,16,42,00,00);
			var event={id:2 , title: '<a>PROJECT DEADLINE</a>', start:  date, editable: false};
			$('#calendar').fullCalendar('renderEvent', event, true);
*/
	});
}

$("#deleteEventButton").click(function(){ //change the button status
	$("#deleteEventButton").toggleClass("active");
});

////////////////////////////Calendar Size
$(".calendarToggle").on('click',function(){
   $("#calendar").toggle();
if($(".calendarChevron").hasClass("fa-chevron-down")){
   $(".calendarChevron").addClass("fa-chevron-right");
   $(".calendarChevron").removeClass("fa-chevron-down");
}
else{
    $(".calendarChevron").removeClass("fa-chevron-right");
   $(".calendarChevron").addClass("fa-chevron-down");
}});

/* ------------------------	*/
/*			Map Size						*/
/* ------------------------	*/
$(".mapToggle").on('click',function(){
   $(".map").toggle();
if($(".mapChevron").hasClass("fa-chevron-down")){
   $(".mapChevron").addClass("fa-chevron-right");
   $(".mapChevron").removeClass("fa-chevron-down");
}
else{
   $(".mapChevron").removeClass("fa-chevron-right");
   $(".mapChevron").addClass("fa-chevron-down");
}

$('#us6').width($(".mapdiv").width());
$('#us6').height($(".map").width()/1.8);
});
//////////////ADAPT SIZE MAP/////////////////////
$("#us6").width($(".mapdiv").width());
$("#us6").height($(".map").width()/1.8);




$(".pContactsToggle").on('click',function(){
   $("#pending-contact-list-full").toggle();
if($(".pContactsChevron").hasClass("fa-chevron-down")){
   $(".pContactsChevron").addClass("fa-chevron-right");
   $(".pContactsChevron").removeClass("fa-chevron-down");
}
else{
   $(".pContactsChevron").removeClass("fa-chevron-right");
   $(".pContactsChevron").addClass("fa-chevron-down");
}
});
