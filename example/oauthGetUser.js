//
// Using OAuth, authenticate with an auth code and get the user that is logged in
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var BitGoJS = require('../src/index.js');

if (process.argv.length <= 4) {
  console.log("usage:\n\t" + process.argv[0] + " " + process.argv[1] + " <clientId> <clientSecret> <authorizationCode>");
  process.exit(-1);
}

var clientId = process.argv[2];
var clientSecret = process.argv[3];
var authorizationCode = process.argv[4];

var bitgo = new BitGoJS.BitGo({clientId:clientId, clientSecret:clientSecret});

// First, Authenticate
bitgo.authenticateWithAuthCode({ authCode: authorizationCode }, function(err, result) {
  if (err) {
    console.dir(err);
    throw new Error("Could not auth!");
  }

  console.dir(result);
  console.log('Successfully logged in with auth code!');
  bitgo.me({}, function(err, response) {
    if (err) {
      console.dir(err);
      throw new Error("Could not get user!");
    }

    console.dir(response);
  });
});