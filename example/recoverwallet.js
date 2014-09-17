//
// Recover a BitGo Wallet from the keycard
// This utility intentionally avoids any API calls to the BitGo service and alternatively usees
// an external API.  This is to prove that bitcoin stored in wallets created through the BitGo service
// can be 100% recovered using just the KeyCard provided at account creation on BitGo.
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var BitGoJS = require('../src/index.js');
var readline = require('readline');
var Q = require('q');

var chain = require('chain-node');   // Use chain.com as our alternate blockchain api provider
chain.apiKeyId = '22f44d29f2501b7eb4fe7143900589cb';
chain.apiKeySecret = '8c6d187702fa5cf12c63f1f58952e64f';

var bitgo = new BitGoJS.BitGo();
var inputs = {};       // Inputs collected from the user & command line.
var userKey;           // The BIP32 xprv for the user key
var backupKey;         // The BIP32 xprv for the backup key
var bitgoKey;          // The BIP32 xpub for the bitgo public key
var baseAddress;       // The multisig wallet address to recover
var subAddresses = {}; // A map of addresses containing funds to recover
var unspents;          // The unspents from the HD wallet
var transaction;       // The transaction to send
var bitcoinNetwork = 'prod';

console.log('This tool is used to recover BitGo wallets directly from the blockchain')
console.log('without using the BitGo service.');
console.log('');
console.log('It will collect the two keys to your wallet, as well as your passcode and');
console.log('then transfer your bitcoin to the address of your choice.');


//
// collectInputs
// Function to asynchronously collect inputs for the recovery tool.
//
var collectInputs = function() {
  var argv = require('minimist')(process.argv.slice(2));

  // Prompt the user for input
  var prompt = function(question) {
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    var deferred = Q.defer();
    rl.question(question, function(answer) {
      rl.close();
      deferred.resolve(answer);
    });
    return deferred.promise;
  };

  var getVariable = function(variable, question) {
    return function() {
      var deferred = Q.defer();
      if (argv[variable]) {
        inputs[variable] = argv[variable];
        return Q.when();
      } else {
        prompt(question).then(function(value) {
          inputs[variable] = value;
          deferred.resolve();
        });
        return deferred.promise;
      }
    };
  };

  if (argv['testnet']) {
    bitcoinNetwork = 'testnet';
    chain.blockChain = 'testnet3';
  }
  BitGoJS.setNetwork(bitcoinNetwork);

  if (argv['nosend']) {
    inputs.nosend = true;
  }

  return getVariable("userKey", "Enter value from Box A: 'User Key': ")()
    .then(getVariable("backupKey", "Enter value from Box B: 'Backup Key': "))
    .then(getVariable("bitgoKey", "Enter value from Box C: 'BitGo Public Key': "))
    .then(getVariable("password", "Enter your wallet passcode: "))
    .then(getVariable("destination", "Enter the bitcoin address to receive the funds: "));
};

//
// decryptKeys
// attempts to convert the input keys into BIP32 objects.  The inputs can either
// be stringified BIP32 extended keys (public or private) or they can be encrypted.
//
var decryptKeys = function() {
  var keyToBIP32 = function(key, password, mustBePrivate) {
    try {
       if (key.indexOf('x') != 0) {
         key = bitgo.decrypt(password, key);
       }
       if (mustBePrivate) {
         if (key.indexOf('xprv') != 0) {
           throw new Error('must be xprv key');
         }
       }
       return new BitGoJS.BIP32(key);
    } catch(e) {
      throw new Error('invalid key: ' + e);
    }
  };

  userKey = keyToBIP32(inputs.userKey, inputs.password, true);
  backupKey = keyToBIP32(inputs.backupKey, inputs.password, true);
  bitgoKey = keyToBIP32(inputs.bitgoKey, inputs.password, false);
  return Q.when();
};

//
// findBaseAddress
// Given the input keys, we search around to find the actual path used to
// create this wallet.
//
var findBaseAddress = function() {
  var deferred = Q.defer();
  var keys = [
    { key: userKey, path: 'm/100\'/101/0/0' },
    { key: backupKey, path: 'm/101/0/0' },
    { key: bitgoKey, path: 'm/101/0/0' },
  ];
  var INITIAL_BITGO_KEY_TO_TRY = 101;
  var MAX_BITGO_KEY_TO_TRY = 110;
  var MAX_ADDRESS_INDEX_TO_TRY = 5;
  var bitgoKeyIndexToTry = INITIAL_BITGO_KEY_TO_TRY;
  var pubKeys;

  console.log("Searching for HD Wallet base address...");

  function tryKey(bitGoKeyIndex, addressIndex) {
    // Set the path to try.
    keys[0].path = 'm/100\'/101/0/' + addressIndex;
    keys[1].path = 'm/101/0/' + addressIndex;
    keys[2].path = 'm/' + bitGoKeyIndex + '/0/' + addressIndex;

    pubKeys = [];
    for (var key in keys) {
      var keyData = keys[key];
      keyData.derived = keyData.key.derive(keyData.path);
      keyData.derivedPubKey = keyData.derived.eckey.getPub();
      pubKeys.push(keyData.derivedPubKey);
    }
    baseAddress = BitGoJS.Address.createMultiSigAddress(pubKeys, 2);

    console.log("\tTrying address: " + baseAddress);
    chain.getAddress(baseAddress, function(err, data) {
      if (err) {
        throw new Error("Chain.com error: " + err);
      }
      // The base address may not have any bitcoins in it right now.  Look for
      // an address that either has a balance or has sent bitcoins.
      if (data.balance > 0 || data.sent > 0) {
        baseAddress = {
          address: baseAddress,
          keys: [
            { key: keys[0].key, path: keys[0].path.substring(0, keys[0].path.length - 2) },
            { key: keys[1].key, path: keys[1].path.substring(0, keys[1].path.length - 2) },
            { key: keys[2].key, path: keys[2].path.substring(0, keys[2].path.length - 2) },
          ],
        };
        deferred.resolve();
      } else {
        if (++addressIndex >= MAX_ADDRESS_INDEX_TO_TRY) {
          if (++bitgoKeyIndexToTry >= MAX_BITGO_KEY_TO_TRY) {
            throw new Error('could not find address with balance.  (Have your transactions been confirmed yet?)');
          }
          addressIndex = 0;
        }
        tryKey(bitgoKeyIndexToTry, addressIndex);
      }
    });
  }
  tryKey(bitgoKeyIndexToTry, 0);

  return deferred.promise;
};

//
// findSubAddresses
// Given our baseAddress, find all sub addresses containing bitcoins.
//
var findSubAddresses = function() {
  var deferred = Q.defer();
  var MAX_LOOKAHEAD_ADDRESSES = 20;
  var lookahead = 0;
  var pubKeys;

  console.log("Searching for non-empty HD Wallet sub-addresses...");

  function tryAddress(index) {
    pubKeys = [];
    for (var key in baseAddress.keys) {
      var keyData = baseAddress.keys[key];
      var path = keyData.path + '/' + index;
      keyData.derived = keyData.key.derive(path);
      keyData.derivedPubKey = keyData.derived.eckey.getPub();
      pubKeys.push(keyData.derivedPubKey);
    }

    var subAddress = BitGoJS.Address.createMultiSigAddress(pubKeys, 2);
    var subAddressString = subAddress.toString();

    chain.getAddress(subAddressString, function(err, data) {
      if (err) {
        throw new Error("Chain.com error: " + err);
      }
      if (data.balance > 0) {
        lookahead = 0;
        console.log('\tfound: ' + data.balance + ' at ' + subAddressString);
        subAddresses[subAddressString] = {
          address: subAddress,
          index: index,
          keys: [
            { key: baseAddress.keys[0].derived, path: baseAddress.keys[0].path + '/' + index },
            { key: baseAddress.keys[1].derived, path: baseAddress.keys[1].path + '/' + index },
            { key: baseAddress.keys[2].derived, path: baseAddress.keys[2].path + '/' + index },
          ],
          redeemScript: BitGoJS.Util.bytesToHex(subAddress.redeemScript)
        };
      } else {
        if (++lookahead >= MAX_LOOKAHEAD_ADDRESSES) {
          return deferred.resolve();
        }
      }
      tryAddress(index + 1);
    });
  }
  tryAddress(0);

  return deferred.promise;
};

//
// findUnspents
// Collects list of unspents for the set of subAddresses
//
var findUnspents = function() {
  var deferred = Q.defer();

  var addressList = Object.keys(subAddresses);

  chain.getAddressesUnspents(addressList, function(err, unspentData) {
    if (err) {
      throw new Error("Chain.com error: " + err);
    }
    unspents = unspentData;

    // For each unspent, attach the keys and redeemScript for signing
    for (var index in unspents) {
      var outputAddress = unspents[index].addresses[0];
      var subAddress = subAddresses[outputAddress];
      unspents[index].keys = subAddress.keys;
      unspents[index].redeemScript = subAddress.redeemScript;
    }
    return deferred.resolve();
  });
  return deferred.promise;
};

var createTransaction = function() {
  var totalValue = 0;
  transaction = new BitGoJS.Transaction();

  // Add the inputs
  for (var index in unspents) {
    var unspent = unspents[index];
    transaction.addInput(new BitGoJS.TransactionIn({
      outpoint: { hash: unspent.transaction_hash, index: unspent.output_index },
      script: new BitGoJS.Script(unspent.script_hex),
      sequence: 4294967295
    }));
    totalValue += unspent.value;
  }

  // Note:  we haven't signed the inputs yet.  When we sign them, the transaction will grow by
  //        about 232 bytes per input (2 sigs + redeemscript + misc)
  var approximateSize = transaction.serialize().length + (232 * unspents.length);
  var approximateFee = ((Math.floor(approximateSize / 1024)) + 1) * 0.0001 * 1e8;
  if (approximateFee > totalValue) {
    throw new Error("Insufficient funds to recover (Have your transactions confirmed yet?)");
  }
  totalValue -= approximateFee;

  console.log("Recovering: " + totalValue / 1e8 + "BTC");
  console.log("Fee: " + approximateFee / 1e8 + "BTC");

  // Create the output
  transaction.addOutput(new BitGoJS.Address(inputs.destination), totalValue);

  for (var index in unspents) {
    var unspent = unspents[index];
    var redeemScript = new BitGoJS.Script(unspent.redeemScript);

    console.log("Signing input " + index + " of " + unspents.length);

    if (!transaction.signMultiSigWithKey(index, unspent.keys[0].key.eckey, redeemScript)) {
      throw new Error('Signature failure for user key');
    }
    if (!transaction.signMultiSigWithKey(index, unspent.keys[1].key.eckey, redeemScript)) {
      throw new Error('Signature failure for backup key');
    }
  }

  return Q.when();
};

//
// sendTransaction
// Actually send the fully created transaction to the bitcoin network.
//
var sendTransaction = function() {
  var tx = BitGoJS.Util.bytesToHex(transaction.serialize());

  console.log("Sending transaction: " + tx);

  if (!inputs.nosend) {
    chain.sendTransaction(tx, function(err, resp) {
      if (err) {
        throw new Error("Chain.com error: " + err);
      }
console.dir(resp);
      console.log("sent!");
    });
  } else {
    console.log("[Transaction not sent to network]");
  }
}

collectInputs()
  .then(decryptKeys)
  .then(findBaseAddress)
  .then(findSubAddresses)
  .then(findUnspents)
  .then(createTransaction)
  .then(sendTransaction)
  .catch (function(e) {
    console.log(e);
    console.log(e.stack);
  });
