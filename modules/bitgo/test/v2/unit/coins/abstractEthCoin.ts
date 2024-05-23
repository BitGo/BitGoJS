/**
 * @prettier
 */

import * as _ from 'lodash';
import * as should from 'should';
import { bip32 } from '@bitgo/utxo-lib';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src/bitgo';
import { getBuilder, Eth } from '@bitgo/account-lib';
import * as ethAbi from 'ethereumjs-abi';
import * as ethUtil from 'ethereumjs-util';
import { coins, ContractAddressDefinedToken } from '@bitgo/statics';
import { BaseTransaction, TransactionType } from '@bitgo/sdk-core';

describe('ETH-like coins', () => {
  _.forEach(['tetc', 'tcelo', 'trbtc'], (coinName) => {
    describe(`${coinName}`, () => {
      let bitgo;
      let basecoin;
      let coin;

      const sendMultisigTypes = ['address', 'uint256', 'bytes', 'uint256', 'uint256', 'bytes'];
      const sendMultisigTokenTypes = ['address', 'uint256', 'address', 'uint256', 'uint256', 'bytes'];
      const signatureSaltMap = {
        native: {
          tetc: 'ETC',
          tcelo: 'CELO',
          trbtc: 'RSK',
        },
        token: {
          tetc: 'ETC-ERC20',
          tcelo: 'CELO-ERC20',
          trbtc: 'RSK-ERC20',
        },
      };

      /**
       * Get the operation hash that the user key signed
       * @param tx The transaction to calculate operatino hash from
       * @return The operation hash
       */
      const getOperationHash = (tx: BaseTransaction): string => {
        const { data } = tx.toJson();
        const { tokenContractAddress, expireTime, sequenceId, amount, to } = Eth.Utils.decodeTransferData(data);

        if (coin instanceof ContractAddressDefinedToken) {
          return ethAbi.soliditySHA3(
            ...[
              ['string', 'address', 'uint', 'address', 'uint', 'uint'],
              [
                signatureSaltMap.token[coinName],
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore BG-34579: known compatibility issue with @types/ethereumjs-util
                new ethUtil.BN(ethUtil.stripHexPrefix(to), 16),
                amount,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore BG-34579: known compatibility issue with @types/ethereumjs-util
                new ethUtil.BN(ethUtil.stripHexPrefix(tokenContractAddress), 16),
                expireTime,
                sequenceId,
              ],
            ]
          );
        } else {
          return ethAbi.soliditySHA3(
            ...[
              ['string', 'address', 'uint', 'uint', 'uint'],
              [
                signatureSaltMap.native[coinName],
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore BG-34579: known compatibility issue with @types/ethereumjs-util
                new ethUtil.BN(ethUtil.stripHexPrefix(to), 16),
                amount,
                expireTime,
                sequenceId,
              ],
            ]
          );
        }
      };

      /**
       * Recover the signing address of a signature
       * @param tx The transaction to recover a signer from
       * @return The eth address of the signer
       */
      const recoverSigner = function (tx: BaseTransaction) {
        const { signature } = Eth.Utils.decodeTransferData(tx.toJson().data);
        const { v, r, s } = ethUtil.fromRpcSig(signature);
        const operationHash = getOperationHash(tx);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore known compatibility issue with @types/ethereumjs-util
        const pubKeyBuffer = ethUtil.ecrecover(operationHash, v, r, s);
        return ethUtil.bufferToHex(ethUtil.pubToAddress(ethUtil.importPublic(pubKeyBuffer)));
      };

      /**
       * Build an unsigned account-lib multi-signature send transactino
       * @param destination The destination address of the transaction
       * @param contractAddress The address of the smart contract processing the transaction
       * @param contractSequenceId The sequence id of the contract
       * @param nonce The nonce of the sending address
       * @param expireTime The expire time of the transaction
       * @param amount The amount to send to the recipient
       * @param gasPrice The gas price of the transaction
       * @param gasLimit The gas limit of the transaction
       */
      const buildUnsignedTransaction = async function ({
        destination,
        contractAddress,
        contractSequenceId = 1,
        nonce = 0,
        expireTime = Math.floor(new Date().getTime() / 1000),
        amount = '100000',
        gasPrice = '10000',
        gasLimit = '20000',
      }) {
        const txBuilder: Eth.TransactionBuilder = getBuilder(coinName) as Eth.TransactionBuilder;
        txBuilder.type(TransactionType.Send);
        txBuilder.fee({
          fee: gasPrice,
          gasLimit: gasLimit,
        });
        txBuilder.counter(nonce);
        txBuilder.contract(contractAddress);
        const transferBuilder = txBuilder.transfer() as Eth.TransferBuilder;

        transferBuilder
          .coin(coinName)
          .expirationTime(expireTime)
          .amount(amount)
          .to(destination)
          .contractSequenceId(contractSequenceId);

        return await txBuilder.build();
      };

      before(function () {
        bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
        bitgo.initializeTestVars();
        basecoin = bitgo.coin(coinName);
        coin = coins.get(coinName);
      });

      describe('Is valid address', () => {
        it('Should find valid addresses to be valid', () => {
          basecoin.isValidAddress('0x2af9152fc4afd89a8124731bdfb8710c8751f3ed').should.equal(true);
          basecoin.isValidAddress('0x2af9152FC4afd89A8124731BdFb8710c8751f3eD').should.equal(true);
        });

        it('Should find invalid addresses to be invalid', () => {
          basecoin.isValidAddress('0x2af9152fc4afd89a8124731bdfb8710c8751f3edd').should.equal(false);
          basecoin.isValidAddress('0x2af9152fc4afd89a8124731bdfb8710c8751f3e').should.equal(false);
          basecoin.isValidAddress('2af9152fc4afd89a8124731bdfb8710c8751f3ed').should.equal(false);
          basecoin.isValidAddress('notanaddress').should.equal(false);
          basecoin.isValidAddress('not an address').should.equal(false);
          basecoin.isValidAddress('3KgL6DTUb6gEoqSwMMJzyf96ekH8oZtWtZ').should.equal(false);
        });

        xit('Should not throw when verifying valid addresses', function () {
          // FIXME(BG-43225): not implemented
        });

        xit('Should throw when verifying invalid addresses', function () {
          // FIXME(BG-43225): not implemented
        });
      });

      describe('Is valid pub', () => {
        it('Should find valid pubs to be valid', () => {
          basecoin
            .isValidPub(
              'xpub661MyMwAqRbcF9Nc7TbBo1rZAagiWEVPWKbDKThNG8zqjk76HAKLkaSbTn6dK2dQPfuD7xjicxCZVWvj67fP5nQ9W7QURmoMVAX8m6jZsGp'
            )
            .should.equal(true);
          basecoin
            .isValidPub(
              '04614C070C6D1C18A6A2D6EE2BBBE1FF291A0ABA8ED6B55023C03BE42583AC23A743BCB5EF9DB59E14FD7025A9A5D93C6BA89EEFEB40215BF24933D4F2935D14CB'
            )
            .should.equal(true);
          basecoin.isValidPub('034f355bdcb7cc0af728ef3cceb9615d90684bb5b2ca5f859ab0f0b704075871aa').should.equal(true);
        });

        it('Should find invalid pubs to be invalid', () => {
          basecoin.isValidPub('0x2af9152fc4afd89a8124731bdfb8710c8751f3e').should.equal(false);
          basecoin.isValidPub('0x2af9152fc4afd89a8124731bdfb8710c8751f3ed').should.equal(false);
          basecoin.isValidPub('2af9152fc4afd89a8124731bdfb8710c8751f3ed').should.equal(false);
          basecoin.isValidPub('notapub').should.equal(false);
          basecoin.isValidPub('not a pub').should.equal(false);
          basecoin.isValidPub('3KgL6DTUb6gEoqSwMMJzyf96ekH8oZtWtZ').should.equal(false);
        });
      });

      describe('Generate keypair', () => {
        it('Should generate valid keypair without seed', () => {
          const { pub, prv } = basecoin.generateKeyPair();
          basecoin.isValidPub(pub).should.equal(true);
          const bitgoKey = bip32.fromBase58(prv);
          basecoin.isValidPub(bitgoKey.neutered().toBase58()).should.equal(true);
        });

        it('Should generate valid keypair with seed', () => {
          const seed = Buffer.from('c3b09c24731be2851b641d9d5b3f60fa129695c24071768d15654bea207b7bb6', 'hex');
          const { pub, prv } = basecoin.generateKeyPair(seed);
          basecoin.isValidPub(pub).should.equal(true);
          const bitgoKey = bip32.fromBase58(prv);
          basecoin.isValidPub(bitgoKey.neutered().toBase58()).should.equal(true);
        });
      });

      describe('Sign transaction:', () => {
        const xprv =
          'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2';

        it('should sign transaction internally', async function () {
          const key = new Eth.KeyPair({ prv: xprv });
          const destination = '0xfaa8f14f46a99eb439c50e0c3b835cc21dad51b4';
          const contractAddress = '0x9e2c5712ab4caf402a98c4bf58c79a0dfe718ad1';
          const amount = '100000';
          const inputExpireTime = Math.floor(new Date().getTime() / 1000);
          const inputSequenceId = 1;

          const unsignedTransaction = await buildUnsignedTransaction({
            destination,
            contractAddress,
            amount,
            expireTime: inputExpireTime,
            contractSequenceId: inputSequenceId,
          });

          const tx = await basecoin.signTransaction({
            prv: key.getKeys().prv,
            txPrebuild: {
              txHex: unsignedTransaction.toBroadcastFormat(),
            },
          });

          const txBuilder = basecoin.getTransactionBuilder();
          txBuilder.from(tx.halfSigned.txHex);
          const transaction = await txBuilder.build();
          const txJson = transaction.toJson();
          txJson.to.should.equal(contractAddress);

          let decodedData;
          let recipient;
          let value;
          let data;
          let expireTime;
          let sequenceId;
          if (coin instanceof ContractAddressDefinedToken) {
            decodedData = ethAbi.rawDecode(sendMultisigTokenTypes, Buffer.from(txJson.data.slice(10), 'hex'));
            [recipient, value /* tokenContractAddress */, , expireTime, sequenceId] = decodedData;
            data = Buffer.from('');
          } else {
            decodedData = ethAbi.rawDecode(sendMultisigTypes, Buffer.from(txJson.data.slice(10), 'hex'));
            [recipient, value, data, expireTime, sequenceId] = decodedData;
          }
          ethUtil.addHexPrefix(recipient).should.equal(destination);
          value.toString(10).should.equal(amount);
          inputExpireTime.should.equal(parseInt(expireTime.toString('hex'), 16));
          inputSequenceId.should.equal(parseInt(sequenceId.toString('hex'), 16));
          data.length.should.equal(0);

          const recoveredAddress = recoverSigner(transaction);
          recoveredAddress.should.equal(key.getAddress());
        });

        it('should sign transaction internally with an xprv', async function () {
          const key = new Eth.KeyPair({ prv: xprv });
          const destination = '0xfaa8f14f46a99eb439c50e0c3b835cc21dad51b4';
          const contractAddress = '0x9e2c5712ab4caf402a98c4bf58c79a0dfe718ad1';
          const amount = '100000';
          const inputExpireTime = Math.floor(new Date().getTime() / 1000);
          const inputSequenceId = 1;

          const unsignedTransaction = await buildUnsignedTransaction({
            destination,
            contractAddress,
            amount,
            expireTime: inputExpireTime,
            contractSequenceId: inputSequenceId,
          });

          const tx = await basecoin.signTransaction({
            prv: xprv,
            txPrebuild: {
              txHex: unsignedTransaction.toBroadcastFormat(),
            },
          });

          const txBuilder = basecoin.getTransactionBuilder();
          txBuilder.from(tx.halfSigned.txHex);
          const transaction = await txBuilder.build();
          const txJson = transaction.toJson();
          txJson.to.should.equal(contractAddress);

          let decodedData;
          let recipient;
          let value;
          let data;
          let expireTime;
          let sequenceId;
          if (coin instanceof ContractAddressDefinedToken) {
            decodedData = ethAbi.rawDecode(sendMultisigTokenTypes, Buffer.from(txJson.data.slice(10), 'hex'));
            [recipient, value /* tokenContractAddress */, , expireTime, sequenceId] = decodedData;
            data = Buffer.from('');
          } else {
            decodedData = ethAbi.rawDecode(sendMultisigTypes, Buffer.from(txJson.data.slice(10), 'hex'));
            [recipient, value, data, expireTime, sequenceId] = decodedData;
          }

          ethUtil.addHexPrefix(recipient).should.equal(destination);
          value.toString(10).should.equal(amount);
          inputExpireTime.should.equal(parseInt(expireTime.toString('hex'), 16));
          inputSequenceId.should.equal(parseInt(sequenceId.toString('hex'), 16));
          data.length.should.equal(0);

          const recoveredAddress = recoverSigner(transaction);
          recoveredAddress.should.equal(key.getAddress());
        });

        it('should sign a half signed transaction', async function () {
          const key = new Eth.KeyPair({ prv: xprv });
          const destination = '0xfaa8f14f46a99eb439c50e0c3b835cc21dad51b4';
          const contractAddress = '0x9e2c5712ab4caf402a98c4bf58c79a0dfe718ad1';
          const amount = '100000';
          const inputExpireTime = Math.floor(new Date().getTime() / 1000);
          const inputSequenceId = 1;

          const unsignedTransaction = await buildUnsignedTransaction({
            destination,
            contractAddress,
            amount,
            expireTime: inputExpireTime,
            contractSequenceId: inputSequenceId,
          });

          const tx = await basecoin.signTransaction({
            prv: key.getKeys().prv,
            txPrebuild: {
              txHex: unsignedTransaction.toBroadcastFormat(),
            },
          });

          const fullySignedTx = await basecoin.signTransaction({
            prv: key.getKeys().prv,
            txPrebuild: {
              txHex: tx.halfSigned.txHex,
            },
          });

          fullySignedTx.halfSigned.recipients.length.should.equal(1);
          fullySignedTx.halfSigned.recipients[0].address.should.equal(destination);
          fullySignedTx.halfSigned.recipients[0].amount.should.equal(amount);

          const txBuilder = basecoin.getTransactionBuilder();
          txBuilder.from(fullySignedTx.halfSigned.txHex);
          const transaction = await txBuilder.build();
          const txJson = transaction.toJson();
          txJson.to.should.equal(contractAddress);

          let decodedData;
          let recipient;
          let value;
          let data;
          let expireTime;
          let sequenceId;
          if (coin instanceof ContractAddressDefinedToken) {
            decodedData = ethAbi.rawDecode(sendMultisigTokenTypes, Buffer.from(txJson.data.slice(10), 'hex'));
            [recipient, value /* tokenContractAddress */, , expireTime, sequenceId] = decodedData;
            data = Buffer.from('');
          } else {
            decodedData = ethAbi.rawDecode(sendMultisigTypes, Buffer.from(txJson.data.slice(10), 'hex'));
            [recipient, value, data, expireTime, sequenceId] = decodedData;
          }

          ethUtil.addHexPrefix(recipient).should.equal(destination);
          value.toString(10).should.equal(amount);
          inputExpireTime.should.equal(parseInt(expireTime.toString('hex'), 16));
          inputSequenceId.should.equal(parseInt(sequenceId.toString('hex'), 16));
          data.length.should.equal(0);

          const recoveredAddress = recoverSigner(transaction);
          recoveredAddress.should.equal(key.getAddress());
        });

        it('should fail to sign transaction with invalid tx hex', async function () {
          const key = new Eth.KeyPair({ prv: xprv });
          await basecoin
            .signTransaction({
              prv: key.getKeys().prv,
              txPrebuild: {
                txHex: '0xinvalid',
              },
            })
            .should.be.rejected();
        });
      });

      describe('Explain transaction:', () => {
        const xprv =
          'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2';

        it('should fail if the params object is missing parameters', async function () {
          const explainParams = {
            feeInfo: { fee: 1 },
            txHex: null,
          };
          await basecoin.explainTransaction(explainParams).should.be.rejectedWith('missing explain tx parameters');
        });

        it('explain an unsigned transfer transaction', async function () {
          const destination = '0xfaa8f14f46a99eb439c50e0c3b835cc21dad51b4';
          const contractAddress = '0x9e2c5712ab4caf402a98c4bf58c79a0dfe718ad1';

          const unsignedTransaction = await buildUnsignedTransaction({
            destination,
            contractAddress,
          });

          const explainParams = {
            halfSigned: {
              txHex: unsignedTransaction.toBroadcastFormat(),
            },
            feeInfo: { fee: 1 },
          };
          const explanation = await basecoin.explainTransaction(explainParams);
          should.exist(explanation.id);
          // TODO check other fields once account-lib properly explains transaction
        });

        it('explain a signed transfer transaction', async function () {
          const key = new Eth.KeyPair({ prv: xprv });
          const destination = '0xfaa8f14f46a99eb439c50e0c3b835cc21dad51b4';
          const contractAddress = '0x9e2c5712ab4caf402a98c4bf58c79a0dfe718ad1';

          const unsignedTransaction = await buildUnsignedTransaction({
            destination,
            contractAddress,
          });

          const signedTx = await basecoin.signTransaction({
            prv: key.getKeys().prv,
            txPrebuild: {
              txHex: unsignedTransaction.toBroadcastFormat(),
            },
          });

          const explainParams = {
            txHex: signedTx.halfSigned.txHex,
            feeInfo: { fee: 1 },
          };
          const explanation = await basecoin.explainTransaction(explainParams);
          should.exist(explanation.id);
          // TODO check other fields once account-lib properly explains transaction
        });
      });
    });
  });
});
