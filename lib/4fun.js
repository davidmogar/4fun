var logger = require('./logger.js');

var RestServer = require('./rest-server.js');
var WebSocketServer = require('./websocket-server.js');

/* Define a custom logger */

var restServer = new RestServer();
restServer.start();

var wsServer = new WebSocketServer();
wsServer.start();
