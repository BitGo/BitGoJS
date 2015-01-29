//
// List, create, or delete labels on addresses for a given wallet
//
// Copyright 2015, BitGo, Inc.  All Rights Reserved.
//

var BitGoJS = require('../src/index.js');
var readline = require('readline');
var Q = require('q');
var _ = require('lodash');
_.string = require('underscore.string');

if (process.argv.length <= 4) {
  console.log("usage:\n\t" + process.argv[0] + " " + process.argv[1] + " <user> <pass> <otp>");
  process.exit(-1);
}

var bitgo = new BitGoJS.BitGo();
var inputs = {};       // Inputs collected from the user & command line.
inputs.user = process.argv[2];
inputs.password = process.argv[3];
inputs.otp = process.argv[4];

//
// collectInputs
// Function to collect inputs from stdin
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
    rl.setPrompt(question);
    rl.prompt();
    rl.on('line', function(line) {
        rl.close();
        return deferred.resolve(line);
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

  var getCreateOrDeleteVariables = function() {
    return function() {
        var deferred = Q.defer();
        if (inputs.action == "create") {
            return getVariable("address", "On which address are we setting the label: ")()
                    .then(getVariable("label", "What label do you want to set on the address: "));
        } else if (inputs.action == "delete") {
            return getVariable("address", "From which address are we removing the label: ")();
        } else {
            deferred.resolve();
            return deferred.promise;
        }
    };
  };

  return getVariable("walletId", "Enter the wallet ID: ")()
        .then(getVariable("action", "Which label action do you wish to perform? [list, create, delete]: "))
        .then(getCreateOrDeleteVariables());
};

var authenticate = function() {
    bitgo.authenticate({username: inputs.user, password: inputs.password, otp: inputs.otp}, function (err, result) {
        if (err) {
            console.dir(err);
            throw new Error("Authentication failure!");
        }
    });
};

var runCommands = function() {
    // Now get the wallet
    bitgo.wallets().get({type: 'bitcoin', id: inputs.walletId}, function (err, wallet) {
        if (err) {
            console.log(err);
            process.exit(-1);
        }

        switch (inputs.action) {
            case 'list':
                // Get the labels for the addresses in this wallet
                wallet.labels({}, function (err, result) {
                    if (err) {
                        console.log(err);
                        process.exit(-1);
                    }
                    if (result) {
                        var sortedLabels = _.sortBy(result, function(label) { return label.label + label.address; });
                        sortedLabels.forEach(function (label) {
                            var line = ' ' + _.string.rpad(label.address, 38) + _.string.prune(label.label, 60);
                            console.log(line);
                        });
                    }
                });
                break;
            case 'create':
                wallet.createLabel({label: inputs.label, address: inputs.address}, function (err, result) {
                    if (err) {
                        console.log(err);
                        process.exit(-1);
                    }
                    console.log('Created label ' + result.label + ' on address ' + result.address);
                });
                break;
            case 'delete':
                wallet.deleteLabel({address: inputs.address}, function (err, result) {
                    if (err) {
                        console.log(err);
                        process.exit(-1);
                    }
                    console.log('Deleted label from address ' + result.address);
                });
                break;
            default:
                console.log("Invalid action entered!");
        }
    });
}

authenticate();
collectInputs()
    .then(runCommands)
    .catch (function(e) {
    console.log(e);
    console.log(e.stack);
});
