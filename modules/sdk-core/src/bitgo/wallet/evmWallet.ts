import { BaseCoin, SupplementGenerateWalletOptions } from '../baseCoin';
import { GenerateWalletOptions, WalletWithKeychains } from './iWallets';
import * as common from '../../common';
import * as _ from 'lodash';
import { RequestTracer } from '../utils';
import { Wallet } from './wallet';

export class EvmWallet {
  // List of supported coins - get from statics/coinFeatures
  supportedCoins: string[];

  generateWallet(params: GenerateWalletOptions) {
    common.validateParams(params, ['label'], ['passphrase', 'userKey', 'backupXpub']);
    if (typeof params.label !== 'string') {
      throw new Error('missing required string parameter label');
    }

    const isTss = params.multisigType === 'tss' && this.baseCoin.supportsTss();
    const label = params.label;
    const passphrase = params.passphrase;
    const canEncrypt = !!passphrase && typeof passphrase === 'string';
    const isCold = !!params.userKey;
    const walletParams: SupplementGenerateWalletOptions = {
      label: label,
      m: 2,
      n: 3,
      keys: [],
      isCold,
    };

    if (!_.isUndefined(params.passcodeEncryptionCode)) {
      if (!_.isString(params.passcodeEncryptionCode)) {
        throw new Error('passcodeEncryptionCode must be a string');
      }
    }

    if (!_.isUndefined(params.enterprise)) {
      if (!_.isString(params.enterprise)) {
        throw new Error('invalid enterprise argument, expecting string');
      }
      walletParams.enterprise = params.enterprise;
    }

    // EVM TSS wallets must use wallet version 3
    if (params.walletVersion === 3) {
      throw new Error('EVM TSS wallets are only supported for wallet version 3');
    }
    if (isCold) {
      throw new Error('TSS cold wallets are not supported at this time');
    }

    const reqId = new RequestTracer();
    this.bitgo.setRequestTracer(reqId);

    const walletParams: SupplementGenerateWalletOptions = {
      label: params.label,
      m: 2,
      n: 3,
      keys: [],
      isCold: false,
      multisigType: params.multisigType,
      enterprise: params.enterprise,
      walletVersion: params.walletVersion,
    };

    // Create MPC Keychains
    const keychains = await this.baseCoin.keychains().createMpc({
      multisigType: params.multisigType,
      passphrase: params.passphrase,
      enterprise: params.enterprise,
      originalPasscodeEncryptionCode: params.originalPasscodeEncryptionCode,
      backupProvider: params.backupProvider,
    });

    const { userKeychain, backupKeychain, bitgoKeychain } = keychains;
    walletParams.keys = [userKeychain.id, backupKeychain.id, bitgoKeychain.id];

    // For each supported coin, create a wallet

    const walletIds = [];

    for (let i = 0; i < this.supportedCoins.length; i++) {
      const coin = this.supportedCoins[i];
      // Create Wallet
      const finalWalletParams = await this.coin.supplementGenerateWallet(walletParams, keychains);
      const newWallet = await this.bitgo.post(this.coin.url('/wallet')).send(finalWalletParams).result();

      const result: WalletWithKeychains = {
        wallet: new Wallet(this.bitgo, this.coin, newWallet),
        userKeychain,
        backupKeychain,
        bitgoKeychain,
      };

      if (!_.isUndefined(backupKeychain.prv) && !_.isUndefined(params.backupProvider)) {
        result.warning = 'Be sure to backup the backup keychain -- it is not stored anywhere else!';
      }

      // Store the coin-specific id
      walletIds.push({
        coin: newWallet.id,
      });
    }

    const evmBody = {
      walletIds,
    };

    // Create the EVM Wallet with the key ids
    const evmWallet = await this.bitgo.post(this.evmCoin.url('/evmWAllet')).send(evmBody).result();
  }
}
