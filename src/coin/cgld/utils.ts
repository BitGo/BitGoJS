import { recoverTransaction } from '@celo/contractkit/lib/utils/signing-utils';
import { RLP } from 'ethers/utils';
import BigNumber from 'bignumber.js';
import { TxData } from '../eth/iface';
import { ParseTransactionError } from '../baseCoin/errors';

/**
 * Celo transaction deserialization based on code
 * from @celo/contractkit/lib/utils/signing-utils
 * github: https://github.com/celo-org/celo-monorepo/tree/master/packages/contractkit
 *
 * @param {string} serializedTx the serialized transaction
 * @returns {TxData} the deserialized transaction
 */
export function deserialize(serializedTx: string): TxData {
  try {
    const decodedTx = RLP.decode(serializedTx);
    decodedTx.splice(3, 3); //remove unused feeCurrency, gatewayFeeRecipient and gatewayFee
    const [nonce, gasPrice, gasLimit, to, value, data, v, r, s] = decodedTx;
    let chainId = v;
    let from;
    if (r !== '0x' && s !== '0x') {
      const [tx, sender] = recoverTransaction(serializedTx);
      from = sender;
      chainId = tx.chainId;
    }
    const celoTx: TxData = {
      nonce: nonce.toLowerCase() === '0x' ? 0 : parseInt(nonce, 16),
      gasPrice: gasPrice.toLowerCase() === '0x' ? '0' : new BigNumber(gasPrice, 16).toString(),
      gasLimit: gasLimit.toLowerCase() === '0x' ? '0' : new BigNumber(gasLimit, 16).toString(),
      value: value.toLowerCase() === '0x' ? '0' : new BigNumber(value, 16).toString(),
      data,
      chainId,
      from,
      v,
      r,
      s,
    };

    if (to !== '0x') {
      celoTx.to = to;
    }

    return celoTx;
  } catch {
    throw new ParseTransactionError('Invalid serialized transaction');
  }
}
