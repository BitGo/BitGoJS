//
// Tests for Bitcoin Transaction
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var Bitcoin = require('../../src/index');
var assert = require('assert');
var fixtureTx = require('./fixtures/transaction.json');

describe('Transaction', function() {
  describe('constructor', function() {
    it("new transaction", function() {
      var transaction = new Bitcoin.Transaction();
      assert.ok(transaction, "create");
    });

    it("addOutputs", function() {
      Bitcoin.setNetwork('testnet');
      var transaction = new Bitcoin.Transaction();
      var addrString = 'mgv5oJf5tv5YifH9xTuneRNEbRdG5ryocq';
      transaction.addOutput(new Bitcoin.Address(addrString), 50);
      transaction.addOutput(new Bitcoin.Address(addrString), 50*1e8);
      transaction.addOutput(new Bitcoin.Address(addrString), 500*1e8);
      transaction.addOutput(new Bitcoin.Address(addrString), 5000*1e8);
      transaction.addOutput(new Bitcoin.Address(addrString), 500000*1e8);
      assert.equal(transaction.outs.length, 5);
      assert.equal(transaction.getTotalOutValue(), 50555000000050);

      var bytes = transaction.serialize();
      assert.ok(bytes, "serialize");
      var tx2 = Bitcoin.Transaction.deserialize(bytes);
      assert.ok(tx2, "deserialize");
      assert.deepEqual(transaction.getHashBytes(), tx2.getHashBytes(), "deserialized matches tx");
      assert.equal(transaction.outs[0].value, 50, '50 satoshi output');
      assert.equal(transaction.outs[1].value, 50*1e8, '50 btc output');
      assert.equal(transaction.outs[2].value, 500*1e8, '500 btc output');
      assert.equal(transaction.outs[3].value, 5000*1e8, '5000 btc output');
      assert.equal(transaction.outs[4].value, 500000*1e8, '500000 btc output');

      transaction.clearOutputs();
      assert.equal(transaction.outs.length, 0);
      assert.equal(transaction.getTotalOutValue(), 0);
    });

    it("addInputs", function() {
      var tx = new Bitcoin.Transaction();
      assert.throws(function() {
        tx.addInput('0cb859105100ebc3344f749c835c7af7d7103ec0d8cbc3d8ccbd5d28c3c36b57', 1);
      });
      var txInput = new Bitcoin.TransactionIn({
        outpoint: {
          hash: "0cb859105100ebc3344f749c835c7af7d7103ec0d8cbc3d8ccbd5d28c3c36b57",
          index: 0
        },
        script: Bitcoin.Script.createOutputScript(new Bitcoin.Address('n1gqLjZbRH1biT5o4qiVMiNig8wcCPQeB9')),
        sequence:  4294967295
      });
      tx.addInput(txInput);
      assert.equal(tx.ins.length, 1);

      tx.clearInputs();
      assert.equal(tx.ins.length, 0);
    });

    it("clone transaction", function() {
      var txData = '0100000001d9fd76d600fdb6b172c133d908a388b8d8573a03f2d9241f06ec09b1f208e6ff00000000fd5d010047304402202d290d07917b6795d1871e01e5762f323a3a3de25c6ad4b22a9072a6add982b402201f32b6e04f01acfccf887f0573c4b14b06c7ed21c58817f1a9d7329c404873f801483045022100eb47049c291ea09041a489f9b1c6783765568503b4d60134f4d3d84024c5ef84022032c85b9d00b760dc909565ba09a6f2526b6ee474fa6f6048be2d954fdb993efd014cc9524104150fcc32bb54a665d000963c790696dccc47993e89ba9ddf3b5f647e54317fa38a0dec77d403ef89089d7ca92c7ac4978c0593496d8bac79239197aa44786c68410455caf1a8af431ebae5f0c533310d2ab18c49880dc03ce75d915fd895f232aa1dcc4fa63db14b9b0889225d5df956cf961413561d922605812b6b6f6969967f6a4104e444d30ec3d7316d21170a6a9d2c5ce22a2dd30ba4aa57b3d0dc33bd8df090ab85e6b7eaef3692b6fdf6b1a2b8b69b1b681613cef648ba7556ea9a0ac2102a1f53aeffffffff02bc080000000000001976a9148b887b2b49891e3eb53bab1c17b313db8a8b502288acb433df000000000017a91408dd67b4a5e221b5664564969d3bcc7520f5599b8700000000';
      var tx = Bitcoin.Transaction.deserialize(Bitcoin.Util.hexToBytes(txData));
      var newTx = new Bitcoin.Transaction(tx);
      assert.equal(Bitcoin.Util.bytesToHex(newTx.serialize()), txData);
    });
  });

  var b2h = function(bytes) { return Bitcoin.Util.bytesToHex(bytes); }
  var h2b = function(hex) { return Bitcoin.Util.hexToBytes(hex); }

  describe('deserialize', function() {
    var tx;
    var serializedTx;
    beforeEach(function() {
      serializedTx = [
        '0100000001344630cbff61fbc362f7e1ff2f11a344c29326e4ee96e78',
        '7dc0d4e5cc02fd069000000004a493046022100ef89701f460e8660c8',
        '0808a162bbf2d676f40a331a243592c36d6bd1f81d6bdf022100d29c0',
        '72f1b18e59caba6e1f0b8cadeb373fd33a25feded746832ec179880c2',
        '3901ffffffff0100f2052a010000001976a914dd40dedd8f7e3746662',
        '4c4dacc6362d8e7be23dd88ac00000000'
      ].join('');
      tx = Bitcoin.Transaction.deserialize(h2b(serializedTx));
    })

    it('returns the original after serialized again', function() {
      var actual = tx.serialize();
      var expected = serializedTx;

      assert.equal(b2h(actual), expected);
    })

    it('does not mutate the input buffer', function() {
      var buffer = h2b(serializedTx);
      Bitcoin.Transaction.deserialize(buffer);

      assert.equal(b2h(buffer), serializedTx);
    })

    it('decodes version correctly', function(){
      assert.equal(tx.version, 1);
    })

    it('decodes locktime correctly', function(){
      assert.equal(tx.locktime, 0);
    })

    it('decodes inputs correctly', function(){
      assert.equal(tx.ins.length, 1);

      var input = tx.ins[0];
      assert.equal(input.sequence, 4294967295);

      assert.equal(input.outpoint.index, 0);
      assert.equal(input.outpoint.hash, "69d02fc05c4e0ddc87e796eee42693c244a3112fffe1f762c3fb61ffcb304634");

      assert.equal(b2h(input.script.buffer),
                   "493046022100ef89701f460e8660c80808a162bbf2d676f40a331a243592c36d6bd1f81d6bdf022100d29c072f1b18e59caba6e1f0b8cadeb373fd33a25feded746832ec179880c23901");
    })

    it('decodes outputs correctly', function(){
      assert.equal(tx.outs.length, 1);

      var output = tx.outs[0];

      assert.equal(output.value, 5000000000);
      
      var script = Bitcoin.Script.createOutputScript(new Bitcoin.Address('n1gqLjZbRH1biT5o4qiVMiNig8wcCPQeB9'));
      assert.deepEqual(output.script, script);
    })

    it('assigns hash to deserialized object', function(){
      var hashHex = "a9d4599e15b53f3eb531608ddb31f48c695c3d0b3538a6bda871e8b34f2f430c";
      assert.equal(b2h(tx.getHashBytes().reverse()), hashHex);
    })

    it('decodes large inputs correctly', function() {
      // transaction has only 1 input
      var tx = new Bitcoin.Transaction();
      var txInput = new Bitcoin.TransactionIn({
        outpoint: {
          hash: "0cb859105100ebc3344f749c835c7af7d7103ec0d8cbc3d8ccbd5d28c3c36b57",
          index: 0
        },
        script: Bitcoin.Script.createOutputScript(new Bitcoin.Address('n1gqLjZbRH1biT5o4qiVMiNig8wcCPQeB9')),
        sequence:  4294967295
      });
      tx.addInput(txInput);
      var txOutput = new Bitcoin.TransactionOut({
        value: 100,
        script: Bitcoin.Script.createOutputScript(new Bitcoin.Address('n1gqLjZbRH1biT5o4qiVMiNig8wcCPQeB9'))
      });
      tx.addOutput(txOutput);

      var buffer = tx.serialize();

      // we're going to replace the 8bit VarInt for tx.ins.length with a stretched 32bit equivalent
      var mutated = [].concat([
        buffer.slice(0, 4),
        [254, 1, 0, 0, 0],
        buffer.slice(5)
      ]);
      mutated = Array.prototype.concat.apply([], mutated);

      // the deserialized-serialized transaction should return to its non-mutated state (== tx)
      var newTx = Bitcoin.Transaction.deserialize(mutated);
      var buffer2 = newTx.serialize();
      assert.deepEqual(buffer, buffer2);
    });
  });

  describe('Verify', function() {
    it('Gavin\'s P2SH test', function() {
      // from: https://gist.github.com/gavinandresen/3966071
      var txData = "0100000001aca7f3b45654c230e0886a57fb988c3044ef5e8f7f39726d305c61d5e818903c00000000fd5d010048304502200187af928e9d155c4b1ac9c1c9118153239aba76774f775d7c1f9c3e106ff33c0221008822b0f658edec22274d0b6ae9de10ebf2da06b1bbdaaba4e50eb078f39e3d78014730440220795f0f4f5941a77ae032ecb9e33753788d7eb5cb0c78d805575d6b00a1d9bfed02203e1f4ad9332d1416ae01e27038e945bc9db59c732728a383a6f1ed2fb99da7a4014cc952410491bba2510912a5bd37da1fb5b1673010e43d2c6d812c514e91bfa9f2eb129e1c183329db55bd868e209aac2fbc02cb33d98fe74bf23f0c235d6126b1d8334f864104865c40293a680cb9c020e7b1e106d8c1916d3cef99aa431a56d253e69256dac09ef122b1a986818a7cb624532f062c1d1f8722084861c5c3291ccffef4ec687441048d2455d2403e08708fc1f556002f1b6cd83f992d085097f9974ab08a28838f07896fbab08f39495e15fa6fad6edbfb1e754e35fa1c7844c41f322a1863d4621353aeffffffff0140420f00000000001976a914ae56b4db13554d321c402db3961187aed1bbed5b88ac00000000";
      var tx = Bitcoin.Transaction.deserialize(Bitcoin.Util.hexToBytes(txData));
      assert.ok(tx, 'parsed transaction');

      assert.equal(tx.ins.length, 1, 'inputs length ok');
      assert.equal(tx.outs.length, 1, 'output length ok');
      assert.equal(tx.outs[0].value, 0.01 * 1e8, 'outputs.value ok');

      assert.equal(tx.verifySignatures(['']), 1, 'signatures verify');
    });
    it ('P2SH signatures', function() {
      var txData = "0100000001dd6e93887a3927b29091702f765f46e4c1a24a287f4bc84fd1fe8c423ea1c36400000000fd5f0100483045022018d16e03bceffde4a44eb82355bd6686db88e45189bbab07a23d94bbb4f8bcc3022100d4e3114c7fc9ef60ec905593eb7fe893095ca5edd526a2bce2d2f79c649cf49a01493046022100ff40b3899deabbdd18351c6cc63e714e5ac7fe8ba98ffc06c07f00fe06b57b45022100af2fed17e496d2278461b390b7395bd736a35bc59c9b075343661a0c0933f6c2014cc9524104c688e3fefa12c5cc9f900ec28fe0e2a2fe2ead93fc37570b6c5713b9474be9e03abb1030a79eec8839bc24f7fac9e860d63c4333d7cc32913baa1e7108280ad34104f86f9979c4787613939a7cb73c2a593e1f57784cc32acfa234f21b22bd631b0aca9061de23476d1a52386481ca71f350ae180fdac3c3bafed05fee70c41710c9410486dea9f8df8ce56403237d40235e06b7b8faca3ce719cf83aaf596d4cc03e3c79dc4d0784619eb7f3339dabfac27f4f07746894a8001df4e24f1a6ae1c6e812453aeffffffff0200e1f505000000001976a91402f13f9da223c6d7eb7680c7df8270f3a363aeb588acf0f00c8f0000000017a9142cfd6634df0dbbe8e02618aaa13de49a4d07d4968700000000";
      var tx = Bitcoin.Transaction.deserialize(Bitcoin.Util.hexToBytes(txData));
      assert.ok(tx, 'parsed transaction');
      assert.equal(tx.verifySignatures(['']), 1, 'signatures verify');
    });

    it('Standard signatures', function() {
      var txData = "010000000109a6b9c2dfb6e079b999fc70253daec45113435f424c2e20a119c00bac10b3f2010000006b483045022100bfc238497465e46ed499a64f5f00e6c8030a3cc937bba333b08ca8aa7ff4fe800220362cb9e93032b5a6e48220813e76f86a01580cd5ff699de973f15499178187910121023d8f23f7ae9b8b76cc497af97cf1172d5bc717146091aca42e1e006e1db04d2cffffffff02404b4c00000000001976a91406911c004633a6fabc2820937660a47e3233127488ac9f3a974a000000001976a9147b76594a27264f6bdd7f0c4a14735aa3421d22fb88ac00000000";
      var tx = Bitcoin.Transaction.deserialize(Bitcoin.Util.hexToBytes(txData));
      assert.ok(tx, 'parsed transaction');

      var inputScripts = ['76a9147b76594a27264f6bdd7f0c4a14735aa3421d22fb88ac'];
      assert.equal(tx.verifySignatures(inputScripts), 1, 'signatures verify');
    });
  });

  describe('signing', function() {
    it('standard tx', function() {
      Bitcoin.setNetwork('prod');
      var prevTxData = '0100000001e0214ebebb0fd3414d3fdc0dbf3b0f4b247a296cafc984558622c3041b0fcc9b010000008b48304502206becda98cecf7a545d1a640221438ff8912d9b505ede67e0138485111099f696022100ccd616072501310acba10feb97cecc918e21c8e92760cd35144efec7622938f30141040cd2d2ce17a1e9b2b3b2cb294d40eecf305a25b7e7bfdafae6bb2639f4ee399b3637706c3d377ec4ab781355add443ae864b134c5e523001c442186ea60f0eb8ffffffff03a0860100000000001976a91400ea3576c8fcb0bc8392f10e23a3425ae24efea888ac40420f00000000001976a91477890e8ec967c5fd4316c489d171fd80cf86997188acf07cd210000000001976a9146fb93c557ee62b109370fd9003e456917401cbfa88ac00000000';
      var txData = '0100000001344630cbff61fbc362f7e1ff2f11a344c29326e4ee96e787dc0d4e5cc02fd069000000004a493046022100ef89701f460e8660c80808a162bbf2d676f40a331a243592c36d6bd1f81d6bdf022100d29c072f1b18e59caba6e1f0b8cadeb373fd33a25feded746832ec179880c23901ffffffff0100f2052a010000001976a914dd40dedd8f7e37466624c4dacc6362d8e7be23dd88ac00000000';
      var tx = new Bitcoin.Transaction();
      var prevTx = new Bitcoin.Transaction.deserialize(Bitcoin.Util.hexToBytes(prevTxData));

      tx.addInput(prevTx, 0);
      tx.addOutput(new Bitcoin.Address('15mMHKL96tWAUtqF3tbVf99Z8arcmnJrr3'), 40000);
      tx.addOutput(new Bitcoin.Address('1Bu3bhwRmevHLAy1JrRB6AfcxfgDG2vXRd'), 50000);

      var key = new Bitcoin.ECKey('L44f7zxJ5Zw4EK9HZtyAnzCYz2vcZ5wiJf9AuwhJakiV4xVkxBeb');
      assert.equal(tx.signWithKey(key), 1);

      var hexScript = Bitcoin.Util.bytesToHex(prevTx.outs[0].script.buffer);

      assert.ok(tx.verifySignatures([hexScript]), 'signatures verify');
    });

    it('with wrong key', function() {
      Bitcoin.setNetwork('prod');
      var prevTxData = '0100000001e0214ebebb0fd3414d3fdc0dbf3b0f4b247a296cafc984558622c3041b0fcc9b010000008b48304502206becda98cecf7a545d1a640221438ff8912d9b505ede67e0138485111099f696022100ccd616072501310acba10feb97cecc918e21c8e92760cd35144efec7622938f30141040cd2d2ce17a1e9b2b3b2cb294d40eecf305a25b7e7bfdafae6bb2639f4ee399b3637706c3d377ec4ab781355add443ae864b134c5e523001c442186ea60f0eb8ffffffff03a0860100000000001976a91400ea3576c8fcb0bc8392f10e23a3425ae24efea888ac40420f00000000001976a91477890e8ec967c5fd4316c489d171fd80cf86997188acf07cd210000000001976a9146fb93c557ee62b109370fd9003e456917401cbfa88ac00000000';
      var txData = '0100000001344630cbff61fbc362f7e1ff2f11a344c29326e4ee96e787dc0d4e5cc02fd069000000004a493046022100ef89701f460e8660c80808a162bbf2d676f40a331a243592c36d6bd1f81d6bdf022100d29c072f1b18e59caba6e1f0b8cadeb373fd33a25feded746832ec179880c23901ffffffff0100f2052a010000001976a914dd40dedd8f7e37466624c4dacc6362d8e7be23dd88ac00000000';
      var tx = new Bitcoin.Transaction();
      var prevTx = new Bitcoin.Transaction.deserialize(Bitcoin.Util.hexToBytes(prevTxData));

      tx.addInput(prevTx, 0);
      tx.addOutput(new Bitcoin.Address('15mMHKL96tWAUtqF3tbVf99Z8arcmnJrr3'), 40000);
      tx.addOutput(new Bitcoin.Address('1Bu3bhwRmevHLAy1JrRB6AfcxfgDG2vXRd'), 50000);

      var key = new Bitcoin.ECKey();
      assert.equal(tx.signWithKey(key), 0);

      var hexScript = Bitcoin.Util.bytesToHex(prevTx.outs[0].script.buffer);

      assert.equal(tx.verifySignatures([hexScript]), 0, 'unsigned');
    });

    it('multisig tx', function() {
      Bitcoin.setNetwork('prod');
      // from: https://gist.github.com/gavinandresen/3966071
      var key1 = new Bitcoin.ECKey('5JaTXbAUmfPYZFRwrYaALK48fN6sFJp4rHqq2QSXs8ucfpE4yQU');
      assert.equal(key1.getPubKeyHex(), '0491BBA2510912A5BD37DA1FB5B1673010E43D2C6D812C514E91BFA9F2EB129E1C183329DB55BD868E209AAC2FBC02CB33D98FE74BF23F0C235D6126B1D8334F86', 'key1 is ok');
      var key2 = new Bitcoin.ECKey('5Jb7fCeh1Wtm4yBBg3q3XbT6B525i17kVhy3vMC9AqfR6FH2qGk');
      assert.equal(key2.getPubKeyHex(), '04865C40293A680CB9C020E7B1E106D8C1916D3CEF99AA431A56D253E69256DAC09EF122B1A986818A7CB624532F062C1D1F8722084861C5C3291CCFFEF4EC6874', 'key2 is ok');
      var key3 = new Bitcoin.ECKey('5JFjmGo5Fww9p8gvx48qBYDJNAzR9pmH5S389axMtDyPT8ddqmw');
      assert.equal(key3.getPubKeyHex(), '048D2455D2403E08708FC1F556002F1B6CD83F992D085097F9974AB08A28838F07896FBAB08F39495E15FA6FAD6EDBFB1E754E35FA1C7844C41F322A1863D46213', 'key3 is ok');

      var multiSigAddress = Bitcoin.Address.createMultiSigAddress([key1.getPub(), key2.getPub(), key3.getPub()], 2);
      assert.equal(multiSigAddress.toString(), '3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC', "Created multisig addr");
      assert.equal(Bitcoin.Util.bytesToHex(multiSigAddress.redeemScript), '52410491bba2510912a5bd37da1fb5b1673010e43d2c6d812c514e91bfa9f2eb129e1c183329db55bd868e209aac2fbc02cb33d98fe74bf23f0c235d6126b1d8334f864104865c40293a680cb9c020e7b1e106d8c1916d3cef99aa431a56d253e69256dac09ef122b1a986818a7cb624532f062c1d1f8722084861c5c3291ccffef4ec687441048d2455d2403e08708fc1f556002f1b6cd83f992d085097f9974ab08a28838f07896fbab08f39495e15fa6fad6edbfb1e754e35fa1c7844c41f322a1863d4621353ae', "computed correct redeem script");

      var txData = "010000000189632848f99722915727c5c75da8db2dbf194342a0429828f66ff88fab2af7d60000000000ffffffff0140420f000000000017a914f815b036d9bbbce5e9f2a00abd1bf3dc91e955108700000000"
      var tx = Bitcoin.Transaction.deserialize(Bitcoin.Util.hexToBytes(txData));
      assert.ok(tx, 'created unsigned tx');
      assert.equal(tx.verifySignatures(['']), false, 'unsigned');
      assert.equal(tx.ins.length, 1, '1 input');

      // We need to add the script to the inputs so that signing can work.
      tx.ins[0].script = new Bitcoin.Script(Bitcoin.Util.hexToBytes('a914f815b036d9bbbce5e9f2a00abd1bf3dc91e9551087'));

      var sigCount = tx.signWithMultiSigScript(key1, new Bitcoin.Script(multiSigAddress.redeemScript));
      assert.equal(sigCount, 1, 'applied first sig');

      sigCount = tx.signWithMultiSigScript(key1, new Bitcoin.Script(multiSigAddress.redeemScript));
      assert.equal(sigCount, 0, 'duplicate sig failed');

      var sigCount = tx.signWithMultiSigScript(key2, new Bitcoin.Script(multiSigAddress.redeemScript));
      assert.equal(sigCount, 1, 'applied second sig');
    });
  });

});


