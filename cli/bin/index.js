#! /usr/bin/env node
'use strict';

/**
 * Dependencies
 */

var minimist = require('minimist');
var Tunneller = require('..');

var args = minimist(process.argv.slice(2));
var port = args._[0];
var name = args.name;

if (!port) return console.log('`port` required');
if (!name) return console.log('`--name` required');

var tunneller = new Tunneller({
  port: port,
  name: name
});

tunneller.on('connected:app', (host, port) => {
  console.log('app connected (%s:%d)', host, port);
});

tunneller.on('connected:tunnel', (host, port) => {
  console.log('tunnel connected (%s:%d)', host, port);
});
