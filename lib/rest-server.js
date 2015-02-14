var config = require('config');
var logger = require('winston');
var randtoken = require('rand-token');
var restify = require('restify');

var RestServer = function() {
  this.server = restify.createServer();

  this.server.use(restify.acceptParser(this.server.acceptable));
  this.server.use(restify.queryParser());
  this.server.use(restify.bodyParser());

  /* Enable cross-origin */
  this.server.use(restify.CORS());
  this.server.use(restify.fullResponse());

  /**
   * Request a token. Must be the first call to use the other routes.
   */
  this.server.get('/user/:name', function(req, res, next) {
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
  this.server.get('/user/:token/move/:direction', function(req, res, next) {
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

  this.server.post('/user/:token/say', function(req, res, next) {
    var token = req.params.token;
    var message = req.params.message;

    return managedTokenValidation(req, res, next, function() {
      res.send({ token: token, action: 'say', message: message });
      notifyClients(token, 'say', message);
    });
  });

  this.server.get('/user/:token/stop', function(req, res, next) {
    var token = req.params.token;

    return managedTokenValidation(req, res, next, function() {
      res.send({ token: token, action: 'stop' });
      notifyClients(token, 'stop');
    });
  });
}

RestServer.prototype.start = function() {
  var port = config.get('servers.rest.port');

  this.server.listen(port, function() {
    logger.info(config.get('servers.rest.messages.listening'), port);
  });
}

module.exports = RestServer;
