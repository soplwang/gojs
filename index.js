/* Copyright 2015, Wang Wenlin */

exports.Channel = Channel;
exports.go = go;
exports.then = then;

// Ref: http://swannodette.github.io/2013/08/24/es6-generators-and-csp/
//
// go(function* (chan) {
//   var r1 = yield db.query('SELECT 1', chan);
//   var r2 = yield request('http://www.google.com', chan);
//
//   var c1 = Channel();
//   var c2 = Channel();
//   var r3, r4;
//
//   db1.query('SELECT 1 FROM dummy', then(c1, function (res) { c1(null, res[0]); }));
//   db2.query('SELECT 3', c2);
//   r3 = yield c1;
//   r4 = yield c2;
//
//   redis.get('k1', chan);
//   redis.hget('k2', chan);
//   var rk1 = yield;
//   var rk2 = yield;
// });

function Channel(args) {
  var q_ = new Array(arguments.length);
  var readable_ = [];
  for (var i in arguments) q_[i] = arguments[i];

  chan.write = write;
  chan.poll = poll;
  chan.read = function () { return q_.shift(); }
  chan.ctor_ = Channel;
  return chan;

  function chan(args) {
    var args = new Array(arguments.length);
    for (var i in arguments) args[i] = arguments[i];
    return write(args);
  }

  function write(msg) {
    q_.push(msg);
    while (readable_.length) process.nextTick(readable_.shift());
  }

  function poll(cb) {
    if (q_.length) return cb();
    return readable_.push(cb);
  }
}

function go(machine) {
  var chan = Channel([]);
  var inst = machine(chan);

  (function loop() {
    for (;;) {
      var msg = chan.read();
      if (!msg) return chan.poll(loop);
      var iter = next(msg);
      if (iter.done) return;
      var res = iter.value;
      if (res && res.ctor_ === Channel) repl(res);
    }
  })();

  function next(msg) {
    if (msg[0]) {
      return inst.throw(msg[0]);
    } else if (msg.length <= 2) {
      return inst.next(msg[1]);
    } else {
      return inst.next(msg.slice(1));
    }
  }

  function repl(chan_) {
    chan_.poll(function () {
      var msg = chan_.read();
      return msg ? chan.write(msg) : repl(chan_);
    });
  }
}

function then(err, cb) {
  return function (err_, arg0, arg1) {
    if (err_) {
      err(err_);
    } else if (arguments.length <= 2) {
      cb(arg0);
    } else if (arguments.length <= 3) {
      cb(arg0, arg1);
    } else {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i-1] = arguments[i];
      cb.apply(null, args);
    }
  };
}
