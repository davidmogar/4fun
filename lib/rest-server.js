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

    var data = { action: 'connect', name: name, token: token, expiresIn: 3600};
    res.send(data);
    self.callback(data);

    return next();
  });

  /**
   * Changes movement direction. Valid parameters are 'left', 'right', 'up' and 'down'.
   * Any other direction parameter will be ignored.
   */
  this.server.get('/user/:token/move/:direction', function(req, res, next) {
    var token = req.params.token;
    var direction = req.params.direction;

    return self.managedTokenValidation(req, res, next, function() {
      if (isValidDirection(direction)) {
        var data = { token: token, action: 'move', direction: direction };
        res.send(data);
        self.callback(data);
      } else {
        res.send(400, { token: token, error: config.get("messages.invalidDirection") });
      }
    });
  });

  /**
   * Sends a message that will be displayed on the chat panel.
   */
  this.server.post('/user/:token/say', function(req, res, next) {
    var token = req.params.token;
    var message = req.params.message;

    return self.managedTokenValidation(req, res, next, function() {
      var data = { token: token, action: 'say', message: message };
      res.send(data);
      self.callback(data);
    });
  });

  /**
   * Stops the player movement.
   */
  this.server.get('/user/:token/stop', function(req, res, next) {
    var token = req.params.token;

    return self.managedTokenValidation(req, res, next, function() {
      var data = { token: token, action: 'stop' };
      res.send(data);
      self.callback(data);
    });
  });
}

/**
 * Sets an action callback that will be executed every time a
 * new request is received.
 *
 * @param {callback} callback to be executed on request.
 */
RestServer.prototype.setActionCallback = function(callback) {
  this.callback = callback;
}

/**
 * Starts the server using values from the config file.
 */
RestServer.prototype.start = function() {
  var port = config.get('servers.rest.port');

  this.server.listen(port, function() {
    logger.info(config.get('servers.rest.messages.listening'), port);
  });
}

/**
 * If exists, remove the token received from the array of tokens.
 *
 * @param {token} token to be removed.
 */
RestServer.prototype.removeToken = function(token) {
  var index = tokens.indexOf(token);

  if (index != -1) {
    tokens.splice(index, 1);
  }
}

/**
 * Checks if a given token is valid (stored and active).
 *
 * @param {token} the token to be checked.
 * @return wheter the received token is valid or not.
 */
RestServer.prototype.isValidToken = function(token) {
  return this.tokens.indexOf(token) != -1;
}

/**
 * Performs token validation, returning a message error if not valid or
 * executing a callback otherwise.
 *
 * @param {res} restify response.
 * @param {req} restify request.
 * @param {next} restify next.
 * @param {callback} callback to be executed on success.
 * @return result of next() execution.
 */
RestServer.prototype.managedTokenValidation = function(req, res, next, callback) {
  var token = req.params.token;

  if (this.isValidToken(token)) {
    callback();
  } else {
    res.send(400, { token: token, error: config.get("messages.invalidToken") });
  }

  return next();
}

module.exports = RestServer;

/**
 * Checks if a given direction value is valid.
 *
 * @param {direction} the direction value to be checked.
 * @return whether the received direction is valid or not.
 */
function isValidDirection(direction) {
  return ['down', 'left', 'right', 'up'].indexOf(direction) != -1;
}
