/*
  TODO:
  install bcrypt https://www.npmjs.com/package/bcrypt
  + look for dependencies (explained in the website)
  + test of course
*/

const readline = require('readline');
var bcrypt = require('bcrypt');




const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// parameters
const saltRounds = 10;


var i1 = function() {
  rl.question("Phrase code to scrypt : ", (passphrase) => {

    var salt = bcrypt.genSaltSync(saltRounds);
    var hash = bcrypt.hashSync(passphrase, salt);

    console.log("Result : \n" + hash + "\n");

    rl.question("Phrase to test : ", (testPhrase) => {
      bcrypt.compare(testPhrase, hash, function(err, res) {
        console.log(res);
      });
      rl.close();
    });

  });
}


i1();
