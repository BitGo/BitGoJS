/**
 * Utility functions for testing
 */

var TestUtil = module.exports;
var should = require('should');
var moment = require('moment');
var _ = require('lodash');
var Q = require('q');

/**
 * Checks if a promise chain throws an error, and optionally that the error includes
 * the given errorMsg. Our current version of shouldjs (3.3.2) doesn't have the promise
 * assertion .rejectedWith, so we make due with this.
 * @param promise {String} (optional) error message to check for
 * @param errorMsg
 */
TestUtil.throws = function(promise, errorMsg) {
  return promise
  .then(function(res) {
    throw new Error(); // should never reach this point
  })
  .catch(function(e) {
    if (errorMsg) {
      e.message.should.include(errorMsg);
    }
    should.exist(e);
  });
};

// `condition` is a function that returns a boolean
// `body` is a function that returns a promise
// returns a promise for the completion of the loop
TestUtil.promiseWhile = function(condition, body) {
  var done = Q.defer();

  function loop() {
    // When the result of calling `condition` is no longer true, we are
    // done.
    if (!condition()) return done.resolve();
    // Use `when`, in case `body` does not return a promise.
    // When it completes loop again otherwise, if it fails, reject the
    // done promise
    Q.when(body(), loop, done.reject);
  }

  // Start running the loop in the next tick so that this function is
  // completely async. It would be unexpected if `body` was called
  // synchronously the first time.
  Q.nextTick(loop);

  // The promise
  return done.promise;
};

// helper function used to cleanup more than one token
// This is useful in the event that some of your tests fail, and there ends up being more than 10 access tokens
// at which point the server won't allow you to make any more longlived tokens
TestUtil.deleteTestTokens = function(bitgoObj, filterFunc) {
  var tokenList;
  var index = 0;

  var condition = function() { return index < tokenList.length }; // don't delete last token, which is the login token for this test
  var body = function() {
    var token = tokenList[index];

    return bitgoObj.removeAccessToken({ id: token.id })
    .then(function(tok) {
      if (tok) {
        tok.id.should.equal(tokenList[index].id);
      }
    })
    .catch(function(e) {
      console.log(e); // show the error to help debugging
    })
    .finally(function() {
      index++;
    });
  };

  return bitgoObj.listAccessTokens()
  .then(function(tokens) {
    // clear up access tokens which return true from the filter function
    tokenList = _.filter(tokens, filterFunc);
    
    return TestUtil.promiseWhile(condition, body);
  });
};