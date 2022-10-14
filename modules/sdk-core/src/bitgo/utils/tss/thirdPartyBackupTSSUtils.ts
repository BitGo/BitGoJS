import { SerializedKeyPair } from 'openpgp';
import { KeychainsTriplet, IBaseCoin } from '../../baseCoin';
import { BitGoBase } from '../../bitgoBase';
import { ApiKeyShare, Keychain } from '../../keychain';
import { IWallet } from '../../wallet';
import { MpcUtils } from '../mpcUtils';
import * as _ from 'lodash';
import { BitgoHeldBackupKeyShare, IThirdPartyBackupTssUtils } from './baseTypes';

/**
 * BaseTssUtil class which different signature schemes have to extend
 */
export default class ThirdPartyBackupTSSUtils<KeyShare>
  extends MpcUtils
  implements IThirdPartyBackupTssUtils<KeyShare> {
  private _wallet?: IWallet;

  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin, wallet?: IWallet) {
    super(bitgo, baseCoin);
    this._wallet = wallet;
  }

  get wallet(): IWallet {
    if (_.isNil(this._wallet)) {
      throw new Error('Wallet not defined');
    }
    return this._wallet;
  }

  async createBitgoHeldBackupKeyShare(userGpgKey: SerializedKeyPair<string>): Promise<BitgoHeldBackupKeyShare> {
    return await this.bitgo
      .post(this.baseCoin.url('/krs/backupkeys'))
      .send({
        userPub: userGpgKey.publicKey,
      })
      .result();
  }

  createUserKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShares: ApiKeyShare[],
    bitgoKeychain: Keychain,
    passphrase: string,
    originalPasscodeEncryptionCode: string,
    recipientIndex?: number | undefined
  ): Promise<Keychain> {
    throw new Error('Method not implemented.');
  }

  createBitgoKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShares: ApiKeyShare[],
    enterprise: string
  ): Promise<Keychain> {
    throw new Error('Method not implemented.');
  }

  createKeychains(params: {
    passphrase: string;
    enterprise?: string | undefined;
    originalPasscodeEncryptionCode?: string | undefined;
  }): Promise<KeychainsTriplet> {
    throw new Error('Method not implemented.');
  }
}
