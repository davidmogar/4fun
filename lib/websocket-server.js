var config = require('config');
var logger = require('winston');
var ws = require('ws').Server;

var WebSocketServer = function() {
  this.clients = [];
}

/**
 * Starts the server using values from the config file.
 */
WebSocketServer.prototype.start = function() {
  var self = this;

  this.wss = new ws(config.get('servers.ws.options'), function() {
    logger.info(config.get('servers.ws.messages.listening'), config.get('servers.ws.options.port'));
  });

  this.wss.on('connection', function(ws) {
    logger.debug(config.get('servers.ws.messages.onConnection'), ws.upgradeReq.connection.remoteAddress);
    
    /* Store the client for future use */
    self.clients.push(ws);

    /* Remove the client from the array of clients on close */
    ws.on('close', function(code, data) {
      logger.debug(config.get('servers.ws.messages.onClose'), ws.upgradeReq.connection._peername.address);
      self.clients.splice(self.clients.indexOf(ws), 1);
    });

    /* Remove the client also if there is an error in the communication */
    ws.on('error', function(error) {
      logger.error(config.get('servers.ws.messages.onError'), ws.upgradeReq.connection.remoteAddress, error);
      self.clients.splice(self.clients.indexOf(ws), 1);
    });
  });
}

/**
 * Sends a message to all connected clients using a JSON string.
 *
 * @param {data} JSON data to be send.
 */
WebSocketServer.prototype.notifyClients = function(data) {
  this.clients.forEach(function(client) {
    client.send(JSON.stringify(data));
  });
}

module.exports = WebSocketServer;
