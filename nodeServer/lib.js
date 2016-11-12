//gets result of getUserByEmail, or getUserById and
//returns object of data only available to other users
var filterUserData = function(user) {
	return {userId: user.userId || user.id, email: user.email, 
		nickname: user.nickname, picture: user.picture,
		lastSeen: user.lastSeen, login: user.login};
}

var filterUsersData = function(users) {
	var result = [];
	
	for (var i = 0; i < users.length; i++) {
		result.push(filterUserData(users[i]));
	}
	
	return result;
}

var filterGroupData = function(group) {
	return {groupId: group.groupId, name: group.name, 
		nbMembers: group.nbMembers, lastMessageDate: group.lastMessageDate,
		lastMessageId: group.lastMessageId, alias: group.alias,
		members: group.members};
}

module.exports = {filterUserData: filterUserData,
		filterUsersData: filterUsersData,
		filterGroupData: filterGroupData};