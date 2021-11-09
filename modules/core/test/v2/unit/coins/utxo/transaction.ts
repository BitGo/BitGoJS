/**
 * @prettier
 */
import * as bip32 from 'bip32';
import * as utxolib from '@bitgo/utxo-lib';
import { Codes } from '@bitgo/unspents';

import { AbstractUtxoCoin } from '../../../../../src/v2/coins';
import { Unspent } from '../../../../../src/v2/coins/abstractUtxoCoin';
import { getReplayProtectionAddresses } from '../../../../../src/v2/coins/utxo/replayProtection';

import {
  utxoCoins,
  keychains,
  shouldEqualJSON,
  getFixture,
  getUtxoWallet,
  mockUnspent,
  mockUnspentReplayProtection,
  InputScriptType,
  transactionToObj,
  transactionHexToObj,
} from './util';

import {
  FullySignedTransaction,
  HalfSignedUtxoTransaction,
  Keychain,
  WalletSignTransactionOptions,
} from '../../../../../src';

function run(coin: AbstractUtxoCoin, inputScripts: InputScriptType[]) {
  describe(`Transaction ${coin.getChain()} scripts=${inputScripts.join(',')}`, function () {
    const wallet = getUtxoWallet(coin);
    const value = 1e8;

    function getUnspent(scriptType: InputScriptType, index: number): Unspent {
      if (scriptType === 'replayProtection') {
        return mockUnspentReplayProtection(coin.network);
      } else {
        const chain = Codes.forType(scriptType as any).internal;
        return mockUnspent(coin.network, { chain, value, index }, keychains);
      }
    }

    const unspents = inputScripts.map((type, i) => getUnspent(type, i));

    function getSignParams(
      prebuildHex: string,
      privateKey: bip32.BIP32Interface,
      cosigner: bip32.BIP32Interface
    ): WalletSignTransactionOptions {
      const txInfo = { unspents };
      const [userKeychain, backupKeychain, bitgoKeychain] = keychains.map((k) => ({
        pub: k.neutered().toBase58(),
      })) as Keychain[];

      const taprootRedeemIndex = cosigner === keychains[1] ? 1 : cosigner === keychains[2] ? 0 : undefined;

      if (taprootRedeemIndex === undefined) {
        throw new Error(`could not determine taprootRedeemIndex`);
      }

      return {
        txPrebuild: {
          txHex: prebuildHex,
          txInfo,
        },
        prv: privateKey.toBase58(),
        userKeychain,
        backupKeychain,
        bitgoKeychain,
        taprootRedeemIndex,
      };
    }

    function createPrebuildTransaction(): utxolib.bitgo.UtxoTransaction {
      const txb = utxolib.bitgo.createTransactionBuilderForNetwork(coin.network);
      unspents.forEach((u) => {
        const [txid, vin] = u.id.split(':');
        txb.addInput(txid, Number(vin));
      });
      const unspentSum = Math.round(unspents.reduce((sum, u) => sum + u.value, 0));
      const output = coin.generateAddress({ keychains: keychains.map((k) => ({ pub: k.neutered().toBase58() })) });
      txb.addOutput(output.address, unspentSum - 1000);
      return txb.buildIncomplete();
    }

    function createHalfSignedTransaction(
      prebuild: utxolib.bitgo.UtxoTransaction,
      cosigner: bip32.BIP32Interface
    ): Promise<HalfSignedUtxoTransaction> {
      // half-sign with the user key
      return wallet.signTransaction(
        getSignParams(prebuild.toBuffer().toString('hex'), keychains[0], cosigner)
      ) as Promise<HalfSignedUtxoTransaction>;
    }

    async function createFullSignedTransaction(
      halfSigned: HalfSignedUtxoTransaction,
      privateKey: bip32.BIP32Interface
    ): Promise<FullySignedTransaction> {
      return (await wallet.signTransaction({
        ...getSignParams(halfSigned.txHex, privateKey, privateKey),
        isLastSignature: true,
      })) as FullySignedTransaction;
    }

    it('transaction stages have expected values', async function () {
      const fullSign = !inputScripts.some((s) => s === 'replayProtection');
      const prebuild = createPrebuildTransaction();
      const halfSignedUserBackup = await createHalfSignedTransaction(prebuild, keychains[1]);
      const halfSignedUserBitGo = await createHalfSignedTransaction(prebuild, keychains[2]);
      const fullSignedUserBackup = fullSign
        ? await createFullSignedTransaction(halfSignedUserBackup, keychains[1])
        : undefined;
      const fullSignedUserBitGo = fullSign
        ? await createFullSignedTransaction(halfSignedUserBitGo, keychains[2])
        : undefined;
      const transactionSet = {
        prebuild: transactionToObj(prebuild),
        halfSignedUserBackup: transactionHexToObj(halfSignedUserBackup.txHex, coin.network),
        halfSignedUserBitGo: transactionHexToObj(halfSignedUserBitGo.txHex, coin.network),
        fullSignedUserBackup: fullSignedUserBackup
          ? transactionHexToObj(fullSignedUserBackup.txHex, coin.network)
          : undefined,
        fullSignedUserBitGo: fullSignedUserBitGo
          ? transactionHexToObj(fullSignedUserBitGo.txHex, coin.network)
          : undefined,
      };
      shouldEqualJSON(transactionSet, await getFixture(coin, `transactions-${inputScripts.join('-')}`, transactionSet));
    });
  });
}

utxoCoins.forEach((coin) =>
  utxolib.bitgo.outputScripts.scriptTypes2Of3.forEach((type) => {
    if (coin.supportsAddressType(type)) {
      run(coin, [type, type]);

      if (getReplayProtectionAddresses(coin.network).length) {
        run(coin, ['replayProtection', type]);
      }
    }
  })
);
