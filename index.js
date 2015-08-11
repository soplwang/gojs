/* Copyright 2015, Wang Wenlin */
"use strict";

exports.Channel = Channel;
exports.go = go;
exports.bind = bind;
exports.then = then;

// Ref: http://swannodette.github.io/2013/08/24/es6-generators-and-csp/
//

/**
 * Golang like channel.
 * @constructor
 * @param {Varargs} arg - Varargs of prequeued messages
 * @returns {Channel} - new channel
 */
function Channel(arg) {
  var l = arguments.length;
  var q_ = new Array(l);
  var waitq_ = [];
  for (var i = 0; i < l; i++) q_[i] = arguments[i];

  function chan(arg) {
    var l = arguments.length;
    var args = new Array(l);
    for (var i = 0; i < l; i++) args[i] = arguments[i];
    return write(args);
  }

  chan.ctor_ = Channel;
  chan.read = function () { return q_.shift(); }
  chan.wait = wait;
  return chan;

  function write(msg) {
    q_.push(msg);
    while (waitq_.length) process.nextTick(waitq_.shift());
  }

  function wait(cb) {
    if (q_.length) return process.nextTick(cb);
    waitq_.push(cb);
  }
}

/**
 * Golang like go function.
 * @param {Generator} goroutine - resumable goroutine
 * @param {Varargs} arg - Varargs forward to the goroutine
 * @returns {Channel} - channel binds on the goroutine
 */
function go(goroutine, arg) {
  var inst;
  var chan = Channel([]);
  var promiseChan;
  var runq = chan;

  if (arguments.length <= 1) {
    inst = goroutine(chan);
  } else if (arguments.length <= 2) {
    inst = goroutine(chan, arg);
  } else {
    var l = arguments.length;
    var args = new Array(l-1);
    for (var i = 1; i < l; i++) args[i-1] = arguments[i];
    inst = goroutine.apply(null, [].concat(chan, args));
  }

  (function loop() {
    for (;;) {
      var msg = runq.read();
      if (!msg) return runq.wait(loop);
      var iter = next(msg);
      if (iter.done) return;
      runq = iter.value || chan;
      if (runq.ctor_ !== Channel) fix();
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

  function fix() {
    if (typeof runq.then !== 'function') {
      runq = chan;
    } else {
      if (!promiseChan) promiseChan = Channel();
      runq.then(function (val) { promiseChan(null, val); }, promiseChan);
      runq = promiseChan;
    }
  }
}

/**
 * Bind params to channel, like Function#bind().
 * @param {Channel} channel - target channel
 * @param {Varargs} arg - Varargs binds on channel
 * @returns {Function(e, v)} - view of channel with binds
 */
function bind(chan, arg) {
  var l = arguments.length;
  var binds = new Array(l-1);
  for (var i = 1; i < l; i++) binds[i-1] = arguments[i];

  return function (err_, arg, arg2) {
    if (err_) {
      err_.extra = (binds.length <= 1) ? binds[0] : binds;
      chan(err_);
    } else if (arguments.length <= 2) {
      chan.apply(null, [].concat(err_, binds, arg));
    } else if (arguments.length <= 3) {
      chan.apply(null, [].concat(err_, binds, arg, arg2));
    } else {
      var l = arguments.length;
      var args = new Array(l-1);
      for (var i = 1; i < l; i++) args[i-1] = arguments[i];
      chan.apply(null, [].concat(err_, binds, args));
    }
  };
}

/**
 * Wrap standalone error and success callbacks into node.js style callback.
 * @param {Function(e)} err - error channel or callback
 * @param {Function(v)} cb - success callback
 * @returns {Function(e, v)} - node.js style callback
 */
function then(err, cb) {
  return function (err_, arg, arg2) {
    if (err_) {
      err(err_);
    } else if (arguments.length <= 2) {
      cb(arg);
    } else if (arguments.length <= 3) {
      cb(arg, arg2);
    } else {
      var l = arguments.length;
      var args = new Array(l-1);
      for (var i = 1; i < l; i++) args[i-1] = arguments[i];
      cb.apply(null, args);
    }
  };
}
