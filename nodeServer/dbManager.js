/**
 *  Interface for database access, data manipulation
 */
var mysql = require('mysql');
var async = require('async');

// db connection configuration
var pool = mysql.createPool({
    host : 'localhost',
    port : 3306,
    user : 'user',
    password : 'HomingPigeon0!',
    database:'HomingPigeon',
    connectionLimit:64,
    waitForConnections:true,
    acquireTimeout:60000
});

// this is called first when connection is created
pool.on('connection', function (connection) {
	connection.query('SET NAMES UTF8');
	connection.query('SET AUTOCOMMIT=1');
});

// sql queries
var queries = {
	getUserById: "SELECT *, id as userId FROM Accounts WHERE id = ? %",

	getUserByEmail: "SELECT *, id as userId FROM Accounts WHERE email = ? %",

	getUserBySession: "SELECT *, id as userId " +
			"FROM Accounts INNER JOIN Sessions ON Accounts.id = Sessions.accountId %" +
			"WHERE sessionId = ? ",

	getAcceptedContactListByUser: "SELECT r.userId, r.email, r.nickname, r.picture, " +
			"r.login, r.lastSeen, r.contactId, r.groupId, gm.nbNewMessages " +
			"FROM (SELECT r.userId, r.email, r.nickname, r.picture, " +
			"r.login, r.lastSeen, r.contactId, g.id as groupId " +
			"FROM ((SELECT a.id as userId, a.email, a.nickname, a.picture, " +
			"a.login, a.lastSeen, c.id as contactId " +
			"FROM Accounts a INNER JOIN Contacts c ON a.id = c.accountId " +
			"WHERE c.accountId2 = ? and c.accepted = 1) " +
			"UNION " +
			"(SELECT a.id as userId, a.email, a.nickname, a.picture, " +
			"a.login, a.lastSeen, c.id as contactId " +
			"FROM Accounts a INNER JOIN Contacts c ON a.id = c.accountId2 " +
			"WHERE c.accountId = ? and c.accepted = 1)) r " +
			"LEFT JOIN Groups g ON r.contactId = g.contactId) r " +
			"LEFT JOIN GroupMembers gm on r.groupId = gm.groupId " +
			"WHERE gm.accountId is null or gm.accountId = ? " +
			"ORDER BY r.nickname %",

	getPendingContactListByUser: "SELECT r.userId, r.email, r.nickname, r.picture, r.login, r.invited " +
			"FROM ((SELECT c.id as contactId, a.id as userId, a.email, a.nickname, a.picture, " +
			"a.login, 1 as invited " +
			"FROM Accounts a INNER JOIN Contacts c ON a.id = c.accountId " +
			"WHERE c.accountId2 = ? and c.accepted = 0) " +
			"UNION " +
			"(SELECT c.id as contactId, a.id as userId, a.email, a.nickname, a.picture, " +
			"a.login, 0 as invited " +
			"FROM Accounts a INNER JOIN Contacts c ON a.id = c.accountId2 " +
			"WHERE c.accountId = ? and c.accepted = 0)) r " +
			"ORDER BY r.contactId desc %",

	getContact: "SELECT r.userId, r.email, r.nickname, r.picture, " +
			"r.login, r.lastSeen, r.contactId, g.id as groupId " +
			"FROM ((SELECT a.id as userId, a.email, a.nickname, a.picture, " +
			"a.login, a.lastSeen, c.id as contactId " +
			"FROM Accounts a INNER JOIN Contacts c ON a.id = c.accountId " +
			"WHERE c.accountId2 = ? and a.id = ?) " +
			"UNION " +
			"(SELECT a.id as userId, a.email, a.nickname, a.picture, " +
			"a.login, a.lastSeen, c.id as contactId " +
			"FROM Accounts a INNER JOIN Contacts c ON a.id = c.accountId2 " +
			"WHERE c.accountId = ? and a.id = ?)) r " +
			"LEFT JOIN Groups g ON r.contactId = g.contactId " +
			"ORDER BY r.nickname %",

	getAcceptedContact: "SELECT r.userId, r.email, r.nickname, r.picture, " +
			"r.login, r.lastSeen, r.contactId, g.id as groupId " +
			"FROM ((SELECT a.id as userId, a.email, a.nickname, a.picture, " +
			"a.login, a.lastSeen, c.id as contactId " +
			"FROM Accounts a INNER JOIN Contacts c ON a.id = c.accountId " +
			"WHERE c.accountId2 = ? and a.id = ? and c.accepted = 1) " +
			"UNION " +
			"(SELECT a.id as userId, a.email, a.nickname, a.picture, " +
			"a.login, a.lastSeen, c.id as contactId " +
			"FROM Accounts a INNER JOIN Contacts c ON a.id = c.accountId2 " +
			"WHERE c.accountId = ? and a.id = ? and c.accepted = 1)) r " +
			"LEFT JOIN Groups g ON r.contactId = g.contactId " +
			"ORDER BY r.nickname %",

	getPendingContact: "SELECT * " +
			"FROM ((SELECT accountId as requestUserId, accountId2 as acceptUserId " +
			"FROM Contacts " +
			"WHERE accountId2 = ? and accountId = ? and accepted = 0) " +
			"UNION " +
			"(SELECT accountId as requestUserId, accountId2 as acceptUserId " +
			"FROM Contacts  " +
			"WHERE accountId = ? and accountId2 = ? and accepted = 0)) result %",

	getContactByGroup: "SELECT c.accountId as userId, c.accountId2 as userId2, " +
			"c.id as contactId, c.accepted, g.id as groupId " +
			"FROM Contacts c INNER JOIN Groups g ON c.id = g.contactId " +
			"WHERE g.id = ? %",

	getGroupById: "SELECT g.id as groupId, g.name, g.contactId, g.eventId, g.nbMembers, " +
			"max(m.date) as lastMessageDate, max(m.messageId) as lastMessageId " +
			"FROM Messages m RIGHT JOIN " +
			"(SELECT g.id, g.name, g.contactId, g.eventId, count(gm.accountId) as nbMembers " +
			"FROM GroupMembers gm RIGHT JOIN " +
			"Groups g ON gm.groupId = g.id " +
			"WHERE g.id = ? " +
			"%) g ON g.id = m.groupId %",

	getGroupOfUserById: "SELECT g.id as groupId, g.name, g.contactId, g.eventId, g.nbNewMessages, " +
			"g.alias, g.nbMembers, max(m.date) as lastMessageDate, max(m.messageId) as lastMessageId " +
			"FROM Messages m RIGHT JOIN " +
			"(SELECT g.id, g.name, g.contactId, g.eventId, g.nbNewMessages, g.alias, " +
			"count(gm.accountId) as nbMembers " +
			"FROM GroupMembers gm RIGHT JOIN " +
			"(SELECT g.id, g.name, g.contactId, g.eventId, gm.nbNewMessages, gm.alias " +
			"FROM Groups g INNER JOIN GroupMembers gm ON g.id = gm.groupId " +
			"WHERE gm.groupId = ? and gm.accountId = ? " +
			"%) g ON g.id = gm.groupId " +
			"%) g ON g.id = m.groupId %",


	getGroupListByUser: "SELECT g.id as groupId, g.name, g.contactId, g.eventId, g.nbNewMessages," +
			"g.alias, g.nbMembers, max(m.date) as lastMessageDate, max(m.messageId) as lastMessageId " +
			"FROM Messages m RIGHT JOIN " +
			"(SELECT g.id, g.name, g.contactId, g.eventId, g.nbNewMessages, g.alias, " +
			"count(gm.accountId) as nbMembers " +
			"FROM GroupMembers gm RIGHT JOIN " +
			"(SELECT g.id, g.name, g.contactId, g.eventId, gm.nbNewMessages, gm.alias " +
			"FROM Groups g INNER JOIN GroupMembers gm ON g.id = gm.groupId " +
			"WHERE gm.accountId = ? and g.contactId is null " +
			"%) g on g.id = gm.groupId " +
			"GROUP BY g.id " +
			"%) g on g.id = m.groupId " +
			"GROUP BY g.id " +
			"ORDER BY lastMessageDate desc %",

	getContactGroupListByUser: "SELECT g.id as groupId, g.name, g.contactId, g.eventId, g.nbNewMessages, " +
			"g.alias, g.nbMembers, max(m.date) as lastMessageDate, max(m.messageId) as lastMessageId " +
			"FROM Messages m RIGHT JOIN " +
			"(SELECT g.id, g.name, g.contactId, g.eventId, g.nbNewMessages, g.alias, " +
			"count(gm.accountId) as nbMembers " +
			"FROM GroupMembers gm RIGHT JOIN " +
			"(SELECT g.id, g.name, g.contactId, g.eventId, gm.nbNewMessages, gm.alias " +
			"FROM Groups g INNER JOIN GroupMembers gm ON g.id = gm.groupId " +
			"WHERE gm.accountId = ? and g.contactId is not null " +
			"%) g on g.id = gm.groupId " +
			"GROUP BY g.id " +
			"%) g on g.id = m.groupId " +
			"GROUP BY g.id " +
			"ORDER BY lastMessageDate desc %",

	getAllGroupListByUser: "SELECT g.id as groupId, g.name, g.contactId, g.eventId, g.nbNewMessages, " +
			"g.alias, g.nbMembers, max(m.date) as lastMessageDate, max(m.messageId) as lastMessageId " +
			"FROM Messages m RIGHT JOIN " +
			"(SELECT g.id, g.name, g.contactId, g.eventId, g.nbNewMessages, g.alias, " +
			"count(gm.accountId) as nbMembers " +
			"FROM GroupMembers gm RIGHT JOIN " +
			"(SELECT g.id, g.name, g.contactId, g.eventId, gm.nbNewMessages, gm.alias " +
			"FROM Groups g INNER JOIN GroupMembers gm ON g.id = gm.groupId " +
			"WHERE gm.accountId = ? " +
			"%) g on g.id = gm.groupId " +
			"GROUP BY g.id " +
			"%) g on g.id = m.groupId " +
			"GROUP BY g.id " +
			"ORDER BY lastMessageDate desc %",

	getGroupMemberByUser: "SELECT * FROM GroupMembers " +
			"WHERE groupId = ? and accountId = ? %",

	getGroupMembersByUser: "SELECT * FROM GroupMembers " +
		"WHERE groupId = ? and accountId in (?) %",

	getGroupMembers: "SELECT a.id as userId, a.email, a.nickname, " +
			"a.picture, a.lastSeen, a.login " +
			"FROM Accounts a INNER JOIN " +
			"(SELECT gm.accountId " +
			"FROM Groups g INNER JOIN GroupMembers gm ON g.id = gm.groupId " +
			"WHERE g.id = ? " +
			"%) m ON a.id = m.accountId %",

	getGroupMemberNumber: "SELECT count(accountId) as nbMembers " +
			"FROM GroupMembers " +
			"WHERE groupId = ? %",

	getLastMessageIdByGroupId: "SELECT max(messageId) as messageId " +
			"FROM Messages WHERE GroupId = ? %",
	
	getLastInsertMessage: "SELECT messageId, accountId as userId, groupId, " +
			"content, date, importance, location, nbread, leftGroup " +
			"FROM Messages " +
			"WHERE id = (SELECT last_insert_id()) %",
			
	getRecentMessages: "SELECT messageId, accountId as userId, groupId, " +
			"content, date, importance, location, nbread, leftGroup " +
			"FROM Messages " +
			"WHERE groupId = ? and messageId >= " +
			"(SELECT ackStart " +
			"FROM GroupMembers " +
			"WHERE groupId = ? and accountId = ?) " +
			"ORDER BY messageId desc " +
			"LIMIT ? %",

	getMessagesFromId: "SELECT * " +
			"FROM Messages " +
			"WHERE groupId = ? and messageId <= ? " +
			"and messageId >= " +
			"(SELECT ackStart " +
			"FROM GroupMembers " +
			"WHERE groupId = ? and accountId = ?) " +
			"ORDER BY messageId desc " +
			"LIMIT ? %",

	getAcksOfGroupByUser: "SELECT ackStart, ackEnd " +
			"FROM MessageAcks " +
			"WHERE groupId = ? and accountId = ? " +
			"ORDER BY ackStart %",

	getConflictingAcks: "SELECT * " +
			"FROM MessageAcks " +
			"WHERE groupId = ? and accountId = ? and " +
			"(? <= ackStart <= ? + 1 or ? - 1 <= ackEnd <= ?) " +
			"ORDER BY ackStart %",
			
	getNbOthersMessagesInRange: "SELECT count(messageId) as nbNewMessages " +
			"FROM Messages " +
			"WHERE groupId = ? and messageId >= ? and messageId <= ? and accountId != ? %",

	getEventById: "SELECT e.id as eventId, e.name, e.description, e.nbParticipantsMax, e.nbParticipants, " +
			"e.started, e.date, e.createrId, g.id as groupId " +
			"FROM Groups g RIGHT JOIN " +
			"(SELECT e.id, e.name, e.description, e.nbParticipantsMax, count(ep.accountId) as nbParticipants, " +
			"e.started, e.date, e.createrId " +
			"FROM EventParticipants ep RIGHT JOIN " +
			"Events e ON e.id = ep.eventId " +
			"WHERE e.id = ?  " +
			"GROUP BY e.id " +
			"%) e ON g.eventId = e.id %",

	getUpcomingEvents: "SELECT e.id as eventId, e.name, e.description, e.nbParticipantsMax, e.nbParticipants, " +
			"e.started, e.date, e.createrId, g.id as groupId " +
			"FROM Groups g RIGHT JOIN " +
			"(SELECT e.id, e.name, e.description, e.nbParticipantsMax, count(ep.accountId) as nbParticipants, " +
			"e.started, e.date, e.createrId " +
			"FROM EventParticipants ep RIGHT JOIN Events e " +
			"ON e.id = ep.eventId " +
			"WHERE e.started = 0 " +
			"GROUP BY e.id " +
			"ORDER BY e.date " +
			"%) e on g.eventId = e.id %",
			
	getEventListByUser: "SELECT e.id as eventId, e.name, e.description, e.nbParticipantsMax, e.nbParticipants, " +
			"e.started, e.date, e.createrId, e.acked, g.id as groupId " +
			"FROM Groups g RIGHT JOIN " +
			"(SELECT e.id, e.name, e.description, e.nbParticipantsMax, count(ep.accountId) as nbParticipants, " +
			"e.started, e.date, e.createrId, e.acked " +
			"FROM EventParticipants ep RIGHT JOIN " +
			"(SELECT e.id, e.name, e.description, e.nbParticipantsMax, e.started, e.date, " +
			"e.createrId, ep.acked " +
			"FROM EventParticipants ep INNER JOIN Events e ON e.id = ep.eventId " +
			"WHERE ep.accountId = ? " +
			"%) e ON e.id = ep.eventId " +
			"GROUP BY e.id " +
			"ORDER BY e.date " +
			"%) e on g.eventId = e.id %",

	getEventParticipantByUser: "SELECT eventId, accountId, acked, status " +
			"FROM EventParticipants " +
			"WHERE eventId = ? and accountId = ? %",
			
	getEventParticipants: "SELECT a.id as userId, a.email, a.nickname, " +
			"a.lastSeen, a.picture, a.login, p.acked " +
			"FROM Accounts a INNER JOIN " +
			"(SELECT ep.accountId, ep.status, ep.acked " +
			"FROM Events e INNER JOIN EventParticipants ep ON e.id = ep.eventId " +
			"WHERE e.id = ? " +
			"%) p ON a.id = p.accountId %",

	getEventParticipantNumber: "SELECT count(accountId) " +
			"FROM EventParticipants " +
			"WHERE eventId = ? %",
	
	getEventLocalization: "SELECT eventId, location, date " +
			"FROM Localisations " +
			"WHERE eventId = ? %",

	addUser: "INSERT INTO Accounts(email, password, login, nickname) VALUES(?)",

	addSession: "INSERT INTO Sessions(sessionId, accountId, expire) VALUES(?)",

	addContact: "INSERT INTO Contacts SET ?",

	addGroup: "INSERT INTO Groups SET ?",

	addGroupMember: "INSERT INTO GroupMembers(groupId, accountId, ackStart) " +
			"VALUES (?, IFNULL((SELECT max(messageId) + 1 FROM Messages WHERE groupId = ?), 1))",

	addMessage: "INSERT INTO Messages(groupId, messageId, accountId, importance, " +
			"content, location, date, nbread) " +
			"VALUES(?, ?, ?, ?, ?, ?, ?, ?) ",

	addMessageAck: "INSERT INTO MessageAcks SET ?",

	addEvent: "INSERT INTO Events SET ?",

	addEventParticipant: "INSERT INTO EventParticipants SET ?",
	
	addEventLocalization: "INSERT INTO Localisations SET ?",

	removeUser: "DELETE FROM Accounts WHERE email = ?",

	removeContact: "DELETE FROM Contacts " +
			"WHERE (accountId = ? and accountId2 = ? and accepted = 1) " +
			"or (accountId2 = ? and accountId = ? and accepted = 1)",

	removePendingContact: "DELETE FROM Contacts " +
			"WHERE (accountId = ? and accountId2 = ? and accepted = 0) " +
			"or (accountId2 = ? and accountId = ? and accepted = 0)",

	removeGroup: "DELETE FROM Groups WHERE id = ? ",

	removeGroupIfNoMember: "DELETE FROM Groups WHERE id = ? and not " +
			"(SELECT count(*) " +
			"FROM GroupMembers " +
			"WHERE groupId = ?) ",

	removeGroupMember: "DELETE FROM GroupMembers WHERE groupId = ? and accountId = ? ",

	removeAcksOfGroupByUser: "DELETE FROM MessageAcks " +
			"WHERE groupId = ? and accountId = ? ",

	removeConflictingAcks: "DELETE FROM MessageAcks " +
			"WHERE groupId = ? and accountId = ? and " +
			"(? <= ackStart <= ? + 1 or ? - 1 <= ackEnd <= ?) ",

	removeEvent: "DELETE FROM Events WHERE id = ? ",

	removeEventParticipant: "DELETE FROM EventParticipants WHERE eventId = ? and accountId = ? ",

	acceptPendingContact: "UPDATE Contacts SET accepted = 1 " +
			"WHERE ((accountId = ? and accountId2 = ?) or (accountId2 = ? and accountId = ?)) and " +
			"accepted = 0 ",

	updateGroupName: "UPDATE Groups SET name = ? WHERE id = ? ",

	updateContactGroupChat: "UPDATE Groups SET contactId = ? " +
			"WHERE id = ? ",
			
	updateEventGroupChat: "UPDATE Groups SET eventId = ? " +
			"WHERE id = ?",		

	updateMessageNbread: "UPDATE Messages SET nbread = nbread + (?) " +
			"WHERE groupId = ? and GREATEST(" +
			"(SELECT ackStart FROM GroupMembers WHERE groupId = ? and accountId = ?), " +
			"?) <= messageId and messageId <= ? and accountId != ? ",
			
	updateNbNewMessagesOthers: "UPDATE GroupMembers SET nbNewMessages = nbNewMessages + (?) " +
			"WHERE groupId = ? and accountId != ? ",
			
	updateNbNewMessagesByUser: "UPDATE GroupMembers SET nbNewMessages = nbNewMessages + (?) " +
			"WHERE groupId = ? and accountId = ? ",
			
	updateEventStarted: "UPDATE Events SET started = 1 " +
			"WHERE id = ? ",
			
	updateEventParticipantAck: "UPDATE EventParticipants SET acked = ? " +
			"WHERE eventId = ? and accountId = ? ",

	lastInsertId: "SELECT LAST_INSERT_ID() as lastInsertId"
};

var selectLock = function(query, data) {
	if (data.hasOwnProperty('lock') && data.lock) {
		return query.replace(new RegExp('%', 'g'), 'LOCK IN SHARE MODE');
	} else if (data.hasOwnProperty('update') && data.update) {
		return query.replace(new RegExp('%', 'g'), 'FOR UPDATE');
	} else {
		return query.replace(new RegExp('%', 'g'), '')
	}
}

// db operations
var dbPrototype = {
	release: function() {
		this.conn.release();
	},
	beginTransaction: function(callback) {
		this.conn.beginTransaction(callback);
	},
	commit: function(callback) {
		this.conn.commit(callback);
	},
	rollback: function(callback) {
		this.conn.rollback(callback);
	},
	query: function(query, args, callback) {
		this.conn.query(query, args, callback);
	},
	getUserById: function(data, callback) {
		this.conn.query(selectLock(queries.getUserById, data),
				[data.userId], callback);
	},
	getUserByEmail: function(data, callback) {
		this.conn.query(selectLock(queries.getUserByEmail, data),
				[data.email], callback);
	},
	getUserBySession: function (data, callback) {
		this.conn.query(selectLock(queries.getUserBySession, data),
				[data.sessionId], callback);
	},
	getAcceptedContactListByUser: function (data, callback) {
		this.conn.query(selectLock(queries.getAcceptedContactListByUser, data),
				[data.userId, data.userId, data.userId], callback);
	},
	getPendingContactListByUser: function (data, callback) {
		this.conn.query(selectLock(queries.getPendingContactListByUser, data),
				[data.userId, data.userId], callback);
	},
	// get info of userId2 contacted by userId
	getContact: function (data, callback) {
		this.conn.query(selectLock(queries.getContact, data),
				[data.userId, data.userId2, data.userId, data.userId2],
				callback);
	},
	// get info of userId2 contacted by userId
	getAcceptedContact: function (data, callback) {
		this.conn.query(selectLock(queries.getAcceptedContact, data),
				[data.userId, data.userId2, data.userId, data.userId2],
				callback);
	},
	getPendingContact: function (data, callback) {
		this.conn.query(selectLock(queries.getPendingContact, data),
				[data.userId, data.userId2, data.userId, data.userId2],
				callback);
	},
	getContactByGroup: function (data, callback) {
		this.conn.query(selectLock(queries.getContactByGroup, data),
				[data.groupId], callback);
	},
	getGroupById: function (data, callback) {
		this.conn.query(selectLock(queries.getGroupById, data),
				[data.groupId], callback);
	},
	getGroupOfUserById: function (data, callback) {
		this.conn.query(selectLock(queries.getGroupOfUserById, data),
				[data.groupId, data.userId], callback);
	},
	getGroupListByUser: function (data, callback) {
		this.conn.query(selectLock(queries.getGroupListByUser, data),
				[data.userId], callback);
	},
	getContactGroupListByUser: function (data, callback) {
		this.conn.query(selectLock(queries.getContactGroupListByUser, data),
				[data.userId], callback);
	},
	getAllGroupListByUser: function (data, callback) {
		this.conn.query(selectLock(queries.getAllGroupListByUser, data),
				[data.userId], callback);
	},
	getGroupMemberByUser: function (data, callback) {
		this.conn.query(selectLock(queries.getGroupMemberByUser, data),
				[data.groupId, data.userId],
				callback);
	},
	getGroupMembersByUser: function (data, callback) {
		this.conn.query(selectLock(queries.getGroupMembersByUser, data),
				[data.groupId, data.userIds],
				callback);
	},
	getGroupMembers: function (data, callback) {
		this.conn.query(selectLock(queries.getGroupMembers, data),
				[data.groupId], callback);
	},
	getGroupMemberNumber: function (data, callback) {
		this.conn.query(selectLock(queries.getGroupMemberNumber, data),
				[data.groupId], callback);
	},
	getLastMessageIdByGroupId: function (data, callback) {
		this.conn.query(selectLock(queries.getLastMessageIdByGroupId, data),
				[data.groupId], callback);
	},
	getLastInsertMessage: function (data, callback) {
		this.conn.query(selectLock(queries.getLastInsertMessage, data), callback);
	},
	getRecentMessages: function (data, callback) {
		this.conn.query(selectLock(queries.getRecentMessages, data),
				[data.groupId, data.groupId, data.userId, data.nbMessages], callback);
	},
	getMessagesFromId: function (data, callback) {
		this.conn.query(selectLock(queries.getMessagesFromId, data),
				[data.groupId, data.startFrom, data.groupId, data.userId, 
					data.nbMessages], callback);
	},
	getAcksOfGroupByUser: function (data, callback) {
		this.conn.query(selectLock(queries.getAcksOfGroupByUser, data),
				[data.groupId, data.userId], callback);
	},
	getConflictingAcks: function (data, callback) {
		this.conn.query(selectLock(queries.getConflictingAcks, data),
				[data.groupId, data.userId,
					data.ackStart, data.ackEnd, data.ackStart, data.ackEnd], callback);
	},
	getNbOthersMessagesInRange: function (data, callback) {
		this.conn.query(selectLock(queries.getNbOthersMessagesInRange, data),
				[data.groupId, data.startId, data.endId, data.userId], callback);
	},
	getEventById: function (data, callback) {
		this.conn.query(selectLock(queries.getEventById, data),
				[data.eventId], callback);
	},
	getUpcomingEvents: function (data, callback) {
		this.conn.query(selectLock(queries.getUpcomingEvents, data), callback);
	},
	getEventListByUser: function (data, callback) {
		this.conn.query(selectLock(queries.getEventListByUser, data),
				[data.userId], callback);
	},
	getEventParticipantByUser: function (data, callback) {
		this.conn.query(selectLock(queries.getEventParticipantByUser, data),
				[data.eventId, data.userId], callback);
	},
	getEventParticipants: function (data, callback) {
		this.conn.query(selectLock(queries.getEventParticipants, data),
				[data.eventId], callback);
	},
	getEventParticipantNumber: function (data, callback) {
		this.conn.query(selectLock(queries.getEventParticipantNumber, data),
				[data.eventId], callback);
	},
	getEventLocalization: function (data, callback) {
		this.conn.query(selectLock(queries.getEventLocalization, data),
				[data.eventId], callback);
	},
	addUser: function(data, callback)  {
		this.conn.query(queries.addUser,
				[[data.email, data.password, 'NO', data.nickname]], callback);
	},
	addSession: function(data, callback)  {
		this.conn.query(queries.addSession,
				[[data.sessionId, data.userId, data.expire]], callback);
	},
	addContact: function(data, callback)  {
		this.conn.query(queries.addContact,
				{accountId:data.requestUserId, accountId2:data.acceptUserId, accepted: 0}, callback);
	},
	addGroup: function(data, callback)  {
		this.conn.query(queries.addGroup,
				{name:data.name}, callback);
	},
	addGroupMember: function(data, callback)  {
		this.conn.query(queries.addGroupMember,
				[[data.groupId, data.userId], data.groupId], callback);
	},
	addMessage: function(data, callback)  {
		this.conn.query(queries.addMessage,
				[data.groupId, data.messageId, data.userId, data.importance, 
					data.content, data.location, data.date, data.nbread], callback);
	},
	addMessageAck: function(data, callback)  {
		this.conn.query(queries.addMessageAck,
				{groupId:data.groupId, accountId:data.userId,
			ackStart:data.ackStart, ackEnd:data.ackEnd}, callback);
	},
	addEvent: function(data, callback)  {
		this.conn.query(queries.addEvent,
				{name: data.name, nbParticipants:0, nbParticipantsMax:data.nbParticipantsMax,
			length:0, date:data.date, description:data.description, createrId: data.userId}, callback);
	},
	addEventParticipant: function(data, callback)  {
		this.conn.query(queries.addEventParticipant,
				{eventId:data.eventId, accountId:data.userId, status:'s'}, callback);
	},
	addEventLocalization: function(data, callback)  {
		this.conn.query(queries.addEventLocalization,
				{eventId:data.eventId, location:data.location,
			date:data.date}, callback);
	},
	removeUser: function(data, callback)  {
		this.conn.query(queries.removeUser, [data.email], callback);
	},
	removeContact: function(data, callback)  {
		this.conn.query(queries.removeContact,
				[data.userId, data.userId2, data.userId, data.userId2],
				callback);
	},
	removePendingContact: function(data, callback)  {
		this.conn.query(queries.removePendingContact,
				[data.userId, data.userId2, data.userId, data.userId2],
				callback);
	},
	removeGroup: function(data, callback)  {
		this.conn.query(queries.removeGroup, [data.groupId], callback);
	},
	removeGroupIfNoMember: function(data, callback)  {
		this.conn.query(queries.removeGroupIfNoMember, [data.groupId, data.groupId], callback);
	},
	removeGroupMember: function(data, callback)  {
		this.conn.query(queries.removeGroupMember,
				[data.groupId, data.userId], callback);
	},
	removeAcksOfGroupByUser: function(data, callback)  {
		this.conn.query(queries.removeAcksOfGroupByUser,
				[data.groupId, data.userId], callback);
	},
	removeConflictingAcks: function(data, callback)  {
		this.conn.query(queries.removeConflictingAcks,
				[data.groupId, data.userId,
					data.ackStart, data.ackEnd, data.ackStart, data.ackEnd], callback);
	},
	removeEvent: function(data, callback)  {
		this.conn.query(queries.removeEvent, [data.eventId], callback);
	},
	removeEventParticipant: function(data, callback)  {
		this.conn.query(queries.removeEventParticipant,
				[data.eventId, data.userId], callback);
	},
	acceptPendingContact: function(data, callback) {
		this.conn.query(queries.acceptPendingContact,
				[data.userId, data.userId2, data.userId, data.userId2], callback);
	},
	updateGroupName: function(data, callback) {
		this.conn.query(queries.updateGroupName,
				[data.name, data.groupId], callback);
	},
	updateContactGroupChat: function(data, callback) {
		this.conn.query(queries.updateContactGroupChat,
				[data.contactId, data.groupId], callback);
	},
	updateEventGroupChat: function(data, callback) {
		this.conn.query(queries.updateEventGroupChat,
				[data.eventId, data.groupId], callback);
	},
	incrementMessageNbread: function(data, callback) {
		this.conn.query(queries.updateMessageNbread,
				[1, data.groupId, data.groupId, data.userId, 
					data.ackStart, data.ackEnd, data.userId], callback);
	},
	decrementMessageNbread: function(data, callback) {
		this.conn.query(queries.updateMessageNbread,
				[-1, data.groupId, data.groupId, data.userId, 
					data.ackStart, data.ackEnd, data.userId], callback);
	},
	incrementNbNewMessagesOthers: function(data, callback) {
		this.conn.query(queries.updateNbNewMessagesOthers,
				[1, data.groupId, data.userId], callback);
	},
	subtractNbNewMessagesOthers: function(data, callback) {
		this.conn.query(queries.updateNbNewMessagesByUser,
				[data.nbNewMessages * -1, data.groupId, data.userId], callback);
	},
	updateEventStarted: function(data, callback) {
		this.conn.query(queries.updateEventStarted,
				[data.eventId], callback);
	},
	updateEventParticipantAck: function(data, callback) {
		this.conn.query(queries.updateEventParticipantAck,
				[data.acked, data.eventId, data.userId], callback);
	},
	lastInsertId: function(callback)  {
		this.conn.query(queries.lastInsertId, callback);
	},
};

function db() {

}
db.prototype = dbPrototype;

var getConnection = function(callback) {
	var dbInstance = new db();
	pool.getConnection(function(err, conn) {
		if (err) {
			console.log('Failed to get db connection');
			Object.defineProperty(dbInstance, 'conn',
					{value: null, configurable: false, writable: false, enumerable: false});
		} else {
			Object.defineProperty(dbInstance, 'conn',
					{value: conn, configurable: false, writable: false, enumerable: false});
		}
		callback(err, dbInstance);
	});
}

// db transaction patterns
var dbPatternProto = {
	// generic constructor

	init: function(userFuncs, userEndFunc, config) {
		// exploit basic, user functions so it can access db, data.
		this.funcSeries = [];

		if (this.basicFuncs)
			for (var i = 0; i < this.basicFuncs.length; i++) {
				this.funcSeries.push(this.applyFuncGen(this.basicFuncs[i], this));
			}

		if (userFuncs)
			for (var i = 0; i < userFuncs.length; i++) {
				this.funcSeries.push(this.applyFuncGen(userFuncs[i], this));
			}

		if (this.basicEndFunc)
			this.basicEndFunc = this.applyFuncGen(this.basicEndFunc, this);

		if (userEndFunc)
			this.userEndFunc = this.applyFuncGen(userEndFunc, this);

		// configure
		if (config) {

			// config async
			if (config.async == 'waterfall')
				this.async = async.waterfall;
			else if (config.async == 'series')
				this.async = async.series;

			// user can pass mysql db object to use
			// this case, pattern never releases db
			// otherwise, releases db
			if (config.db) {
				this.db = config.db;
				this.db.a = 111;
				this.createDB = false;
			} else
				this.createDB = true;
		} else {
			// default settings
			this.createDB = true;
		}

		// default async is waterfall
		if (!this.async)
			this.async = async.waterfall;

		this.data = {};

		return this;
	},
	applyFuncGen: function(func, pattern) {
		return function() {func.apply(pattern, arguments);}
	},
	funcSeries: null,         /* Basic, user function series */
	basicFuncs: null,
	userFuncs: null,
	userEndFunc: null,
	basicEndFunc: null,       /* Function called when trx ends */
	async: undefined,
	db: null,                 /* User function can access db by this.db */
	createDB: false,         /* Release db at the end or not */
	data: null,              /* Can use to share data across user series functions */
	run: function() {
		this.async(this.funcSeries, this.basicEndFunc);

		return this;
	},
	callUserEndFunc: function() {
		if (this.userEndFunc)
			this.userEndFunc.apply(this, arguments);
	},
	releaseDBFunc: function() {
		if (this.createDB && this.db)
			this.db.release();
	}
};

//pattern no transaction, each query regarded as single transaction
var atomicPatternGen = function() {

	var constructor = function() {

		// request connection
		var _getConnection = function(callback) {
			if (this.createDB)
				getConnection(callback);
			else
				callback(null, null);
		};

		// got connection
		var _gotConnection = function(result, callback) {
			if (result)
				this.db = result;

			callback(null);
		};

		this.basicFuncs = [_getConnection, _gotConnection];

		this.basicEndFunc = function(err, result, fields) {
			var db = this.db;

			this.releaseDBFunc();

			if (err) {
				this.callUserEndFunc(err);
			} else {
				this.callUserEndFunc(null, result, fields);
			}
		};
	};

	constructor.prototype = dbPatternProto;

	return new constructor();
};

var atomicPattern = function(userFuncs, userEndFunc, config) {
	var pattern = atomicPatternGen();
	pattern.init.apply(pattern, arguments).run();
}

// pattern with transaction start, commit when success, rollback when err
var trxPatternGen = function() {
	var basicFuncs;

	var constructor = function() {
		// got connection
		var _gotConnection = function(result, callback) {
			if (result)
				this.db = result;

			this.db.beginTransaction(callback);
		};

		var _startedTransaction = function(result, fields, callback) {
			callback(null);
		};

		this.basicFuncs = [this.basicFuncs[0],
			_gotConnection, _startedTransaction];

		this.basicEndFunc = function(err, result, fields) {
			var db = this.db;
			var createDB = this.createDB;
			var pattern = this;

			if (err) {
				// rollback and callback with error
				if (db)
					db.rollback(function() {
						pattern.releaseDBFunc();
						pattern.callUserEndFunc(err);
					});
			} else {
				// release db and success callback
				if (db) {
					db.commit(function(err) {
						if (err)
							db.rollback(function() {
								pattern.releaseDBFunc();
								pattern.callUserEndFunc(err);
							});
						else {
							pattern.releaseDBFunc();
							pattern.callUserEndFunc(null, result, fields);
						}
					});
				} else
					pattern.callUserEndFunc(null, result, fields);
			}
		};
	};

	constructor.prototype = atomicPatternGen();
	return new constructor();
};

var trxPattern = function(userFuncs, userEndFunc, config) {
	var pattern = trxPatternGen();
	pattern.init.apply(pattern, arguments).run();
}

// trxPattern2 which inherits trxPattern can be written like this
var trxPattern2Gen = function() {
	var trx1 = trxPatternGen();

	var constructor = function() {
		// do something here...
		this.basicFuncs = [/* new basic funcs */];

		this.basicEndFunc = function() {
			// new basic end func...
		};
	};

	constructor.prototype = trx1;

	return new constructor();
};

var trxPattern2 = function(userFuncs, userEndFunc, config) {
	var pattern = trxPattern2Gen();
	pattern.init.apply(pattern, arguments).run();
}

// pattern that can be configured and used as subroutine of 
// other composable or not composable patterns
var composablePattern = function(wrap) {
	// preserved attributes of data : trx, db, callback
	var ret = function(data, callback) {
		var pattern;
		
		if (data.trx)
			pattern = trxPattern;
		else
			pattern = atomicPattern;
		
		if (!callback) {
			callback = function (err) {};
		}
		
		var start = function(funcs, callbackIn) {
			// first function will set data
			funcs.unshift(function(callback) {
				this.data = data;
				this.data.callback = callback;
				
				callback(null);
			});
			
			pattern(funcs, callbackIn, {db: data.db});
		}
		
		wrap.call({data: data}, start, callback);
	}
	
	return ret;
}

module.exports = {
	getConnection: getConnection,
	atomicPattern: atomicPattern,
	trxPattern: trxPattern,
	composablePattern: composablePattern
};

// test codes
// this is how to use

if (require.main == module) {
	console.log('file: ' + __filename + '\ndir: ' + __dirname);

	test1();
	// code without async
	function test1() {
		var manager = require('./dbManager');

		//console.log('request connection');
		manager.getConnection(function(err, conn) {
			if (err)
				throw err;
			console.log('start transaction');
			conn.beginTransaction(function(err) {
				if (err) {
					conn.release();
					throw err;
				}
				//console.log(this);
				//console.log('insert an account');
				conn.addUser({email:'test@kaist.ac.kr', password:'1234567890', nickname: 'test'}, function(err, result) {
					if(err) {
						conn.rollback(function() {
							conn.release();
							throw err;
						});
					}
					//console.log('select account');
					conn.getUserByEmail({email:'test@kaist.ac.kr'}, function(err, result) {
						if(err) {
							conn.rollback(function() {
								conn.release();
								throw err;
							});
						}
						for (var i = 0; i < result.length; i++) {
							console.log('id: ' + result[i].email + '(' + typeof result[i].email + ')');
							console.log('pwd: ' + result[i].password + '(' + typeof result[i].password + ')');
						}
						//console.log('delete account');
						conn.removeUser({email:'test@kaist.ac.kr'}, function(err, result) {
							if(err) {
								conn.rollback(function() {
									conn.release();
									throw err;
								});
							}
							console.log('commit');
							conn.commit(function(err) {
								if(err) {
									conn.rollback(function() {
										conn.release();
										throw err;
									});
								}
								console.log('release connection');
								conn.release();
								setTimeout(test2, 0);
							});
						});
					});
				});
			});
		});
	}

	// code doing same thing as above, but with async
	// this is more readable and no callback nesting, easy to write
	function test2() {
		var manager = require('./dbManager');
		var async = require('async');

		var connection;
		async.waterfall([
			function(callback) {
				manager.getConnection(callback);
			},
			function(conn, callback) {
				connection = conn;
				connection.beginTransaction(callback);
			},
			function(result, fields, callback) {
				connection.addUser({email:'test@kaist.ac.kr', password:'1234567890', nickname: 'test'}, callback);
			},
			function(result, fields, callback) {
				connection.getUserByEmail({email:'test@kaist.ac.kr'}, callback);
			},
			function(result, fields, callback) {
				for (var i = 0; i < result.length; i++) {
					console.log('id: ' + result[i].email + '(' + typeof result[i].email + ')');
					console.log('pwd: ' + result[i].password + '(' + typeof result[i].password + ')');
				}
				callback(null);
			},
			function(callback) {
				connection.removeUser({email:'test@kaist.ac.kr'}, callback);
			},
			function(result, fields, callback) {
				connection.commit(callback);
			}
		],
		function(err, results) {
			if (err) {
				if (connection) {
					connection.rollback(function() {
						console.log('rolled back');
						if (connection) {
							connection.release();
						}
						process.exit();
					});
				}
				throw err;
			}
			if (connection) {
				connection.release();
			}
			test3();
		});
	}

	// using patternized db framework
	// much easier code, no duplicate routine codes
	function test3() {
		var manager = require('./dbManager');

		manager.trxPattern([
			function(callback) {
				this.db.addUser({email:'test@kaist.ac.kr', password:'1234567890', nickname: 'test'}, callback);
			},
			function(result, fields, callback) {
				this.db.getUserByEmail({email:'test@kaist.ac.kr'}, callback);
			},
			function(result, fields, callback) {
				for (var i = 0; i < result.length; i++) {
					console.log('id: ' + result[i].email + '(' + typeof result[i].email + ')');
					console.log('pwd: ' + result[i].password + '(' + typeof result[i].password + ')');
				}
				callback(null);
			},
			function(callback) {
				this.db.removeUser({email:'test@kaist.ac.kr'}, callback);
				//callback(null);
			}
		],
		function(err) {
			if (err) {
				console.log('err!');
			} else {
				console.log('success!');
			}
			test4();
		});
	}

	function test4() {
		var manager = require('./dbManager');

		manager.atomicPattern([
			function(callback) {
				this.db.getUserByEmail({email:'a030603@kaist.ac.kr'}, callback);
			},
			function(result, fields, callback) {
				for (var i = 0; i < result.length; i++) {
					console.log('id: ' + result[i].email + '(' + typeof result[i].email + ')');
					console.log('pwd: ' + result[i].password + '(' + typeof result[i].password + ')');
				}
				callback(null);
			}
		],
		function(err) {
			if (err) {
				console.log('err!');
			} else {
				console.log('success!');
			}
			process.exit();
		});
	}
}
