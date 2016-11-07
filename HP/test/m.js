var Memcached = require('memcached');
var PHPUnserialize = require('php-unserialize');

var mem = new Memcached('127.0.0.1:11211'); // connect to local memcached
var key = process.argv[2]; // get from CLI arg // will be sessionId

console.log('fetching data with key:',key);
mem.get(key,function(err,data) { // fetch by key
        if ( err ) return console.error(err); // if there was an error
        if ( data === false ) return console.error('could not retrieve data'); // data is boolean false when the key does not exist
        console.log('raw data:',data); // show raw data
        var o = PHPUnserialize.unserializeSession(data); // decode session data
        console.log('parsed obj:',o); // show unserialized object
});
