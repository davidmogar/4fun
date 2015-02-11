var restify = require('restify');
var WebSocketServer = require('ws').Server;

var RESTIFY_PORT = 3000;
var WEBSOCKET_PORT = 3001;

/* Define an array to store websocket clients */
var clients = new Array();

/*
 * Restify server definition.
 *
 * We'll have a simple API to accept actions from remote users through the RESTful API.
 */
var server = restify.createServer({
  name: '4fun',
  version: '0.0.1'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

/**
 * Request a token. Must be the first call to use the other routes.
 */
server.get('/user/:name', function(req, res, next) {
  var name = req.params.name;
  var token = '1341436423';

  res.send({ name: name, token: token });

  notifyClients(token, 'connection', name);

  return next();
});

/**
 * Change movement directions. Valid parameters are 'left', 'right', 'up' and 'down'.
 * Any other direction parameter will be ignored.
 */
server.get('/user/:token/move/:direction', function(req, res, next) {
  var token = req.params.token;
  var direction = req.params.direction;

  res.send({ token: token, action: 'move', direction: direction });

  notifyClients(token, 'move', direction);
  
  return next();
});

server.post('/user/:token/say', function(req, res, next) {
  var token = req.params.token;
  var message = req.params.message;

  res.send({ token: token, action: 'say', message: message });

  notifyClients(token, 'say', message);

  return next();
});

server.get('/user/:token/stop', function(req, res, next) {
  var token = req.params.token;

  res.send({ token: token, action: 'stop' });

  notifyClients(token, 'stop');

  return next();
});

server.listen(RESTIFY_PORT, function() {
  console.log('%s listening at %s', server.name, server.url);
});

/*
 * WebSocket server definition.
 *
 * This server will be used by an admin panel where will show activity of RESTful API.
 */
var wss = new WebSocketServer({ port: WEBSOCKET_PORT });
console.log('WebSocket server listening on port %s', WEBSOCKET_PORT);

wss.on('connection', function connection(ws) {
  console.log('Websocket connection from %s', ws.upgradeReq.connection.remoteAddress);
  clients.push(ws);

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
});

function notifyClients(userToken, action, actionParameters) {
  clients.forEach(function(client) {
    client.send(userToken + '#' + action +
        ((typeof actionParameters === 'undefined')? '' : '#' + actionParameters));
  });
}
