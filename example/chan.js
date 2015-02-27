var Channel = require('../').Channel;
var go = require('../').go;
var then = require('../').then;

go(function* (chan) {
  var r1 = yield db.query('SELECT 1', chan);
  var r2 = yield request('http://www.google.com', chan);

  var c1 = Channel();
  var c2 = Channel();
  var r3, r4;

  db1.query('SELECT 1 FROM dummy', then(c1, function (res) { c1(null, res[0]); }));
  db2.query('SELECT 3', c2);
  r3 = yield c1;
  r4 = yield c2;

  redis.get('k1', chan);
  redis.hget('k2', chan);
  var rk1 = yield;
  var rk2 = yield;
});
