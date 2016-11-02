var Memcached = require('memcached');
var PHPUnserialize = require('php-unserialize');

var mem = new Memcached('127.0.0.1:11211'); // connect to local memcached
var key = process.argv[2]; // get from CLI arg

console.log("Looking for logged in user with key ;", key);
mem.get(key,function(err,data) { // fetch by key
        if ( err ) return console.error(err); // if there was an error
        if ( data === false ) return console.error('could not retrieve data'); // data is boolean false when the key does not exist
        if (typeof data !== 'undefined' && data) {
          console.log('found, value :',data); // show raw data
          //var o = PHPUnserialize.unserializeSession(data); // decode session data
          //console.log('parsed obj:',o); // show unserialized object
        } else {
          console.log('not found');
        }
});
