import { BaseUtils, isValidEd25519PublicKey } from '@bitgo/sdk-core';
import TonWeb from 'tonweb';

export class Utils implements BaseUtils {
  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    try {
      if (address.length != 48) {
        return false;
      }
      Buffer.from(address, 'base64');
      return true;
    } catch (e) {
      return false;
    }
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    try {
      return Buffer.from(hash, 'base64').length === 32;
    } catch (e) {
      return false;
    }
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidPublicKey(key: string): boolean {
    return isValidEd25519PublicKey(key);
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    try {
      return Buffer.from(txId, 'base64').length === 32;
    } catch (e) {
      return false;
    }
  }

  async getAddressFromPublicKey(publicKey: string, bounceable = true, isUserFriendly = true): Promise<string> {
    const tonweb = new TonWeb(new TonWeb.HttpProvider(''));
    const WalletClass = tonweb.wallet.all['v4R2'];
    const wallet = new WalletClass(tonweb.provider, {
      publicKey: TonWeb.utils.hexToBytes(publicKey),
      wc: 0,
    });
    const address = await wallet.getAddress();
    return address.toString(isUserFriendly, true, bounceable);
  }

  getAddress(address: string, bounceable = true): string {
    if (bounceable) {
      return new TonWeb.Address(address).isBounceable
        ? address
        : new TonWeb.Address(address).toString(true, true, bounceable);
    } else {
      return new TonWeb.Address(address).isBounceable
        ? new TonWeb.Address(address).toString(true, true, bounceable)
        : address;
    }
  }

  async getMessageHashFromData(data: string): Promise<string> {
    const cell = TonWeb.boc.Cell.oneFromBoc(TonWeb.utils.base64ToBytes(data));
    // this is need to be confirmed by ton team
    const message = cell.refs[0].refs[0];
    const hash = TonWeb.utils.bytesToBase64(await message.hash());
    return hash.toString();
  }

  getRawWalletAddressFromCell(data: string): string {
    const cell = TonWeb.boc.Cell.oneFromBoc(TonWeb.utils.base64ToBytes(data));
    const slice = (cell as any).beginParse();
    const address = slice.loadAddress();
    return address.toString();
  }
}

const utils = new Utils();

export default utils;
