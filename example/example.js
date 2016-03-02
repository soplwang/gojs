/* Copyright 2015, Wang Wenlin */
"use strict";

var Channel = require('../').Channel;
var go = require('../').go;
var bind = require('../').bind;
var then = require('../').then;
var read = require('../').read;

// Ref: http://swannodette.github.io/2013/08/24/es6-generators-and-csp/
//
go(function* (ch) {
  // Basic
  db.query('SELECT 1', ch);
  var rs = yield;

  // Waterfall
  s3.fetch('foo/bar!full', 'in_memory', ch);
  s3.convert('-resize 50%', yield, ch);
  s3.put('foo/bar!thumb', yield, ch);
  yield;

  // Pipeline
  redis.hget('k1', ch);
  redis.get('k2', ch);
  var rk1 = yield;
  var rk2 = yield;

  // Destructuring
  request('http://www.google.com', ch);
  var [resp, body] = yield;

  // Promise
  read(db.queryPromise('SELECT 1').then(print), ch);
  var rp = yield;

  // Nest w/ Parallel
  var self = this;

  try {
    yield go(function* () {
      db1.query('SELECT 1', bind(this, 'q1'));
      db2.query('SELECT 3', bind(this, 'q2'));
      var [id, rx] = yield;
      var [id, ry] = yield;
      self(null, rx + ry);
    });

  } catch (e) {}

  // w/ Channel
  var ch2 = Channel();

  db1.query('SELECT 1 FROM dummy', then(ch, res => ch(null, res[0])));
  db2.query('SELECT 3', this);
  yield;
  yield read(ch2, this);
});
