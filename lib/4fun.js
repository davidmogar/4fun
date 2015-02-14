var logger = require('./logger.js');

var RestServer = require('./rest-server.js');
var WebSocketServer = require('./websocket-server.js');

/* Create the Rest server */
var restServer = new RestServer();
restServer.start();

/* Create the WebSocket server */
var wsServer = new WebSocketServer();
wsServer.start();

/* 
 * Add a callback to the Rest server to send a notification to
 * the WebSocket server everytime a request is received.
 */
restServer.setActionCallback(wsServer.notifyClients.bind(wsServer));
wsServer.notifyClients();
