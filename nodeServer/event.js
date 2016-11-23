/**
 * Event management
 * user can create, check events
 * when time for event comes, group for event is created
 */

function init(user) {
	user.on('getEventList', function(data) {
		if (!session.validateRequest('getEventList', user, false))
			return;
		
		dbManager.trxPattern([
			function(callback) {
				
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
	
	user.on('createEvent', function(data) {
		if (!session.validateRequest('createEvent', user, false))
			return;
		
	});
}

module.exports = {init: init};

var session = require('./session');
var dbManager = require('./dbManager');
var chatManager = require('./chatManager');
var lib = require('./lib');
var async = require('async');