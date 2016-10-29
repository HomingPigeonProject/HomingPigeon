var logined = false;
window.addEventListener('load', function() {
	var server = io.connect('http://localhost:4000');
	server.on('connect', function() {
		console.log('connected to server');
	});
	server.on('reconnect', function() {
		console.log('reconnected to server');
	});
	server.on('login', function(data) {
		console.log(data);
		if (data.status == 'success') {
			console.log(data['data']);
			$('#loginStatus').text('status : logined');
			logined = true;
			$('body').append("<button id='contactList' type='button'>get contact list</button>");
			$('#contactList').click(function() {
				server.emit('getContactList');
			});
			
			// create contact list manage panel
			var contactForm = document.createElement('form');
			var contactInput= document.createElement('input');
			var contactAddButton = document.createElement('button');
			contactForm.action = 'javascript:void(0);';
			contactInput.id = 'contactInput';
			contactInput.placeholder = 'put contact email';
			contactInput.type = 'text';
			contactAddButton.id = 'contactAddButton';
			contactAddButton.type = 'button';
			contactAddButton.innerHTML = 'add contact';
			contactForm.appendChild(contactInput);
			contactForm.appendChild(contactAddButton);
			document.body.appendChild(contactForm);
			$('#contactAddButton').click(function() {
				server.emit('addContact', { email: $('#contactInput').val() });
			});
			server.on('addedContact', function(data) {
				if (data.status == 'success') {
					console.log('added contact!');
				} else {
					console.log('failed to add contact...');
				}
			});
			
			// TODO: create contact list panel
		} 
	});
	server.on('contactList', function(data) {
		console.log(data);
	});
	$('#sessionLogin').submit(function() {
		if (!logined)
			server.emit('login', {sessionId: $('#sessionId').val()});
	});
});