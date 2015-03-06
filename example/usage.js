/* Copyright 2015, Wang Wenlin */

var Channel = require('../').Channel;
var go = require('../').go;
var bind = require('../').bind;
var then = require('../').then;

// Ref: http://swannodette.github.io/2013/08/24/es6-generators-and-csp/
//
go(function* (chan) {
  var ch2 = Channel();

  var r1 = yield db.query('SELECT 1', chan);
  var r2 = yield request('http://www.google.com', chan);

  db1.query('SELECT 1 FROM dummy', then(ch2, function (res) { ch2(null, res[0]); }));
  db2.query('SELECT 3', chan);
  var r3 = yield ch2;
  var r4 = yield;

  go(function* (ch3) {
    db1.query('SELECT 1', bind(ch3, 'r5'));
    db2.query('SELECT 3', bind(ch3, 'r6'));
    var rx = yield;
    var ry = yield;
    chan(null, rx[1] + ry[1]);
  });

  try {
    var r5 = yield;
  } catch (e) {}

  redis.get('k1', chan);
  redis.hget('k2', chan);
  var rk1 = yield;
  var rk2 = yield;
});
