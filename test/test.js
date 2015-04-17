/* Copyright 2015, Wang Wenlin */

var assert = require('assert');
var util = require('util');
//
var Channel = require('../').Channel;
var go = require('../').go;
var bind = require('../').bind;
var then = require('../').then;

describe('go.js', function () {
  describe('Channel', function () {
    it('can write message and poll to read', function (done) {
      var chan = Channel();
      chan(null, 1);

      chan.poll(function () {
        var msg = chan.read();
        assert.equal(msg[1], 1);
        assert(!chan.read());
        return done();
      });
    })
  });

  describe('go()', function () {
    it('only support generator', function () {
      go(function* () {});
      assert.throws(function () { go(function () {}); });
    });

    it('addition args for generator', function (done) {
      go(function* (chan, done) { done(); }, done);
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

    it('yield combined with async function call', function (done) {
      go(function* (chan) {
        var res = yield process.nextTick(function () { chan(null, 1); });
        assert.equal(res, 1);
        return done();
      });
    });

    it('throw in generator would crash without protects', function () {
      assert.throws(function () {
        go(function* () { throw Error('err'); });
      });
      assert.throws(function () {
        go(function* () { chan(null, Error('err')); yield; });
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

    it('embed child go()', function (done) {
      go(function* (chan) {
        go(function* (ch2) {
          chan(null, 1);
        });
        assert.equal((yield), 1);
        return done();
      });
    });

    it('yield specific chan would make runloop to read from that', function (done) {
      go(function* (chan) {
        var ch2 = Channel();
        process.nextTick(function () { chan(null, 1); });
        process.nextTick(function () { ch2(null, 2); });
        assert((yield) === 1 && (yield ch2) === 2);
        return done();
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
