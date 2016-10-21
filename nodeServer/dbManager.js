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
	conn: null,
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
				dbInstance = null;
			} else {
				dbInstance.conn = conn;
			}
			callback(err, dbInstance);
		})
	}
};

// test codes
// this is how to use
if (require.main == module) {
	console.log('file: ' + __filename + '\ndir: ' + __dirname);
	
	var manager = require('./dbManager');
	var async = require('async');
	async.waterfall([
	    function(callback) {
	        callback(null, 'one', 'two');
	    },
	    function(arg1, arg2, callback) {
	        // arg1 now equals 'one' and arg2 now equals 'two'
	        callback(null, 'three');
	    },
	    function(arg1, callback) {
	        // arg1 now equals 'three'
	        callback(null, 'done');
	    }
	], function (err, result) {
	    // result now equals 'done'
	});
	var connection;
	async.waterfall([
		function(callback) {
			console.log('request connection');
			manager.getConnection(callback);
		},
		function(conn, callback) {
			console.log('got connection');
			connection = conn;
			console.log('start transaction');
			connection.beginTransaction(callback);
		},
		function(result, fields, callback) {
			console.log('insert an account');
			connection.addUser('a030603@kaist.ac.kr', '1234567890', callback);
		},
		function(result, fields, callback) {
			console.log('select account');
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
			console.log('delete account');
			connection.deleteUser('a030603@kaist.ac.kr', callback);
		},
		function(result, fields, callback) {
			console.log('commit');
			connection.commit(callback);
		},
		function(result, fields, callback) {
			callback(null, 'done');
		}
	],
	function(err, results) {
		try {
			if (err) {
				console.log('abort');
				if (connection) {
					connection.rollback(function() {
						console.log('rolled back');
					});
				}
				throw err;
			}
		} finally {
			if (connection) {
				console.log('release connection');
				connection.release();
				connection = null;
			}
		}
		process.exit();
	});
}
