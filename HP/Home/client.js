var userId = str = document.getElementById("phpUserId").textContent.replace(/\s/g, "");
var sessionId = document.getElementById("phpSessionId").textContent.replace(/\s/g, "");
//console.log("The user id is : ", userId);
//console.log("The session  id is : ", sessionId);

var logined = false;
var port = 4000;
var server = io.connect('https://vps332892.ovh.net:4000');
window.addEventListener('load', function() {
	var controlDiv = document.getElementById('control');

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
	server.on('login', function(data) {
		if (data.status == 'success') {

			server.emit('getPendingContactList');
			server.emit('getPendingGroupList');
			server.emit('getContactList');
			server.emit('getGroupList');

			//$('#loginStatus').text('status : logined');
			logined = true;

			// HTML forms
			$('#contactAddButton').click(function() {
				server.emit('addContact', { email: $('#contactInput').val() });
				server.emit('getPendingContactList');
			});
			$('#createGroupButton').click(function () {
				server.emit('addGroup', {name: $('#createGroupNameInput').val(), members: new Array()});
				server.emit('getGroupList');
			});
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
		} else {
			console.log("failed to get contact list");
		}
	});
	server.on('getGroupList', function(data) {
		if (data.status == 'success') {
			var groups = data.groups;
			var groupListDiv = document.getElementById("group-list");
			printGroupList(groups, groupListDiv, false);
		} else {
			console.log('failed to get group list');
		}
	});

	/*
	server.on('getPendingGroupList', function(data) {
		if (data.status == 'success') {
			var pgroups = data.groups;
			var groupListDiv = document.getElementById("group-list");
			printGroupList(groups, groupListDiv, true);
		} else {
			console.log('failed to get pending group list');
		}

	});
	*/


});


function printContactList(contacts, parentDiv, pending) {
	parentDiv.innerHTML = "";
	var arrayLength = contacts.length;
	for (var i = 0; i < arrayLength; i++) {
		var contact = contacts[i];
		var invited = contact["invited"];

		var div = document.createElement("div");
		div.className ="contact";

		var contactName = document.createElement("p");
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

		} else if (pending && !pending) {

			var denyContactButton = document.createElement("button");
			denyContactButton.className = "denyContactButton";
			denyContactButton.innerHTML = "❌";
			denyContactButton.id = contact["email"];
			div.appendChild(denyContactButton);

		} else {
			var removeContactButton = document.createElement("button");
			removeContactButton.className = "removeContactButton";
			removeContactButton.innerHTML = "❌";
			removeContactButton.id = contact["email"];
			div.appendChild(removeContactButton);
		}

		var contactConferenceLink = document.createElement('a');
		contactConferenceLink.className = "conferenceLink";
		contactConferenceLink.appendChild(document.createTextNode("conference"));
		contactConferenceLink.title = "conference";
		contactConferenceLink.target = "_blank ";
		contactConferenceLink.href = "../Conference/page.php?" + "c" + contact["contactId"];

		var contactChatLink = document.createElement('a');
		contactChatLink.className = "chatLink";
		contactChatLink.appendChild(document.createTextNode("chat"));
		contactChatLink.title = "chat";
		contactChatLink.href = "http://www.google.com";


		div.appendChild(contactConferenceLink);
		div.appendChild(document.createElement('br'));
		div.appendChild(contactChatLink);

		parentDiv.appendChild(div);
	}

	$('.acceptContactButton').click(function() {
		server.emit('acceptContact', {email: this.id});
		server.emit('getPendingContactList'); // reload the pending contact list to remove
		server.emit('getContactList'); // reload the contact list to include the new contact
	});
	$('.denyContactButton').click(function() {
		server.emit('denyContact', {email: this.id});
		server.emit('getPendingContactList');
	});
	$('.removeContactButton').click(function(){
		server.emit('removeContact', {email: this.id});
		server.emit('getContactList');
	});

}

function printGroupList(groups, parentDiv, pending) {
	parentDiv.innerHTML = "";
	var arrayLength = groups.length;
	for (var i = 0; i < arrayLength; i++) {
		var group = groups[i];
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
		groupConferenceLink.appendChild(document.createTextNode("conference"));
		groupConferenceLink.title = "conference";
		groupConferenceLink.target = "_blank ";
		groupConferenceLink.href = "../Conference/page.php?" + "g" + group["id"];

		var groupChatLink = document.createElement('a');
		groupChatLink.className = "chatLink";
		groupChatLink.appendChild(document.createTextNode("chat"));
		groupChatLink.title = "chat";
		groupChatLink.href = "http://www.google.com";

		var exitGroupButton = document.createElement("button");
		exitGroupButton.className = "exitGroupButton";
		exitGroupButton.innerHTML = "❌";
		exitGroupButton.id = group["id"];

		var addContactToGroupForm = document.createElement('form');
		var addContactToGroupEmail = document.createElement('input');
		addContactToGroupEmail.type = 'test';
		addContactToGroupEmail.placeholder = 'contact email';
		addContactToGroupEmail.className = "addContactToGroupEmail";
		var addContactToGroupButton = document.createElement('button');
		addContactToGroupButton.innerHTML = "add";
		addContactToGroupButton.className = "addContactToGroupButton";
		addContactToGroupButton.id = group["id"];

		addContactToGroupForm.appendChild(addContactToGroupEmail);
		addContactToGroupForm.appendChild(addContactToGroupButton);

		div.appendChild(exitGroupButton);
		div.appendChild(groupConferenceLink);
		div.appendChild(document.createElement('br'));
		div.appendChild(groupChatLink);

		div.appendChild(addContactToGroupForm);



		parentDiv.appendChild(div);
	}

	$('.exitGroupButton').click(function(){
		server.emit('exitGroup', {groupId: this.id});
		server.emit('getGroupList');
	});
	$('.addContactToGroupButton').click(function(){
		var truc = new Array();
		truc.push($(this).prev().val()); // the email given in the input field
		server.emit('inviteGroupMembers', {groupId: this.id, members: truc});
	});

}

function reset() {
	//$('#control').html("<label id='loginStatus'>status : not logined</label>");
	logined = false;
}
