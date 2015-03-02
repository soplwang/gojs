var Channel = require('../').Channel;
var go = require('../').go;
var join = require('../').join;
var then = require('../').then;

// Ref: http://swannodette.github.io/2013/08/24/es6-generators-and-csp/
//
go(function* (chan) {
  var ch1 = Channel();

  var r1 = yield db.query('SELECT 1', chan);
  var r2 = yield request('http://www.google.com', chan);

  db1.query('SELECT 1 FROM dummy', then(ch1, function (res) { ch1(null, res[0]); }));
  db2.query('SELECT 3', chan);
  var r3 = yield join(ch1, chan, chan);

  db1.query('SELECT 1', ch1);
  db2.query('SELECT 3', chan);
  var r4 = yield join(ch1, chan, function (e, res) { chan(e, res[1]); });

  redis.get('k1', chan);
  redis.hget('k2', ch1);
  var rk1 = yield;
  var rk2 = yield ch1;

  redis.get('k1', chan);
  redis.hget('k2', chan);
  var rk1 = yield;
  var rk2 = yield;
});
