/* Copyright 2015, Wang Wenlin */
"use strict";

exports.Channel = Channel;
exports.go = go;
exports.bind = bind;
exports.then = then;

// Ref: http://swannodette.github.io/2013/08/24/es6-generators-and-csp/
//
// go(function* (chan) {
//   db.query('SELECT 1', chan);
//   var r1 = yield chan;
//
//   request('http://www.google.com', chan);
//   var r2 = yield;
//
//   redis.get('k1', chan);
//   redis.hget('k2', chan);
//   var rk1 = yield;
//   var rk2 = yield;
//
//   go(function* (ch2) {
//     db.query('SELECT 1', bind(ch2, 'r3'));
//     db2.query('SELECT 3', bind(ch2, 'r4'));
//     var rx = yield;
//     var ry = yield;
//     chan(null, rx[1] + ry[1]);
//   });
//
//   try {
//     var rz = yield;
//   } catch (e) {}
//
//   var ch3 = Channel();
//
//   db.query('SELECT 1 FROM dummy', then(ch3, function (res) { ch3(null, res[0]); }));
//   db2.query('SELECT 3', chan);
//   var r3 = yield ch3;
//   var r4 = yield;
// });

/**
 * Golang like channel.
 * @constructor
 * @param {Varargs} arg0 - Varargs of prequeued messages
 * @returns {Channel} - new channel
 */
function Channel(arg0) {
  var q_ = new Array(arguments.length);
  var reader_ = [];
  for (var i in arguments) q_[i] = arguments[i];

  chan.ctor_ = Channel;
  chan.read = function () { return q_.shift(); }
  chan.wait = wait;
  return chan;

  function chan(arg0) {
    var args = new Array(arguments.length);
    for (var i in arguments) args[i] = arguments[i];
    return write(args);
  }

  function write(msg) {
    q_.push(msg);
    while (reader_.length) process.nextTick(reader_.shift());
  }

  function wait(cb) {
    if (q_.length) return process.nextTick(cb);
    return reader_.push(cb);
  }
}

/**
 * Golang like go function.
 * @param {Generator} machine - main yieldable generator
 * @param {Varargs} arg0 - Varargs forward to the generator
 * @returns {Channel} - channel binds on the generator
 */
function go(machine, arg0) {
  var inst;
  var chan = Channel([]);
  var runq = chan;

  if (arguments.length <= 1) {
    inst = machine(chan);
  } else if (arguments.length <= 2) {
    inst = machine(chan, arguments[1]);
  } else {
    var l = arguments.length;
    var args = new Array(l - 1);
    for (var i = 1; i < l; i++) args[i-1] = arguments[i];
    inst = machine.apply(null, [].concat(chan, args));
  }

  (function loop() {
    for (;;) {
      var msg = runq.read();
      if (!msg) return runq.wait(loop);
      var iter = next(msg);
      if (iter.done) return;
      runq = iter.value || chan;
      if (runq.ctor_ !== Channel) runq = chan;
    }
  })();

  return chan;

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

/**
 * Bind params to channel, like Function#bind().
 * @param {Channel} channel - target channel
 * @param {Varargs} bind0 - Varargs forward to channel
 * @returns {Function(e, v)} - view of channel with binds
 */
function bind(chan, bind0) {
  var l = arguments.length;
  var binds = new Array(l - 1);
  for (var i = 1; i < l; i++) binds[i-1] = arguments[i];

  return function (err_, arg0, arg1) {
    if (err_) {
      err_.extra = (binds.length <= 1) ? binds[0] : binds;
      chan(err_);
    } else if (arguments.length <= 2) {
      chan.apply(null, [].concat(err_, binds, arg0));
    } else if (arguments.length <= 3) {
      chan.apply(null, [].concat(err_, binds, arg0, arg1));
    } else {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i-1] = arguments[i];
      chan.apply(null, [].concat(err_, binds, args));
    }
  };
}

/**
 * Wrap standalone error and success callbacks into node.js' standard callback.
 * @param {Function(e)} err - error channel or callback
 * @param {Function(v)} cb - success callback
 * @returns {Function(e, v)} - standard callback
 */
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
