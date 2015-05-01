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
var HDNode = require('../src/hdnode');
var Address = require('bitcoinjs-lib/src/address');
var Script = require('bitcoinjs-lib/src/script');
var Scripts = require('bitcoinjs-lib/src/scripts');
var Transaction = require('bitcoinjs-lib/src/transaction');
var TransactionBuilder = require('bitcoinjs-lib/src/transaction_builder');
var networks = require('bitcoinjs-lib/src/networks');
var Util = require('../src/util');
var Q = require('q');

var chain = require('chain-node');   // Use chain.com as our alternate blockchain api provider
chain.apiKeyId = '22f44d29f2501b7eb4fe7143900589cb';
chain.apiKeySecret = '8c6d187702fa5cf12c63f1f58952e64f';

var bitgo = new BitGoJS.BitGo();
var inputs = {};       // Inputs collected from the user & command line.
var userKey;           // The BIP32 xprv for the user key
var backupKey;         // The BIP32 xprv for the backup key
var bitgoKey;          // The BIP32 xpub for the bitgo public key
var subAddresses = {}; // A map of addresses containing funds to recover
var unspents;          // The unspents from the HD wallet
var transaction;       // The transaction to send
var bitcoinNetwork = 'bitcoin';

var info = '\n' +
'**********************************\n' +
'**  BitGo Wallet Recovery Tool  **\n' +
'**********************************\n\n' +
'This tool is used to recover BitGo wallets directly from the blockchain\n' +
'without using the BitGo service.\n\n' +
'It will collect the two keys to your wallet, as well as your passcode and\n' +
'then transfer your bitcoin to the address of your choice.\n\n' +
'Please enter a blank line after each input.\n';
console.log(info);

//
// collectInputs
// Function to asynchronously collect inputs for the recovery tool.
//
var collectInputs = function() {
  var argv = require('minimist')(process.argv.slice(2));

  // Prompt the user for input
  var prompt = function(question) {
    var answer = "";
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    var deferred = Q.defer();
    rl.setPrompt(question);
    rl.prompt();
    rl.on('line', function(line) {
      if (line.length === 0) {
        rl.close();
        return deferred.resolve(answer);
      }
      answer += line;
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

  if (argv.testnet) {
    bitcoinNetwork = 'testnet';
    chain.blockChain = 'testnet3';
  }
  BitGoJS.setNetwork(bitcoinNetwork);

  if (argv.nosend) {
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
       if (key.indexOf('x') !== 0) {
         key = bitgo.decrypt({ password: password, input: key });
       }
       if (mustBePrivate) {
         if (key.indexOf('xprv') !== 0) {
           throw new Error('must be xprv key');
         }
       }
       return HDNode.fromBase58(key);
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
// BitGo has use two types of paths in its wallets.
//
// Newer wallets use this form
//     userKey  :  m/0/0/[0,1]/n
//     backupKey:  m/0/0/[0,1]/n
//     bitgoKey :  m/0/0/[0,1]/n
//
// Older wallets use this form:
//     userKey  :  m/100'/101/0/n   -- the first level is hardened, second
//                                     level starts at 101.
//     backupKey:  m//101/0/n       -- the first level starts at 101.
//     bitgoKey :  m//101+x/0/n     -- the first level is 101 + x, where x is
//                                     the number of wallets the user has
//                                     created on bitgo.
//
var findBaseAddress = function() {
  var findBaseAddressDeferred = Q.defer();
  var keys = [
    { key: userKey },
    { key: backupKey },
    { key: bitgoKey }
  ];
  var INITIAL_BITGO_KEY_TO_TRY = 101;
  var MAX_BITGO_KEY_TO_TRY = 120;
  var MAX_ADDRESS_INDEX_TO_TRY = 3;

  console.log("Searching for HD Wallet base address...");

  // Probes an address generated by the current value of the keys.
  // Returns true if the address has been used on the blockchain,
  // false otherwise.
  function tryPath() {
    var tryPathDeferred = Q.defer();
    var pubKeys = [];

    for (var key in keys) {
      var keyData = keys[key];
      keyData.derived = keyData.key.deriveFromPath(keyData.path);
      keyData.derivedPubKey = keyData.derived.pubKey;
      pubKeys.push(keyData.derivedPubKey);
    }
    var network = BitGoJS.getNetwork() === 'bitcoin' ? networks.bitcoin : networks.testnet;
    var baseAddress = Address.fromOutputScript(Util.p2shMultisigOutputScript(2, pubKeys), network).toBase58Check();

    console.log("\tTrying address: " + baseAddress);
    chain.getAddress(baseAddress, function(err, data) {
      if (err) {
        throw new Error("Chain.com error: " + err);
      }
      // The base address may not have any bitcoins in it right now.  Look for
      // an address that either has a balance or has sent bitcoins.
      if (data.balance > 0 || data.sent > 0) {
        var result = {
          address: baseAddress,
          keys: [
            { key: keys[0].key, path: keys[0].path.substring(0, keys[0].path.length - 4) },
            { key: keys[1].key, path: keys[1].path.substring(0, keys[1].path.length - 4) },
            { key: keys[2].key, path: keys[2].path.substring(0, keys[2].path.length - 4) },
          ],
        };
        tryPathDeferred.resolve(result);
      } else {
        tryPathDeferred.resolve(null);
      }
    });
    return tryPathDeferred.promise;
  }

  var tryOldKeysDeferred = Q.defer();
  function tryOldKeys(bitGoKeyIndex, addressIndex) {
    // Set the path to try.
    keys[0].path = 'm/100\'/101/0/' + addressIndex;
    keys[1].path = 'm/101/0/' + addressIndex;
    keys[2].path = 'm/' + bitGoKeyIndex + '/0/' + addressIndex;

    tryPath().then(function(result) {
      if (result) {
        tryOldKeysDeferred.resolve(result);
        return;
      }
      if (++addressIndex >= MAX_ADDRESS_INDEX_TO_TRY) {
        if (++bitGoKeyIndex >= MAX_BITGO_KEY_TO_TRY) {
          tryOldKeysDeferred.resolve(null);
          return;
        }
        addressIndex = 0;
      }
      tryOldKeys(bitGoKeyIndex, addressIndex);
    });

    return tryOldKeysDeferred.promise;
  }

  var tryNewKeysDeferred = Q.defer();
  function tryNewKeys(addressIndex) {
    // Set the path to try.
    keys[0].path = 'm/0/0/0/' + addressIndex;
    keys[1].path = 'm/0/0/0/' + addressIndex;
    keys[2].path = 'm/0/0/0/' + addressIndex;

    tryPath().then(function(result) {
      if (result) {
        tryNewKeysDeferred.resolve(result);
        return;
      }
      if (++addressIndex >= MAX_ADDRESS_INDEX_TO_TRY) {
        tryNewKeysDeferred.resolve(null);
        return;
      }
      tryNewKeys(addressIndex);
    });

    return tryNewKeysDeferred.promise;
  }

  // First search the new HD wallet type.
  tryNewKeys(0).then(function(address) {
    if (address) {
      // we found it!
      return findBaseAddressDeferred.resolve(address);
    }

    // Keep searching using the old hd wallet type
    tryOldKeys(INITIAL_BITGO_KEY_TO_TRY, 0).then(function(address) {
      if (address) {
        throw new Error('could not find address with balance.  (Have your transactions been confirmed yet?)');
      }
      findBaseAddressDeferred.resolve(address);
    });
  });
  return findBaseAddressDeferred.promise;
};

//
// findSubAddresses
// Given our baseAddress, find all sub addresses containing bitcoins.
//
var findSubAddresses = function(baseAddress) {
  if (!baseAddress) {
    console.log('Could not find base address - perhaps the wallet is empty?');
    process.exit();
  }
  var deferred = Q.defer();
  var MAX_LOOKAHEAD_ADDRESSES = 20;
  var lookahead = 0;
  var pubKeys;

  console.log("Searching for non-empty HD Wallet sub-addresses...");

  function tryAddress(keyIndex, addressIndex) {
    pubKeys = [];
    for (var key in baseAddress.keys) {
      var keyData = baseAddress.keys[key];
      var path = keyData.path + '/' + keyIndex + '/' + addressIndex;
      keyData.derived = keyData.key.deriveFromPath(path);
      keyData.derivedPubKey = keyData.derived.pubKey;
      pubKeys.push(keyData.derivedPubKey);
    }

    var network = BitGoJS.getNetwork() === 'bitcoin' ? networks.bitcoin : networks.testnet;
    var redeemScript = Scripts.multisigOutput(2, pubKeys);
    var subAddressString = Address.fromOutputScript(Util.p2shMultisigOutputScript(2, pubKeys), network).toBase58Check();

    console.log("Trying keyIndex " + keyIndex + " addressIndex " + addressIndex + ": " + subAddressString + "...");
    chain.getAddress(subAddressString, function(err, data) {
      if (err) {
        throw new Error("Chain.com error: " + err);
      }
      if (data.balance > 0) {
        lookahead = 0;
        console.log('\tfound: ' + data.balance + ' at ' + subAddressString);
        subAddresses[subAddressString] = {
          address: subAddressString,
          keyIndex: keyIndex,
          addressIndex: addressIndex,
          keys: [
            { key: baseAddress.keys[0].derived, path: baseAddress.keys[0].path + '/' + keyIndex + '/' + addressIndex },
            { key: baseAddress.keys[1].derived, path: baseAddress.keys[1].path + '/' + keyIndex + '/' + addressIndex },
            { key: baseAddress.keys[2].derived, path: baseAddress.keys[2].path + '/' + keyIndex + '/' + addressIndex },
          ],
          redeemScript: redeemScript.toBuffer().toString('hex')
        };
      } else {
        if (++lookahead >= MAX_LOOKAHEAD_ADDRESSES) {
          if (keyIndex === 0) {
            lookahead = 0;
            return tryAddress(1, 0);
          } else {
            return deferred.resolve();
          }
        }
      }
      tryAddress(keyIndex, addressIndex + 1);
    });
  }
  tryAddress(0, 0);

  return deferred.promise;
};

//
// findUnspents
// Collects list of unspents for the set of subAddresses
//
var findUnspents = function() {
  var deferred = Q.defer();

  var addressList = Object.keys(subAddresses);

  if (addressList.length === 0) {
    throw new Error("could not find any unspents for this address.  Try expanding your search.");
  }

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
  transaction = new Transaction();

  // Add the inputs
  for (var index in unspents) {
    var unspent = unspents[index];
    var hash = new Buffer(unspent.transaction_hash, 'hex');
    hash = new Buffer(Array.prototype.reverse.call(hash));
    var index = unspent.output_index;
    var script = Script.fromHex(unspent.script_hex);
    var sequence = 0xffffffff;
    transaction.addInput(hash, index, sequence, script);
    totalValue += unspent.value;
  }

  // Note:  we haven't signed the inputs yet.  When we sign them, the transaction will grow by
  //        about 232 bytes per input (2 sigs + redeemscript + misc)
  var approximateSize = transaction.toBuffer().length + (232 * unspents.length);
  var approximateFee = ((Math.floor(approximateSize / 1024)) + 1) * 0.0001 * 1e8;
  if (approximateFee > totalValue) {
    throw new Error("Insufficient funds to recover (Have your transactions confirmed yet?)");
  }
  totalValue -= approximateFee;

  console.log("Recovering: " + totalValue / 1e8 + "BTC");
  console.log("Fee: " + approximateFee / 1e8 + "BTC");

  // Create the output
  var script = Address.fromBase58Check(inputs.destination).toOutputScript();
  transaction.addOutput(Address.fromBase58Check(inputs.destination), totalValue);

  var txb = TransactionBuilder.fromTransaction(transaction);

  for (index in unspents) {
    index = parseInt(index);
    var unspent = unspents[index];
    var redeemScript = Script.fromHex(unspent.redeemScript);

    console.log("Signing input " + (index + 1) + " of " + unspents.length);

    try {
      txb.sign(index, unspent.keys[0].key.privKey, redeemScript);
    } catch (e) {
      throw new Error('Signature failure for user key: ' + e);
    }
    try {
      txb.sign(index, unspent.keys[1].key.privKey, redeemScript);
    } catch (e) {
      throw new Error('Signature failure for backup key: ' + e);
    }
  }

  transaction = txb.build();

  return Q.when();
};

//
// sendTransaction
// Actually send the fully created transaction to the bitcoin network.
//
var sendTransaction = function() {
  var tx = transaction.toBuffer().toString('hex');

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
};

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
