//
// List, create, or delete labels on addresses for a given wallet
//
// Copyright 2015, BitGo, Inc.  All Rights Reserved.
//

var BitGoJS = require('../src/index.js');
var readline = require('readline');
var Q = require('q');

if (process.argv.length <= 4) {
  console.log("usage:\n\t" + process.argv[0] + " " + process.argv[1] + " <user> <pass> <otp>");
  process.exit(-1);
}

var bitgo = new BitGoJS.BitGo({useProduction: false, env: 'test'});
var inputs = {};       // Inputs collected from the user & command line.
inputs.user = process.argv[2];
inputs.password = process.argv[3];
inputs.otp = process.argv[4];

//
// collectInputs
// Prompt the user for input
//
var collectInputs = function() {
    var argv = require('minimist')(process.argv.slice(2));

    // Prompt the user for input
    var prompt = function (question) {
        var answer = "";
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        var deferred = Q.defer();
        rl.setPrompt(question);
        rl.prompt();
        rl.on('line', function (line) {
            if (line.length === 0) {
                rl.close();
                return deferred.resolve(answer);
            }
            answer += line;
        });
        return deferred.promise;
    };

    var getVariable = function (variable, question) {
        return function () {
            var deferred = Q.defer();
            if (argv[variable]) {
                inputs[variable] = argv[variable];
                return Q.when();
            } else {
                prompt(question).then(function (value) {
                    inputs[variable] = value;
                    deferred.resolve();
                });
                return deferred.promise;
            }
        };
    };

    getVariable("walletId", "Enter the wallet ID: ")()
        .then(getVariable("action", "Which action do you wish to perform? [list, create, delete]: "));

    if(inputs.action == "create") {
        getVariable("address", "On which address are we setting the label: ")()
            .then(getVariable("label", "What label do you want to set on the address: "));
    } else if (inputs.action == "delete") {
        getVariable("address", "From which address are we removing the label: ");
    }
};

var runCommands = function() {
    bitgo.authenticate({username: inputs.user, password: inputs.password, otp: inputs.otp}, function (err, result) {
        if (err) {
            console.dir(err);
            throw new Error("Could not auth!");
        }
        console.log("Logged in!");

        // Now get the wallet
        bitgo.wallets().get({type: 'bitcoin', id: inputs.walletId}, function (err, wallet) {
            if (err) {
                console.log(err);
                process.exit(-1);
            }

            switch (action) {
                case 'list':
                    // Get the labels for the addresses in this wallet
                    wallet.labels({}, function (err, result) {
                        if (err) {
                            console.log(err);
                            process.exit(-1);
                        }
                        if (result.labels) {
                            result.labels.forEach(function (label) {
                                var line = ' ' + label.address + ' : ' + label.label;
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
    });
}

collectInputs()
    .then(runCommands)
    .catch (function(e) {
    console.log(e);
    console.log(e.stack);
});