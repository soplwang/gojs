/* Copyright 2015, Wang Wenlin */
"use strict";

var Channel = require('../').Channel;
var go = require('../').go;
var bind = require('../').bind;
var then = require('../').then;

// Ref: http://swannodette.github.io/2013/08/24/es6-generators-and-csp/
//
go(function* (ch) {
  s3.fetch('foo/bar!full', 'inmemory', ch);
  s3.convert('-resize 50%', yield, ch);
  s3.put('foo/bar!thumb', yield, ch);
  var r1 = yield ch;

  db.query('SELECT 1', ch);
  var r2 = yield ch;

  request('http://www.google.com', ch);
  var [resp, body] = yield ch;

  redis.hget('k1', ch);
  redis.get('k2', ch);
  var rk1 = yield;
  var rk2 = yield;

  go(function* (ch2) {
    db.query('SELECT 1', bind(ch2, 'q1'));
    db2.query('SELECT 3', bind(ch2, 'q2'));
    var [id, rx] = yield;
    var [id, ry] = yield;
    ch(null, rx + ry);
  });

  try {
    var rz = yield ch;
  } catch (e) {}

  // Channel
  var ch3 = Channel();

  db.query('SELECT 1 FROM dummy', then(ch, function (res) { ch(null, res[0]); }));
  db2.query('SELECT 3', ch3);
  var r3 = yield;
  var r4 = yield ch3;

  // ES6 Promise
  var prms = db.queryPromise('SELECT 1').then(print);
  var rp = yield prms;
  var rp2 = yield prms;
  var rp3 = yield ES.readFilePromise('/etc/hosts');
});
