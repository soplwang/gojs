go.js, Golang like channels and go.
====

```javascript
// Ref: http://swannodette.github.io/2013/08/24/es6-generators-and-csp/
//
go(function* (chan) {
  var ch1 = Channel();
  var ch2 = Channel();

  var r1 = yield db.query('SELECT 1', chan);
  var r2 = yield request('http://www.google.com', chan);

  db1.query('SELECT 1 FROM dummy', then(ch1, function (res) { ch1(null, res[0]); }));
  db2.query('SELECT 3', chan);
  var r3 = yield ch1;
  var r4 = yield;

  go(function* (ch3) {
    db1.query('SELECT 1', ch1);
    db2.query('SELECT 3', ch3);
    var r5 = yield ch1;
    var r6 = yield;
    chan(null, r5[0] + r6[0]);
  });
  yield;

  redis.get('k1', chan);
  redis.hget('k2', chan);
  var rk1 = yield;
  var rk2 = yield;
});
```