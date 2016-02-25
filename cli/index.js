#! /usr/bin/env node
'use strict';

/**
 * Dependencies
 */

var debug = require('debug')('tunneller');
var Emitter = require('events');
var net = require('net');

const TUNNEL_CONFIG = {
  port: 4000,
  host: '127.0.0.1'
};

/**
 * Exports
 */

module.exports = Tunneller;

/**
 * Extends `Emitter`
 */

Tunneller.prototype = Object.create(Emitter.prototype);

function Tunneller(options) {
  Emitter.call(this);
  this.name = options.name;
  this.appPort = options.port;

  this.sockets = {
    tunnel: new net.Socket({ allowHalfOpen: true }),
    app: new net.Socket({ allowHalfOpen: true })
  };

  // always keep sockets open
  this.sockets.tunnel.on('close', () => {
    debug('tunnel socket closed');
    setTimeout(() => this.connectTunnel(), 500);
  });

  this.sockets.app.on('close', () => {
    debug('app socket closed');
    setTimeout(() => this.connectApp(), 500);
  });

  // init
  this.connect();
}

Tunneller.prototype.connect = function() {
  this.connectApp().then(() => this.connectTunnel());
};

Tunneller.prototype.connectApp = function() {
  return new Promise(resolve => {
    this.sockets.app.connect(this.appPort, () => {
      var socket = this.sockets.app;
      var host = socket.remoteAddress;
      var port = socket.remotePort;

      socket.setKeepAlive(true);
      debug('app connected (%s:%d)', host, port);
      this.emit('connected:app', host, port);
      resolve();
    });
  });
};

Tunneller.prototype.connectTunnel = function() {
  return new Promise(resolve => {
    this.sockets.tunnel.connect(TUNNEL_CONFIG, () => {
      var socket = this.sockets.tunnel;
      var host = socket.remoteAddress;
      var port = socket.remotePort;

      socket.setKeepAlive(true);
      socket.write(this.name);
      socket
        .pipe(this.sockets.app, { end: false })
        .pipe(this.sockets.tunnel);

      debug('tunnel connected (%s:%d)', host, port);
      this.emit('connected:tunnel', host, port);
      resolve();
    });
  });
};
