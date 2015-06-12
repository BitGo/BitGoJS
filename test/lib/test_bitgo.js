//
// BitGo object augmented for testing
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var BitGo = require('../../src/bitgo.js');

BitGo.TEST_USER = 'tester@bitgo.com';

if (process.env.BITGOJS_TEST_PASSWORD) {
  BitGo.TEST_PASSWORD = process.env.BITGOJS_TEST_PASSWORD;
} else {
  // Test accounts are locked internally to prevent tampering
  // Contact bencxr@fragnetics.com benchan for further help on how to fix this
  throw new Error("Need to set BITGOJS_TEST_PASSWORD env variable - please see the developer setup docs.")
}

BitGo.TEST_SHARED_KEY_USER = 'shared_key_test@bitgo.com';
BitGo.TEST_SHARED_KEY_PASSWORD = BitGo.TEST_PASSWORD;

BitGo.TEST_CLIENTID = 'test';
BitGo.TEST_CLIENTSECRET = 'testclientsecret';

// These auth tokens are modified in the db to expire in 2018 on both test & dev
BitGo.TEST_AUTHCODE = '37454416ba13e1be9fdc39cfc207df7f7a7f0953';
BitGo.TEST_ACCESSTOKEN = '4cb440e353b5415e350a1e799bb1ad820fef4ead';
BitGo.TEST_ACCESSTOKEN_SHAREDUSER = '4cb440e353b5415e350a1e799bb1ad820fef4eax';
BitGo.TEST_REFRESHTOKEN = '8519fcc7787d9d6971ed89a757e3309a72ddedc8';

//
// testUserOTP
// Get an OTP code for the test user.
//
BitGo.prototype.initializeTestVars = function() {
  if (this.getEnv() == 'dev') {
    BitGo.TEST_USERID = '54d3e3a4b08fa6dc0a0002c07f8a9f86';
    BitGo.TEST_SHARED_KEY_USERID = '54d418de4ea11d050b0006186d08ea5c';
    BitGo.TEST_USER_ECDH_XPUB = 'xpub661MyMwAqRbcF31yYvTH5DbmabEMXVvx1o1p73sZmvEDHM8bhUiZzNQA4gfyDtKarpGz7NPH6Wub8YCqXnUbP8ZMA3Ad8LfwHsBWhWEeJqu';
    
    BitGo.TEST_WALLET1_PASSCODE = 'iVWeATjqLS1jJShrPpETti0b';
    BitGo.TEST_WALLET1_XPUB = 'xpub661MyMwAqRbcFgsE3Zg66E8prHy7aohb9wSiZRN9vQA4fp6n1dpXDyRLPT4YnhBTPwkhtDGqR3ynB4tJUenw9WTPhRWwZ3cpqkQrGzXTcFM';
    BitGo.TEST_WALLET1_ADDRESS = '2MuBzFZYkyyaBozzh2a5fKApwQzwLyThKv6';
    BitGo.TEST_WALLET1_ADDRESS2 = '2MxCHzAYyK9RgLGUWymw9Jhhtt19VqUtCej';
    BitGo.TEST_WALLET2_PASSCODE = 'j0XVTJiTgsMCogKRoHIDzGbz';
    BitGo.TEST_WALLET2_ADDRESS = '2MtZAqJWLBCmtjYQ7WftcXY1fdMjEv8vERZ';
    BitGo.TEST_WALLET3_PASSCODE = 'CVKzHuutdMgtlgFFWpb4oO5k';
    BitGo.TEST_WALLET3_ADDRESS = '2NE4bZSitUxoRLFg4U6qHkjrCXWNAvQBDo5';
    BitGo.TEST_WALLET3_ADDRESS2 = '2NFFt4H2vP54WwWjrUVLh7ksF4t6mabCGsh';
    BitGo.TEST_WALLET3_ADDRESS3 = '2NG8HA7qya4pbwbg25NF1SY6nEjM6apT1hF';
  } else {
    BitGo.TEST_USERID = '543c11ed356d00cb7600000b98794503';
    BitGo.TEST_SHARED_KEY_USERID = '549d0ee835aec81206004c082757570f';
    BitGo.TEST_USER_ECDH_XPUB = 'xpub661MyMwAqRbcGn8KmC8qy9cNcLcmLo8aGtcHgiMmXw7R5drDHReavre767FausTZtZTw8vfych3J9jWw67eX8314ARTb3FczLdsPnqkQjyT';

    BitGo.TEST_WALLET1_PASSCODE = 'test wallet #1 security';
    BitGo.TEST_WALLET1_XPUB = 'xpub661MyMwAqRbcFSjo1JiMfyKa9vbvMADQHRxUAGy5q6WTLWno94m9BTdJBPVJzFsP2e4wmdjzLGCUw5cD4xxw5F6J8iDrr2w3V7WfFth61oN';
    BitGo.TEST_WALLET1_ADDRESS = '2N21Bt5ZjQg5eWJLGuggY2DfkHyxhPKaagB';
    BitGo.TEST_WALLET1_ADDRESS2 = '2NEtpyMqA2v8zf44KDyyhE814FKb59zTX3J';
    BitGo.TEST_WALLET2_PASSCODE = 'test wallet #2 security';
    BitGo.TEST_WALLET2_ADDRESS = '2N1PtMP1FvPJxX8iUutbkxRVRC86xcxeF6h';
    BitGo.TEST_WALLET3_PASSCODE = 'test wallet #3 security';
    BitGo.TEST_WALLET3_ADDRESS = '2NEC139iJ3wTMeSC4GosKEYmpmGo729kBFN';
    BitGo.TEST_WALLET3_ADDRESS2 = '2ND7sbcPS5DDD9b3FpwNs53uMTEKq4hLfxW';
    BitGo.TEST_WALLET3_ADDRESS3 = '2N7Dba7yr1XkoRQh7XVhGjNUKSEgLCiibJp';

    BitGo.TEST_ENTERPRISE = '5578ebc76eb47487743b903166e6543a';
    BitGo.TEST_SHARED_WALLET_ADDRESS = '2MsMfeYWNWYwB3fzfMBfuSZb7jkcGnTjW42';
    BitGo.TEST_WALLET_PENDING_APPROVAL_ID = '5579252371baa3fd10d4bd93b6d19e68';
    BitGo.TEST_ENTERPRISE_PENDING_APPROVAL_ID = '5579267f3261f1ff10a0674902e92b4d';

  }
};

//
// testUserOTP
// Get an OTP code for the test user.
//
BitGo.prototype.testUserOTP = function() {
  return "0000000";
};

//
// authenticateTestUser
// Authenticate the test user.
//
BitGo.prototype.authenticateTestUser = function(otp, callback) {
  return this.authenticate({ username: BitGo.TEST_USER, password: BitGo.TEST_PASSWORD, otp: otp })
  .then(function(response) {
    response.should.have.property('access_token');
    response.should.have.property('user');
  })
  .nodeify(callback);
};

module.exports = BitGo;
