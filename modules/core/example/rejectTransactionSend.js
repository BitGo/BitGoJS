//
// reject a transaction given a pending approval ID
//
// This example shows how to reject a pending approval created when another user attempted
// to send a transaction but had a policy trigger.
//
// Copyright 2016, BitGo, Inc.  All Rights Reserved.
//

const BitGoJS = require('../src/index.js');

if (process.argv.length !== 6) {
  console.log('usage:\n\t' + process.argv[0] + ' ' + process.argv[1] +
    ' <user> <pass> <otp> <pendingApprovalId>');

  console.log('user: user email (on test.bitgo.com)');
  console.log('pass: password');
  console.log('otp: one-time password, 0000000 on test');
  console.log('pendingApprovalId: ID of the pending approval (from the response of a previous transaction send call');
  process.exit(-1);
}

const user = process.argv[2];
const password = process.argv[3];
const otp = process.argv[4];
const pendingApprovalId = process.argv[5];

const bitgo = new BitGoJS.BitGo({ env: 'test' });

const approveTransaction = function() {

  return bitgo.authenticate({ username: user, password: password, otp: otp })
  .then(function() {

    // Fetch the specified pending approval
    return bitgo.pendingApprovals().get({ id: pendingApprovalId });
  })
  .then(function(pendingApproval) {
    return pendingApproval.reject();
  }).then(function(res) {
    console.dir(res);
    process.exit(-1);
  })
  .catch(function(err) {
    console.log(err);
    process.exit(-1);
  });
};

approveTransaction();
