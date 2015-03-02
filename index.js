/* Copyright 2015, Wang Wenlin */

exports.Channel = Channel;
exports.go = go;
exports.join = join;
exports.then = then;

// Ref: http://swannodette.github.io/2013/08/24/es6-generators-and-csp/
//
// go(function* (chan) {
//   var ch1 = Channel();
//
//   var r1 = yield db.query('SELECT 1', chan);
//   var r2 = yield request('http://www.google.com', chan);
//
//   db1.query('SELECT 1 FROM dummy', then(ch1, function (res) { ch1(null, res[0]); }));
//   db2.query('SELECT 3', chan);
//   var r3 = yield join(ch1, chan, chan);
//
//   db1.query('SELECT 1', ch1);
//   db2.query('SELECT 3', chan);
//   var r4 = yield join(ch1, chan, function (e, res) { chan(e, res[1]); });
//
//   redis.get('k1', chan);
//   redis.hget('k2', ch1);
//   var rk1 = yield;
//   var rk2 = yield ch1;
//
//   redis.get('k1', chan);
//   redis.hget('k2', chan);
//   var rk1 = yield;
//   var rk2 = yield;
// });

function Channel(arg0) {
  var q_ = new Array(arguments.length);
  var readable_ = [];
  for (var i in arguments) q_[i] = arguments[i];

  chan.ctor_ = Channel;
  chan.poll = poll;
  chan.read = function () { return q_.shift(); }
  return chan;

  function chan(arg0) {
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
  var runq = chan;

  (function loop() {
    for (;;) {
      var msg = runq.read();
      if (!msg) return runq.poll(loop);
      var iter = next(msg);
      if (iter.done) return;
      runq = iter.value || chan;
      if (runq.ctor_ !== Channel) runq = chan;
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
}

function join(chan, cb) {
  var args = new Array(arguments.length);
  for (var i in arguments) args[i] = arguments[i];

  go(function* (chan) {
    var l = args.length - 1;
    var arr = new Array(l);
    var cb = args[l];

    try {
      for (var i = 0; i < l; i++) arr[i] = yield args[i];
      cb(null, arr);
    } catch (e) {
      cb(e);
    }
  });
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
