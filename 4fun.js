var randtoken = require('rand-token');
var restify = require('restify');
var WebSocketServer = require('ws').Server;
var RESTIFY_PORT = 3000;
var WEBSOCKET_PORT = 3001;

var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({ timestamp:true })
    ]
});

logger.info('hola');
/* Define an array to store websocket clients and users tokens */
var clients = new Array();
var tokens = new Array();

/*
 * Restify server definition.
 *
 * We'll have a simple API to accept actions from remote users through the RESTful API.
 */
var restServer = restify.createServer({
  name: '4fun',
  version: '0.0.1'
});

restServer.use(restify.acceptParser(restServer.acceptable));
restServer.use(restify.queryParser());
restServer.use(restify.bodyParser());

/* Enable cross-origin */
restServer.use(restify.CORS());
restServer.use(restify.fullResponse());

/**
 * Request a token. Must be the first call to use the other routes.
 */
restServer.get('/user/:name', function(req, res, next) {
  var name = req.params.name;
  var token = randtoken.generate(32); /* Generate a new token */

  /* Save user token */
  tokens.push(token);

  /* Set timeout for the token. Will be valid for 3600 seconds */
  setTimeout(function() {
    removeToken(token);
  }, 3600000);

  res.send({ name: name, token: token, expiresIn: 3600});

  notifyClients(token, 'connect', name);

  return next();
});

/**
 * Change movement directions. Valid parameters are 'left', 'right', 'up' and 'down'.
 * Any other direction parameter will be ignored.
 */
restServer.get('/user/:token/move/:direction', function(req, res, next) {
  var token = req.params.token;
  var direction = req.params.direction;

  return managedTokenValidation(req, res, next, function() {
    if (isValidDirection(direction)) {
      res.send({ token: token, action: 'move', direction: direction });
      notifyClients(token, 'move', direction);
    } else {
      res.send({ token: token, error: "That is not a valid direction. Directions supported: 'down', 'left', 'right', 'up'" });
    }
  });
});

restServer.post('/user/:token/say', function(req, res, next) {
  var token = req.params.token;
  var message = req.params.message;

  return managedTokenValidation(req, res, next, function() {
    res.send({ token: token, action: 'say', message: message });
    notifyClients(token, 'say', message);
  });
});

restServer.get('/user/:token/stop', function(req, res, next) {
  var token = req.params.token;

  return managedTokenValidation(req, res, next, function() {
    res.send({ token: token, action: 'stop' });
    notifyClients(token, 'stop');
  });
});

restServer.listen(RESTIFY_PORT, function() {
  console.log('%s listening at %s', restServer.name, restServer.url);
});

/*
 * WebSocket server definition.
 *
 * This server will be used by an admin panel where will show activity of RESTful API.
 */
var wss = new WebSocketServer({ port: WEBSOCKET_PORT });
console.log('WebSocket server listening on port %s', WEBSOCKET_PORT);

wss.on('connection', function(ws) {
  console.log('Websocket connection from %s', ws.upgradeReq.connection.remoteAddress);
  clients.push(ws);

  ws.on('close', function(code, data) {
    console.log('Websocket disconnection from %s', ws.upgradeReq.connection.remoteAddress);
    clients.splice(clients.indexOf(ws), 1);
  });

  ws.on('error', function(error) {
    console.log('Error on ' + ws.upgradeReq.connection.remoteAddress + '. Error message: ' + error);
    clients.splice(clients.indexOf(ws), 1);
  });
});

function notifyClients(userToken, action, actionParameters) {
  clients.forEach(function(client) {
    client.send(userToken + '#' + action +
        ((typeof actionParameters === 'undefined')? '' : '#' + actionParameters));
  });
}

function isValidDirection(direction) {
  return ['down', 'left', 'right', 'up'].indexOf(direction) != -1;
}

function isValidToken(token) {
  return tokens.indexOf(token) != -1;
}

function managedTokenValidation(req, res, next, callback) {
  var token = req.params.token;

  if (isValidToken) {
    callback();
  } else {
    res.send({ token: token, error: "Token is invalid or have expired" });
  }

  return next();
}

function removeToken(token) {
  var index = tokens.indexOf(token);

  if (index != -1) {
    tokens.splice(index, 1);
  }
}
