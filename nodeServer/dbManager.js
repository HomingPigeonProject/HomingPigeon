/**
 *  Interface for database access, data manipulation 
 */
var mysql = require('mysql');

var pool = mysql.createPool({
    host :'localhost',
    port : 3306,
    user : 'user',
    password : 'HomingPigeon0!',
    database:'HomingPigeon',
    connectionLimit:64,
    waitForConnections:true
});

// this is called before connection is used
pool.on('connection', function (connection) {
	connection.query('SET NAMES UTF8');
	connection.query('SET AUTOCOMMIT=1');
});

// sql queries
var queries = {
	getUserByEmail: "SELECT * FROM Accounts WHERE email = ?",
	getUserBySession: "SELECT * " +
			"FROM Accounts INNER JOIN Sessions ON Accounts.id = Sessions.accountId " +
			"where sessionId = ??",
	addUser: "INSERT INTO Accounts(email, password, login) VALUES (?)",
	deleteUser: "DELETE FROM Accounts WHERE email = ?"
};

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
	getUserByEmail: function(email, callback) {
		this.conn.query(queries.getUserByEmail, [email], callback);
	},
	getUserBySession: function () {
		
	},
	addUser: function(email, pwdHash, callback)  {
		this.conn.query(queries.addUser, [[email, pwdHash, 'NO']], callback);
	},
	deleteUser: function(email, callback)  {
		this.conn.query(queries.deleteUser, [email], callback);
	}
};

function db() {

}
db.prototype = dbPrototype;

module.exports = {
	getConnection: function(callback) {
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
		})
	}
};

// test codes
// this is how to use

// Code without async
if (require.main == module) {
	console.log('file: ' + __filename + '\ndir: ' + __dirname);
	
	var manager = require('./dbManager');
	
	console.log('request connection');
	manager.getConnection(function(err, conn) {
		if (err)
			throw err;
		console.log('start transaction');
		conn.beginTransaction(function(err) {
			if (err) {
				conn.release();
				throw err;
			}
			console.log('insert an account');
			conn.addUser('a030603@kaist.ac.kr', '1234567890', function(err, result) {
				if(err) {
					conn.rollback(function() {
						conn.release();
						throw err;
					});
				}
				console.log('select account');
				conn.getUserByEmail('a030603@kaist.ac.kr', function(err, result) {
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
					console.log('delete account');
					conn.deleteUser('a030603@kaist.ac.kr', function(err, result) {
						if(err) {
							conn.rollback(function() {
								conn.release();
								throw err;
							});
						}
						conn.commit(function(err) {
							if(err) {
								conn.rollback(function() {
									conn.release();
									throw err;
								});
							}
							console.log('release connection');
							conn.release();
						});
					});
				});
			});
		});
	});
}

// Code doing same thing as above, but with async
// this is more readable and no callback nesting, easy to write
if (require.main == module) {
	
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
			connection.addUser('a030603@kaist.ac.kr', '1234567890', callback);
		},
		function(result, fields, callback) {
			connection.getUserByEmail('a030603@kaist.ac.kr', callback);
		},
		function(result, fields, callback) {
			for (var i = 0; i < result.length; i++) {
				console.log('id: ' + result[i].email + '(' + typeof result[i].email + ')');
				console.log('pwd: ' + result[i].password + '(' + typeof result[i].password + ')');
			}
			callback(null);
		},
		function(callback) {
			connection.deleteUser('a030603@kaist.ac.kr', callback);
		},
		function(result, fields, callback) {
			connection.commit(callback);
		},
		function(result, fields, callback) {
			callback(null, 'done');
		}
	],
	function(err, results) {
		try {
			if (err) {
				if (connection) {
					connection.rollback(function() {
						console.log('rolled back');
					});
				}
				throw err;
			}
		} finally {
			if (connection) {
				connection.release();
			}
		}
		process.exit();
	});
}
