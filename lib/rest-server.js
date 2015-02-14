var config = require('config');
var logger = require('winston');
var randtoken = require('rand-token');
var restify = require('restify');

var RestServer = function(callback) {
  this.tokens = [];

  this.server = restify.createServer();

  this.server.use(restify.acceptParser(this.server.acceptable));
  this.server.use(restify.queryParser());
  this.server.use(restify.bodyParser());

  /* Enable cross-origin */
  this.server.use(restify.CORS());
  this.server.use(restify.fullResponse());

  this.createRoutes();
}

RestServer.prototype.createRoutes = function() {
  var self = this;

  /**
   * Request a token. Must be the first call to use the other routes.
   */
  this.server.get('/user/:name', function(req, res, next) {
    var name = req.params.name;
    var token = randtoken.generate(32); /* Generate a new token */

    /* Save user token */
    self.tokens.push(token);

    /* Set timeout for the token. Will be valid for 3600 seconds */
    setTimeout(function() { self.removeToken(token); }, 3600000);

    var answer = { action: 'connect', name: name, token: token, expiresIn: 3600};
    res.send(answer);
    self.callback(answer);

    return next();
  });

  /**
   * Change movement directions. Valid parameters are 'left', 'right', 'up' and 'down'.
   * Any other direction parameter will be ignored.
   */
  this.server.get('/user/:token/move/:direction', function(req, res, next) {
    var token = req.params.token;
    var direction = req.params.direction;

    return managedTokenValidation(req, res, next, function() {
      if (isValidDirection(direction)) {
        var answer = { token: token, action: 'move', direction: direction };
        res.send(answer);
        self.callback(answer);
      } else {
        res.send({ token: token, error: "That is not a valid direction. Directions supported: 'down', 'left', 'right', 'up'" });
      }
    });
  });

  this.server.post('/user/:token/say', function(req, res, next) {
    var token = req.params.token;
    var message = req.params.message;

    return managedTokenValidation(req, res, next, function() {
      var answer = { token: token, action: 'say', message: message };
      res.send(answer);
      self.callback(answer);
    });
  });

  this.server.get('/user/:token/stop', function(req, res, next) {
    var token = req.params.token;

    return managedTokenValidation(req, res, next, function() {
      var answer = { token: token, action: 'stop' };
      res.send(answer);
      self.callback(answer);
    });
  });
}

RestServer.prototype.setActionCallback = function(callback) {
  this.callback = callback;
}

RestServer.prototype.start = function() {
  var port = config.get('servers.rest.port');

  this.server.listen(port, function() {
    logger.info(config.get('servers.rest.messages.listening'), port);
  });
}

RestServer.prototype.removeToken = function(token) {
  var index = tokens.indexOf(token);

  if (index != -1) {
    tokens.splice(index, 1);
  }
}

module.exports = RestServer;

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
