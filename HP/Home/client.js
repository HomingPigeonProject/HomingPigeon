var userId = str = document.getElementById("phpUserId").textContent.replace(/\s/g, "");
var sessionId = document.getElementById("phpSessionId").textContent.replace(/\s/g, "");
console.log("The user id is : ", userId);
console.log("The session  id is : ", sessionId);

var logined = false;
var server = io.connect('http://vps332892.ovh.net:4000');
window.addEventListener('load', function() {
	var controlDiv = document.getElementById('control');

	server.on('connect', function() {
		console.log('connected to server');
		reset();
		server.emit('login', {userId: userId});
	});
	server.on('reconnect', function() {
		console.log('reconnected to server');
		reset();
		server.emit('login', {userId: userId});
	});
	server.on('login', function(data) {
		console.log(data);
		if (data.status == 'success') {

			server.emit('getContactList');
			server.emit('getGroupList');

			//$('#loginStatus').text('status : logined');
			logined = true;
			/*
			$('#control').append("<button id='contactList' type='button'>get contact list</button>");
			$('#contactList').click(function() {
				server.emit('getContactList');
			});
			*/

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
			//contactForm.appendChild(contactRemoveButton);

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
			//controlDiv.appendChild(groupListButton);
			controlDiv.appendChild(groupForm);



			// pierre
			var createGroupForm = document.createElement('form');

			var createGroupNameInput = document.createElement('input');
			createGroupNameInput.id = 'createGroupNameInput';
			createGroupNameInput.placeholder = 'group name';
			createGroupNameInput.type = 'text';

			var createGroupButton = document.createElement('button');
			createGroupButton.id = 'createGroupButton';
			createGroupButton.innerHTML = 'create group';

			createGroupForm.appendChild(createGroupNameInput);
			createGroupForm.appendChild(createGroupButton);

			controlDiv.appendChild(createGroupForm);



			$('#createGroupButton').click(function () {
				server.emit('addGroup', {name: $('#createGroupNameInput').val(), members: new Array()});
			});


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
			server.emit('getGroupList');
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
			server.emit('getGroupList');
			console.log(data);
		} else {
			console.log('failed to add group...');
		}
	});
	server.on('addContact', function(data) {
		if (data.status == 'success') {
			console.log('added contact!');
			server.emit('getContactList');
			console.log(data);
		} else {
			console.log('failed to add contact...');
		}
	});
	server.on('removeContact', function(data) {
		if (data.status == 'success') {
			console.log('removed contact!');
			server.emit('getContactList');
			console.log(data);
		} else {

			console.log('failed to remove contact...');
		}
	});



	server.on('getContactList', function(data) {
		if (data.status == 'success') {


			// print the contact list
			var contactListDiv = document.getElementById("contact-list");
			contactListDiv.innerHTML="";
			var title = document.createElement('p');
			title.textContent = "Contact List ";
			title.className = "listTitle";

			contactListDiv.appendChild(title);

			var arrayLength = data.contacts.length;
			for (var i = 0; i < arrayLength; i++) {
				var contact = data.contacts[i];

				console.log(contact);

				var div = document.createElement("div");
				div.className ="contact";

				var contactName = document.createElement("p");
				contactName.textContent = contact["nickname"];
				contactName.className="group-contactName";

				// also add the links to the chats
				var url = document.getElementById("phpURL").textContent;

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

				//var c = document.createElement('div');
				//c.className = "buttonEmail";
				//c.innerHTML = contact.email;
				//div.appendChild(c);

				var removeContactButton = document.createElement("button");
				removeContactButton.className = "removeContactButton";
				removeContactButton.innerHTML = "x";
				removeContactButton.id = contact["email"];

				div.appendChild(contactName);
				div.appendChild(removeContactButton);

				div.appendChild(contactConferenceLink);
				div.appendChild(document.createElement('br'));
				div.appendChild(contactChatLink);

				contactListDiv.appendChild(div);
			}

			$('.removeContactButton').click(function(){
				server.emit('removeContact', {email: this.id});
			});

		}

	});



		server.on('getGroupList', function(data) {
			if (data.status == 'success') {

				// print the groupList
				console.log(data);

				// print the group list
				var groupListDiv = document.getElementById("group-list");
				groupListDiv.innerHTML="";
				var title = document.createElement('p');
				title.textContent = "Group List ";
				title.className = "listTitle";
				groupListDiv.appendChild(title);

				var arrayLength = data.groups.length;
				for (var i = 0; i < arrayLength; i++) {
					var group = data.groups[i];
					console.log("Group : ");
					console.log(group);

					var div = document.createElement("div");
					div.className ="group";

					var groupName = document.createElement("p");
					groupName.textContent = group["name"];
					groupName.className="group-contactName";


					// also add the links to the chats
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
					exitGroupButton.innerHTML = "x";
					exitGroupButton.id = group["id"];

					var addContactToGroupForm = document.createElement('form');
					var addContactToGroupEmail = document.createElement('input');
					addContactToGroupEmail.type = 'test';
					addContactToGroupEmail.placeholder = 'contact email';
					addContactToGroupEmail.className = "addContactToGroupEmail";
					var addContactToGroupButton = document.createElement('button');
					//addContactToGroupButton.type = 'button';
					addContactToGroupButton.innerHTML = "add";
					addContactToGroupButton.className = "addContactToGroupButton";
					addContactToGroupButton.id = group["id"];

					addContactToGroupForm.appendChild(addContactToGroupEmail);
					addContactToGroupForm.appendChild(addContactToGroupButton);

					div.appendChild(groupName);
					div.appendChild(exitGroupButton);
					div.appendChild(groupConferenceLink);
					div.appendChild(document.createElement('br'));
					div.appendChild(groupChatLink);

					div.appendChild(addContactToGroupForm);

					groupListDiv.appendChild(div);

				}


				$('.exitGroupButton').click(function(){
					server.emit('exitGroup', {groupId: this.id});
				});
				$('.addContactToGroupButton').click(function(){
					var truc = new Array();
					truc.push($(this).prev().val()); // the email given in the input field
					server.emit('inviteGroupMembers', {groupId: this.id, members: truc});
				});


			} else {
				console.log('failed to get group list...');
			}
		});


});




function reset() {
	//$('#control').html("<label id='loginStatus'>status : not logined</label>");
	logined = false;
}
