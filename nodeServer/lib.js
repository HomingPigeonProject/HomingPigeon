//gets result of getUserByEmail, or getUserById and
//returns object of data only available to other users
var filterUserData = function(user) {
	return {userId: user.userId || user.id, email: user.email, 
		nickname: user.nickname, picture: user.picture,
		lastSeen: user.lastSeen, login: user.login};
};

// data of multiple users, it filters duplicate
var filterUsersData = function(users) {
	var result = [];
	
	var contains = function(user) {
		for (var i = 0; i < result.length; i++) {
			if (result[i].userId == user.userId)
				return true;
		}
		
		return false;
	};
	
	for (var i = 0; i < users.length; i++) {
		if (!contains(users[i]))
			result.push(filterUserData(users[i]));
	}
	
	return result;
};

var filterGroupData = function(group) {
	return {groupId: group.groupId, name: group.name, 
		nbMembers: group.nbMembers, lastMessageDate: group.lastMessageDate,
		lastMessageId: group.lastMessageId, alias: group.alias,
		members: group.members, contactId: group.contactId || null};
};

var filterMessageData = function(message) {
	return {groupId: message.groupId, messageId: message.messageId,
		userId: message.userId, nbread: message.nbread, 
		date: message.date, importance: message.importance,
		content: message.content, location: message.location};
};

var isArray = function(array) {
	if (array && typeof array == 'object' && array.hasOwnProperty('length'))
		return true;
	
	return false;
};

var isDate = function(date) {
	if (date && date instanceof Date && typeof date.getTime === 'function')
		return true;
	
	return false;
};

var containsUser = function(user, array) {
	for (var member in array) {
		if (member && member.userId == user.userId)
			return true;
	}
	
	return false;
};

var callbackRecursionProto = {
	i: 0,
	data: null,
	userCallback: null,
	callback: function(err) {
		if (err) {
			if (this.userCallback)
				this.userCallback(err, this.data);
		} else {
			this.i++;
			this.wrapFunc();
		}
	},
	appliedCallback: null,
	wrapFunc: function() {
		if (!this.cond(this.i)) {
			return this.userCallback(null, this.data);
		}
		
		this.main(this.i, this.appliedCallback);
	},
	start: function() {
		this.wrapFunc();
	},
	main: null,
	cond: null
};

var recursionConstructor = function(main, cond, callback) {
	this.data = {};
	this.userCallback = callback;
	this.main = main;
	this.cond = cond;
	var obj = this;
	this.appliedCallback = function(err) {
		obj.callback(err);
	};
};

recursionConstructor.prototype = callbackRecursionProto;

var recursion = function(cond, main, callback) {
	new recursionConstructor(main, cond, callback).start();
};

module.exports = {filterUserData: filterUserData,
		filterUsersData: filterUsersData,
		filterGroupData: filterGroupData,
		filterMessageData: filterMessageData,
		isArray: isArray,
		isDate: isDate,
		containsUser: containsUser,
		recursion: recursion};

if (require.main == module) {
	
	// test recursion
	var lib = require('./lib');
	r = lib.recursion(
	// condition
	function(i) {
		console.log(this.data);
		return i < 11;
	},
	// main body
	function(i, callback) {
		
		console.log(this.data);
		console.log(i);
		
		this.data.a = 1;
		
		if (i < 10)
			callback(null);
		else
			callback(new Error('error'));
	},
	// callback
	function(err, data) {
		console.log('end');
		console.log(err);
		console.log(data);
	});
	
}