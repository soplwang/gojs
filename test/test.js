/* Copyright 2015, Wang Wenlin */
"use strict";

var assert = require('assert');
var util = require('util');
//
var Channel = require('../').Channel;
var go = require('../').go;
var bind = require('../').bind;
var then = require('../').then;

describe('go.js', function () {
  describe('Channel', function () {
    it('can write message and read', function () {
      var chan = Channel();
      chan(null, 1);

      var msg = chan.read();
      assert.equal(msg[1], 1);
      assert(!chan.read());
    });

    it('can write message and wait to read', function (done) {
      var chan = Channel();
      chan(null, 1);

      chan.wait(function () {
        var msg = chan.read();
        assert.equal(msg[1], 1);
        assert(!chan.read());
        return done();
      });
    });

    it('can wait to read and write message later', function (done) {
      var chan = Channel();

      chan.wait(function () {
        var msg = chan.read();
        assert.equal(msg[1], 1);
        assert(!chan.read());
        return done();
      });
      chan(null, 1);
    });
  });

  describe('go()', function () {
    it('only support generator as goroutine', function () {
      go(function* () {});
      assert.throws(function () { go(function () {}); });
    });

    it('addition args for goroutine', function (done) {
      function* mm(chan, done) { done(); }
      go(mm, done);
    });

    it('yield from default chan', function (done) {
      go(function* (chan) {
        process.nextTick(function () { chan(null, 1); });
        assert.equal((yield), 1);
        return done();
      });
    });

    it('yield from default chan with multiple args', function (done) {
      go(function* (chan) {
        process.nextTick(function () { chan(null, 1, 2); });
        var res = yield;
        assert(Array.isArray(res), 'multi-args message should be an array');
        assert(res[0] === 1 && res[1] === 2);
        return done();
      });
    });

    it('multiple message can be queued and yield one by one', function (done) {
      go(function* (chan) {
        process.nextTick(function () { chan(null, 1); });
        process.nextTick(function () { chan(null, 2); });
        assert((yield) === 1 && (yield) === 2);
        return done();
      });
    });

    it('write error to default chan would throw by yield', function (done) {
      go(function* (chan) {
        try {
          yield;
        } catch (e) {
          return done();
        }
        throw Error('yield not throw');
      })(Error('err'));
    });

    it('throw in goroutine would crash if without any protect', function () {
      assert.throws(function () {
        go(function* () { throw Error('err'); });
      });
      assert.throws(function () {
        go(function* (chan) { chan(Error('err')); yield; });
      });
    });

    it('yield specific chan would make read from it', function (done) {
      go(function* (chan) {
        var ch2 = Channel();
        process.nextTick(function () { chan(null, 1); });
        process.nextTick(function () { ch2(null, 2); });
        assert((yield) === 1 && (yield ch2) === 2);
        return done();
      });
    });

    it('support embedding child goroutine', function (done) {
      go(function* (chan) {
        go(function* (ch2) {
          chan(null, 1);
        });
        assert.equal((yield), 1);
        return done();
      });
    });

    it('support delegate to another generator/goroutine', function (done) {
      function* mm(chan) {
        assert((yield) === 1);
        assert((yield) === 2);
        return 3;
      }
      var chan = go(function *(chan) {
        assert((yield* mm(chan)) === 3);
        return done();
      });
      chan(null, 1);
      chan(null, 2);
    });

    it('two goroutine can communicate thru channel', function (done) {
      var ch1 = go(function* (ch1) {
        var c = yield;
        ch2(null, c+1);
      });
      var ch2 = go(function* (ch2) {
        ch1(null, 1);
        assert.equal((yield), 2);
        return done();
      });
    });

    it('support yield ES6 promise to read from it', function (done) {
      go(function* (chan) {
        var prms = new Promise(function (resolve, reject) {
          process.nextTick(function () {
            resolve('resolved');
          });
        });
        assert.equal((yield prms), 'resolved');
        assert.equal((yield prms), 'resolved');
        assert.equal((yield prms), 'resolved');

        var prms2 = new Promise(function (resolve, reject) {
          process.nextTick(function () {
            reject(Error('rejected'));
          });
        });
        try {
          yield prms2;
          done(Error('prms2 should throw'));
        } catch (e) {
          done();
        }
      });
    });
  });

  describe('bind()', function () {
    it('bind one param', function (done) {
      go(function* (chan) {
        bind(chan, 'b1')(null, 1);
        var res = yield;
        assert(Array.isArray(res));
        assert(res[0] === 'b1'&& res[1] === 1);
        return done();
      });
    });

    it('bind multiple params', function (done) {
      go(function* (chan) {
        bind(chan, 'b1', 'b2')(null, 1);
        var res = yield;
        assert(Array.isArray(res));
        assert(res[0] === 'b1' && res[1] === 'b2' && res[2] === 1);
        return done();
      });
    });

    it('binds would presence as `extra` on error', function (done) {
      go(function* (chan) {
        bind(chan, 'b1')(Error('err'));
        try {
          yield;
        } catch (e) {
          assert.equal(e.extra, 'b1');
          return done();
        }
      });
    });
  });

  describe('then()', function () {
    it('split err from callbacks', function () {
      then(null, function (res) {
        assert.equal(res, 1);
      })(null, 1);

      then(function (e) {
        assert.equal(e.message, 'err');
      })(Error('err'));
    });

    it('support multiple params', function () {
      then(null, function (res, r2, r3) {
        assert.equal(res, 1);
        assert.equal(r2, 2);
        assert.equal(r3, 3);
      })(null, 1, 2, 3);
    });
  });
});
