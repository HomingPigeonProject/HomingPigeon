/**
 * User login management
 * users at first must send their session id to login
 */

var dbManager = require('./dbManager');
var contact = require('./contact');
var rbTree = require('./RBTree');
var lib = require('./lib');
var async = require('async');

var users;

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

		dbManager.trxPattern([
			function(callback) {
				this.db.getUserById({userId: data.userId}, callback);
			}
		],
		function(err, result) {
			// err.code, err.errno
			if (err) {
				user.emit('login', {status: 'fail', errorMsg: 'failed to loign'});
				console.log('login error\r\n' + err);
				//throw err;
			} else if (result.length < 1) {
				// session not found
				user.emit('login', {status: 'fail', errorMsg: 'session not found'});
			} else {
				// login
				var data = result[0];
				//user.sessionId = data.sessionId;
				user.userId = data.id;
				user.email = data.email;
				user.nickname = data.nickname;
				user.picture = data.picture;
				user.lastSeen = data.lastSeen;
				user.login = data.login;
				user.state = userState.LOGIN;

				// returns object of data only available to other contacts
				user.getUserInfo = function() {return lib.filterUserData(this);};

				// add to user session pool
				if (!addUserSession(user)) {
					console.log('??');
					user.disconnect(false);
				}

				user.emit('login', {status: 'success', data: user.getUserInfo()});
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

function validateData(data) {
	if (data === undefined ||
			data === null)
		return false;
	return true;
}

// check if user is logined, then if user provided data if needed
function validateRequest(name, user, needData, data) {
	if (!logined(user)) {
		user.emit(name, {status: 'fail', errorMsg: 'login before request'});
		return false;
	}
	if (needData && !validateData(data)) {
		user.emit(name, {status: 'fail', errorMsg: 'no argument'});
		return false;
	}
	return true;
}

// User session pool management
// store list of user sessions with user id as a key
// it's list because a user can access with multiple devices at the same time
function addUserSession(user) {
	var userSessions = users.get(user.userId);

	if (!userSessions &&
			!users.add(user.userId, (userSessions = []))) {
		return false;
	}

	userSessions.push(user);

	return true;
}

function getUserSessions(userId) {
	return users.get(userId);
}

function removeUserSession(user) {
	var userSessions = users.get(user.userId);

	if (!userSessions)
		return false;

	// remove user session from list
	userSessions.splice(userSessions.indexOf(user), 1);

	// if no sessions, remove from tree
	if (userSessions.length == 0)
		users.remove(user.userId);

	return true;
}

function removeAllUserSession(userId) {
	if (users.remove(userId))
		return true;

	return false;
}

function initSession() {
	users = rbTree.createRBTree();
}

initSession();

module.exports = {init: init,
		userState: userState,
		logined: logined,
		validateData: validateData,
		validateRequest: validateRequest,
		addUserSession: addUserSession,
		getUserSessions: getUserSessions,
		removeUserSession: removeUserSession,
		removeAllUserSession: removeAllUserSession};
