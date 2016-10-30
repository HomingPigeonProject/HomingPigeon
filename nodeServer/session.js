/** 
 * User login management
 * users at first must send their session id to login
 */
var dbManager = require('./dbManager');
var async = require('async');

var userState = {
	LOGOUT: 0,
	LOGIN: 1
};

function init(user) {
	user.state = userState.LOGOUT;
	// user must give session id to login
	user.on('login', function(data) {
		if (logined(user)) {
			user.emit('login', {status: 'fail', errorMsg: 'already logined'});
			return;
		}
		
		var db;
		async.waterfall([
			function(callback) {
				dbManager.getConnection(callback);
			},
			function(result, callback) {
				db = result;
				db.getUserBySession({sessionId: data.sessionId}, callback);
			}
		],
		function(err, result) {
			if (db)
				db.release();
			// err.code, err.errno
			if (err) {
				user.emit('login', {status: 'fail', errorMsg: 'failed to loign'});
				console.log('login error');
				//throw err;
			} else if (result.length < 1) {
				// session not found
				user.emit('login', {status: 'fail', errorMsg: 'session not found'});
			} else {
				// login
				var data = result[0];
				user.sessionId = data.sessionId;
				user.userId = data.id;
				user.email = data.email;
				user.nickname = data.nickname;
				user.picture = data.picture;
				user.state = userState.LOGIN;
				user.emit('login', {status: 'success', 
					data: {nickname: data.nickname,
							email: data.email,
							picture: data.picture}});
				console.log('user ' + user.email + ' logined');
			}
		});
	});
}

function logined(user) {
	if (user.state == userState.LOGIN) {
		return true;
	}
	return false;
}

module.exports = {init: init,
		userState: userState,
		logined: logined};
