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

const DUMMY_PRIVATE_KEY = '43e8594854cb53947c4a1a2fab926af11e123f6251dcd5bd0dfb100604186430'; // This dummy private key is used only for fee estimation

/**
 * Function to estimate the fee for a transaction.
 * This function uses the dummy private key exclusively for fee estimation.
 * @param wallet - The wallet instance.
 * @param toAddress - The destination address.
 * @param amount - The amount to transfer.
 * @param seqno - The sequence number for the transaction.
 * @returns The estimated fee for the transaction.
 */

export async function getFeeEstimate(wallet: any, toAddress: string, amount: string, seqno: number): Promise<any> {
  try {
    const secretKey = TonWeb.utils.stringToBytes(DUMMY_PRIVATE_KEY);
    const feeEstimate = await wallet.methods
      .transfer({
        secretKey,
        toAddress,
        amount,
        seqno,
        sendMode: 1,
      })
      .estimateFee();
    return feeEstimate;
  } catch (error) {
    throw new Error(`Failed to estimate fee: ${error.message}`);
  }
}

const utils = new Utils();

export default utils;
