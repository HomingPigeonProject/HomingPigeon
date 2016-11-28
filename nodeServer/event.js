/**
 * Event management
 * user can create, check events
 * when time for event comes, group for event is created
 */

function init(user) {
	// read every events of the user
	user.on('getEventList', function(data) {
		if (!session.validateRequest('getEventList', user, false))
			return;
		
		dbManager.trxPattern([
			function(callback) {
				this.db.getEventListByUser({userId: data.userId}, callback);
			},
			function(events, fields, callback) {
				this.data.events = events;
				var db = this.db;
				
				var eventIter = function(i) {
					if (i == events.length) {
						return callback(null);
					}
					
					var event = events[i];
					
					async.waterfall([
						function(callback) {
							db.getEventParticipants({eventId: event.eventId}, 
									callback);
						},
						function(result, fields, callback) {
							event.participants = result;
							
							callback(null);
						}
					],
					function(err) {
						if (err)
							return callback(err);
						
						eventIter(i + 1);
					});
				}
				
				eventIter(0);
			}
		],
		function(err) {
			if (err) {
				user.emit('getEventList', {status: 'fail', errorMsg: 'server error'});
			} else {
				user.emit('getEventList', {status: 'success', events: this.data.events});
			}
		});
	});
	
	// create event with participants
	user.on('createEvent', function(data) {
		if (!session.validateRequest('createEvent', user, false))
			return;
		
		var emails = data.participants;
		var nbParticipantsMax = parseInt(data.nbParticipantsMax);
		var name = data.name;
		var description = data.description;
		var date = data.date;
		if (nbParticipantsMax !== nbParticipantsMax ||
				!lib.isArray(participants) ||
				!lib.isDate(date) ||
				!name)
			return;
		
		dbManager.trxPattern([
			function(callback) {
				getParticipants({user: user, emails: emails, 
					db: this.db}, callback);
			},
			function(participants, callback) {
				this.data.participants = participants;
				
				// add the user if not contained
				if (!lib.containsUser(user, participants))
					participants.push(lib.filterUserData(user));
				
				var event = {name: name, description: description, groupId: null, 
						date: date.getTime(), nbParticipantsMax: nbParticipantsMax};
				
				this.data.event = event;
				
				this.db.addEvent(event, callback);
			},
			function(result, fields, callback) {
				this.db.lastInsertId(callback);
			},
			function(result, fields, callback) {
				if (result.length == 0)
					return callback(new Error('no last insert id'));
				
				var participants = this.data.participants;
				var eventId = result[0];
				this.data.eventId = eventId;
				
				addParticipants({eventId: eventId, participants: participants},
						callback);
			},
			function(callback) {
				this.db.getEventById({eventId: this.data.eventId}, callback);
			},
			function(result, fields, callback) {
				if (result.length == 0)
					return callback(new Error('event read failed'));
				
				var event = result[0];
				var participants = this.data.participants;
				var sessions = session.getUsersSessions(participants);
				
				event.participants = participants;
				
				// notify every online participants
				sessions.forEach(function(session) {
					session.emit('eventCreated', event);
				});
				
				callback(null);
			}
		],
		function(err) {
			if (err) {
				user.emit('createEvent', {status: 'fail', errorMsg: 'server error'});
			}
		});
	});
	
	// user leaves event
	user.on('exitEvent', function(data) {
		if (!session.validateRequest('exitEvent', user, false))
			return;
		
	});
}

// input: data.user, data.emails(array of email)
var getParticipants = function(data, callback) {
	var pattern;
	
	var user = data.user;
	var emails = data.emails;
	
	if (data.trx)
		pattern = dbManager.trxPattern;
	else
		pattern = dbManager.atomicPattern;
	
	if (!emails)
		return callback(null, []);
	
	pattern([
		function(callback) {
			var validps = [];
			
			var parIter = function(i) {
				if (i == emails.length) {
					return callback(null, validps);
				}
				
				var email = emails[i];
				if (email)
					email = email.toString().trim();
				
				dbManager.atomicPattern([
					function(callback) {
						// get user info
						this.db.getUserByEmail({email: email, lock: true}, callback);
					},
					function(result, fields, callback) {
						if (result.length == 0)
							return callback(new Error('no such user'));
						
						var peer = result[0];
						this.data.peer = peer;
						
						this.db.getAcceptedContact({userId: user.userId, userId2: peer.userId, lock: true},
								callback);
					},
					function(result, fields, callback) {
						if (result.length == 0)
							return callback(new Error('You can invite only your contacts'));
						
						// valid contact
						validps.push(lib.filterUserData(this.data.peer));
						
						callback(null);
					}
				],
				function(err) {
					if (err)
						callback(err);
					else
						parIter(i + 1);
				},
				{db: this.db});
			};
			
			parIter(0);
		}
	],
	function(err, participants) {
		if (err)
			callback(err);
		else
			callback(null, participants);
	},
	{db: data.db});
};

// input: data.eventId, data.participants(array of user info)
var addParticipants = function(data, callback) {
	var pattern;
	
	var eventId = data.eventId;
	var participants = data.participants;
	
	if (data.trx)
		pattern = dbManager.trxPattern;
	else
		pattern = dbManager.atomicPattern;
	
	if (!participants)
		return userCallback(null);
	
	pattern([
		function(callback) {
			var db = this.db;
			
			var parIter = function(i) {
				if (i == participants.length) {
					return callback(null);
				}
				
				var participant = participants[i];
				
				async.waterfall([
					function(callback) {
						// get user info
						this.db.addEventParticipant({eventId: eventId, 
							userId: participant.userId}, callback);
					}
				],
				function(err){
					if (err)
						callback(err);
					else
						parIter(i + 1);
				});
			};
			
			parIter(0)
		}
	],
	function(err) {
		if (err)
			callback(err);
		else
			callback(null);
	},
	{db: data.db});
};

// Sees every events and starts events in its time
var eventManager = function() {
	
};

module.exports = {init: init};

var session = require('./session');
var dbManager = require('./dbManager');
var chatManager = require('./chatManager');
var lib = require('./lib');
var async = require('async');