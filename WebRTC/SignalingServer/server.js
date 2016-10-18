/*global console*/
var yetify = require('yetify'),
    config = require('getconfig'),
    fs = require('fs'),
    sockets = require('./sockets'),
    port = parseInt(process.env.PORT || config.server.port, 10),
    server_handler = function (req, res) {
        res.writeHead(404);
        res.end();
    },
    server = null;

// Create an http(s) server instance to that socket.io can listen to
if (config.server.secure) {
    server = require('https').Server({
        key: fs.readFileSync(config.server.key),
        cert: fs.readFileSync(config.server.cert),
        passphrase: config.server.password
    }, server_handler);
} else {
    server = require('http').Server(server_handler);
}
server.listen(port);

sockets(server, config);

if (config.uid) process.setuid(config.uid);

var httpUrl;
if (config.server.secure) {
    httpUrl = "https://143.248.177.95:" + port;
} else {
    httpUrl = "http://143.248.177.95:" + port;
}
console.log('Signaling Server (signal master) is running at: ' + httpUrl);
