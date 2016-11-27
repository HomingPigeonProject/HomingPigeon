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

module.exports = {filterUserData: filterUserData,
		filterUsersData: filterUsersData,
		filterGroupData: filterGroupData,
		isArray: isArray,
		isDate: isDate,
		containsUser: containsUser};