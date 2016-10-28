//
// approve a transaction given a pending approval ID
//
// This example shows how to approve a pending approval created when another user attempted
// to send a transaction but had a policy trigger, preventing it from going through. In order to
// complete the transaction another admin on the wallet must approve the pending approval for
// the transaction send.
//
// Copyright 2016, BitGo, Inc.  All Rights Reserved.
//

var BitGoJS = require('../src/index.js');

if (process.argv.length !== 7) {
  console.log("usage:\n\t" + process.argv[0] + " " + process.argv[1] +
    " <user> <pass> <otp> <walletPassphrase> <pendingApprovalId>");

  console.log("user: user email (on test.bitgo.com)");
  console.log("pass: password");
  console.log("otp: one-time password, 0000000 on test");
  console.log("walletPassphrase: password to the wallet which previously attempted to send a transaction");
  console.log("pendingApprovalId: ID of the pending approval (from the response of a previous transaction send call");
  process.exit(-1);
}

var user = process.argv[2];
var password = process.argv[3];
var otp = process.argv[4];
var walletPassphrase = process.argv[5];
var pendingApprovalId = process.argv[6];

var bitgo = new BitGoJS.BitGo({ env: 'test' });

var approveTransaction = function () {

  return bitgo.authenticate({ username: user, password: password, otp: otp })
  .then(function () {
    return bitgo.unlock({ otp: otp });
  })
  .then(function() {
    // Fetch the specified pending approval
    return bitgo.pendingApprovals().get({ id: pendingApprovalId })
  })
  .then(function (pendingApproval) {

    // we need the wallet password to create the half-signed transaction locally
    return pendingApproval.approve({ walletPassphrase: walletPassphrase });
  }).then(function (res) {
    console.dir(res);
    process.exit(-1);
  })
  .catch(function (err) {
    console.log(err);
    process.exit(-1);
  });
};

approveTransaction();
