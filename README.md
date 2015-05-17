go.js, Golang like channels, goroutine and go.
====

```javascript
var Channel = require('gojs').Channel;
var go = require('gojs').go;
var bind = require('gojs').bind;
var then = require('gojs').then;

// Ref: http://swannodette.github.io/2013/08/24/es6-generators-and-csp/
//
go(function* (chan) {
  db.query('SELECT 1', chan);
  var r1 = yield chan;

  request('http://www.google.com', chan);
  var r2 = yield;

  redis.get('k1', chan);
  redis.hget('k2', chan);
  var rk1 = yield;
  var rk2 = yield;

  go(function* (ch2) {
    db.query('SELECT 1', bind(ch2, 'r3'));
    db2.query('SELECT 3', bind(ch2, 'r4'));
    var rx = yield;
    var ry = yield;
    chan(null, rx[1] + ry[1]);
  });

  try {
    var rz = yield;
  } catch (e) {}

  var ch3 = Channel();

  db.query('SELECT 1 FROM dummy', then(ch3, function (res) { ch3(null, res[0]); }));
  db2.query('SELECT 3', chan);
  var r3 = yield ch3;
  var r4 = yield;
});
```
