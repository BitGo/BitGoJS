//
// Tests for Bitcoin Message
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var Bitcoin = require('../../src/index');
var assert = require('assert');

describe('Message', function() {
  var data = [
    {
      key: '16vqGo3KRKE9kTsTZxKoJKLzwZGTodK3ce',
      signature: 'HPDs1TesA48a9up4QORIuub67VHBM37X66skAYz0Esg23gdfMuCTYDFORc6XGpKZ2/flJ2h/DUF569FJxGoVZ50=',
      message: 'test message',
      expectedResult: true
    },
    {
      key: '16vqGo3KRKE9kTsTZxKoJKLzwZGTodK3ce',
      signature: 'HPDs1TesA48a9up4QORIuub67VHBM37X66skAYz0Esg23gdfMuCTYDFORc6XGpKZ2/flJ2h/DUF569FJxGoVZ50=',
      message: 'test message 2',
      expectedResult: false
    },
    {
      key: '1GdKjTSg2eMyeVvPV5Nivo6kR8yP2GT7wF',
      signature: 'GyMn9AdYeZIPWLVCiAblOOG18Qqy4fFaqjg5rjH6QT5tNiUXLS6T2o7iuWkV1gc4DbEWvyi8yJ8FvSkmEs3voWE=',
      message: 'freenode:#bitcoin-otc:b42f7e7ea336db4109df6badc05c6b3ea8bfaa13575b51631c5178a7',
      expectedResult: true
    },
    {
      key: '1Hpj6xv9AzaaXjPPisQrdAD2tu84cnPv3f',
      signature: 'INEJxQnSu6mwGnLs0E8eirl5g+0cAC9D5M7hALHD9sK0XQ66CH9mas06gNoIX7K1NKTLaj3MzVe8z3pt6apGJ34=',
      message: 'testtest',
      expectedResult: true
    }
  ];

  it("sign message", function() {
    Bitcoin.setNetwork('prod');
    var message = "goodbyte, cruel world";
    var key = new Bitcoin.ECKey();
    var sig = Bitcoin.Message.signMessage(key, message, key.compressed);
    assert.equal(Bitcoin.Message.verifyMessage(key.getBitcoinAddress().toString(), sig, message), true);
  });

  it("verify signature", function() {
    Bitcoin.setNetwork('prod');
    for (var index = 0; index < data.length; ++index) {
      var test = data[index];
      assert.equal(Bitcoin.Message.verifyMessage(test.key, test.signature, test.message), test.expectedResult);
    }
  });
});


