/*
  TODO:
  install bcrypt https://www.npmjs.com/package/bcrypt
  + look for dependencies (explained in the website)
  + test of course
*/

// NOTE : this is just an idea of how it can be implemented, to understand



var bcrypt = require('bcrypt');


// parameters
const saltRounds = 10; // cost of processing the data


var registerCredentials = function(username, password) {
  var salt = bcrypt.genSaltSync(saltRounds);
  var hash = bcrypt.hashSync(passphrase, salt);

  // TODO : store the HASH only
}

var checkCredentials = function(username, password) {
  var storedHash = "HEHE"; // TODO : get the hash from the DB
  bcrypt.compare(testPhrase, hash, function(err, res) {
    if (res) {
      // passwords matched
    } else {
      // auth failed
    }
  });
}
