//gets result of getUserByEmail, or getUserById and
//returns object of data only available to other users
var filterUserData = function(user) {
	return {userId: user.userId || user.id, email: user.email, 
		nickname: user.nickname, picture: user.picture,
		lastSeen: user.lastSeen, login: user.login};
}

module.exports = {filterUserData: filterUserData};