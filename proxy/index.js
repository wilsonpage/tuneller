'use strict';

/**
 * Dependencies
 */

var debug = require('debug')('proxy');
var through = require('through');
var net = require('net');

const TUNNEL_SERVER_PORT = 4000;

function AppTunnelProxy() {
  this.tunnels = {};
  this.setupTunnelServer();
  this.setupProxyServer();
}

AppTunnelProxy.prototype = {
  setupTunnelServer() {
    var server = net.createServer(socket => {
      debug('connect');

      // first write dicatates name
      socket.on('readable', () => {
        var data = socket.read();
        if (!data) return;
        var name = data.toString();
        this.tunnels[name] = socket;
        debug('new tunnel', name);
      });
    });

    server.listen(TUNNEL_SERVER_PORT, err => {
      console.log('tunnel server on port %d', server.address().port);
    });
  },

  setupProxyServer() {
    var server = net.createServer(socket => {
      var self = this;
      var stream = socket.pipe(through(function(data) {
        var string = data.toString();
        var match = /Host: ([^\n|^\r]+)/.exec(string);
        var host = match && match[1];
        var name = host ? host.split('.')[0] : null;
        var tunnel = self.tunnels[name];

        if (tunnel) {
          debug('tunneling to', name);
          stream
            .pipe(tunnel, { end: false })
            .pipe(socket);
        }

        return this.queue(data);
      }));
    });

    server.listen(8000, err => {
      console.log('proxy server on port %d', server.address().port);
    });
  }
};

/**
 * Exports
 */

module.exports = new AppTunnelProxy();
