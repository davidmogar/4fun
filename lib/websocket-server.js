var config = require('config');
var logger = require('winston');
var ws = require('ws').Server;

var WebSocketServer = function() {}

WebSocketServer.prototype.start = function(callback) {
  this.wss = new ws(config.get('servers.ws.options'), function() {
  logger.info(config.get('servers.ws.messages.listening'), config.get('servers.ws.options.port'));
  });

  this.wss.on('connection', function(ws) {
    logger.debug(config.get('servers.ws.messages.onConnection'), ws.upgradeReq.connection.remoteAddress);
    clients.push(ws);

    ws.on('close', function(code, data) {
      logger.debug('Websocket disconnection from %s', ws.upgradeReq.connection.remoteAddress);
      clients.splice(clients.indexOf(ws), 1);
    });

    ws.on('error', function(error) {
      logger.error('Error on ' + ws.upgradeReq.connection.remoteAddress + '. Error message: ' + error);
      clients.splice(clients.indexOf(ws), 1);
    });
  });
}

module.exports = WebSocketServer;
