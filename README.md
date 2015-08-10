go.js, Golang like channels, goroutine and go.
====

```javascript
var Channel = require('gojs').Channel;
var go = require('gojs').go;
var bind = require('gojs').bind;
var then = require('gojs').then;

require('gojs').patchPromise();

// Ref: http://swannodette.github.io/2013/08/24/es6-generators-and-csp/
//
go(function* (ch) {
  db.query('SELECT 1', ch);
  var rows = yield ch;

  request('http://www.google.com', ch);
  var [resp, body] = yield;

  redis.hget('k1', ch);
  redis.get('k2', ch);
  var rk1 = yield;
  var rk2 = yield;

  db.queryPromise('SELECT 1').then(print).done(ch);
  var rp = yield ch;

  go(function* (ch2) {
    db.query('SELECT 1', bind(ch2, 'r3'));
    db2.query('SELECT 3', bind(ch2, 'r4'));
    var rx = yield;
    var ry = yield;
    ch(null, rx[1] + ry[1]);
  });

  try {
    var rz = yield ch;
    console.log(rz);
  } catch (e) {}

  var ch3 = Channel();
  db.query('SELECT 1 FROM dummy', then(ch3, function (res) { ch3(null, res[0]); }));
  db2.query('SELECT 3', ch);

  var r3 = yield ch3;
  var r4 = yield;
  console.log(r3, r4);
});
```
