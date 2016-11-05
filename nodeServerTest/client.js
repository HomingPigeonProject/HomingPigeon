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
	server.on('login', function(data) {
		console.log(data);
		if (data.status == 'success') {
			$('#loginStatus').text('status : logined');
			logined = true;
			$('#control').append("<button id='contactList' type='button'>get contact list</button>");
			$('#contactList').click(function() {
				server.emit('getContactList');
			});

			// create contact list manage panel
			var contactForm = document.createElement('form');
			var contactInput = document.createElement('input');
			var contactAddButton = document.createElement('button');
			var contactRemoveButton = document.createElement('button');
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
			contactForm.appendChild(contactInput);
			contactForm.appendChild(contactAddButton);
			contactForm.appendChild(contactRemoveButton);

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
			memberNameInput.placeholder = 'put member name(a, b, c)';
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

			controlDiv.appendChild(contactForm);
			controlDiv.appendChild(groupListButton);
			controlDiv.appendChild(groupForm);

			$('#contactAddButton').click(function() {
				server.emit('addContact', { email: $('#contactInput').val() });
			});
			$('#contactRemoveButton').click(function() {
				server.emit('removeContact', { email: $('#contactInput').val() });
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
		} else {
			console.log('failed to add group...');
		}
	});
	server.on('addContact', function(data) {
		if (data.status == 'success') {
			console.log('added contact!');
			console.log(data);
		} else {
			console.log('failed to add contact...');
		}
	});
	server.on('removeContact', function(data) {
		if (data.status == 'success') {
			console.log('removed contact!');
			console.log(data);
		} else {
			console.log('failed to remove contact...');
		}
	});

	server.on('getGroupList', function(data) {
		if (data.status == 'success') {
			console.log(data);
		} else {
			console.log('failed to get group list...');
		}
	});
	// TODO: create contact list panel
	server.on('getContactList', function(data) {
		if (data.status == 'success')
			console.log(data);
	});

	reset();
});

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
