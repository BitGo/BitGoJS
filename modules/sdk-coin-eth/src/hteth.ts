import { BaseCoin, BitGoBase, getIsUnsignedSweep, Util } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { Eth } from './eth';
import { bip32 } from '@bitgo/secp256k1';
import {
  KeyPair as KeyPairLib,
  OfflineVaultTxInfo,
  optionalDeps,
  RecoverOptions,
  RecoveryInfo,
  SignedTransaction,
  SignTransactionOptions,
  TransactionBuilder,
  TransferBuilder,
} from '@bitgo/abstract-eth';
import { BigNumber } from 'bignumber.js';
import _ from 'lodash';

export class Hteth extends Eth {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Hteth(bitgo, staticsCoin);
  }

  protected async recoverEthLike(params: RecoverOptions): Promise<RecoveryInfo | OfflineVaultTxInfo> {
    // bitgoFeeAddress is only defined when it is a evm cross chain recovery
    // as we use fee from this wrong chain address for the recovery txn on the correct chain.
    if (params.bitgoFeeAddress) {
      return this.recoverEthLikeforEvmBasedRecovery(params);
    }

    this.validateRecoveryParams(params);
    const isUnsignedSweep = params.isUnsignedSweep ?? getIsUnsignedSweep(params);

    // Clean up whitespace from entered values
    let userKey = params.userKey.replace(/\s/g, '');
    const backupKey = params.backupKey.replace(/\s/g, '');
    const gasLimit = new optionalDeps.ethUtil.BN(this.setGasLimit(params.gasLimit));
    const gasPrice = params.eip1559
      ? new optionalDeps.ethUtil.BN(params.eip1559.maxFeePerGas)
      : new optionalDeps.ethUtil.BN(this.setGasPrice(params.gasPrice));

    if (!userKey.startsWith('xpub') && !userKey.startsWith('xprv')) {
      try {
        userKey = this.bitgo.decrypt({
          input: userKey,
          password: params.walletPassphrase,
        });
      } catch (e) {
        throw new Error(`Error decrypting user keychain: ${e.message}`);
      }
    }
    let backupKeyAddress;
    let backupSigningKey;
    if (isUnsignedSweep) {
      const backupHDNode = bip32.fromBase58(backupKey);
      backupSigningKey = backupHDNode.publicKey;
      backupKeyAddress = `0x${optionalDeps.ethUtil.publicToAddress(backupSigningKey, true).toString('hex')}`;
    } else {
      // Decrypt backup private key and get address
      let backupPrv;

      try {
        backupPrv = this.bitgo.decrypt({
          input: backupKey,
          password: params.walletPassphrase,
        });
      } catch (e) {
        throw new Error(`Error decrypting backup keychain: ${e.message}`);
      }

      const keyPair = new KeyPairLib({ prv: backupPrv });
      backupSigningKey = keyPair.getKeys().prv;
      if (!backupSigningKey) {
        throw new Error('no private key');
      }
      backupKeyAddress = keyPair.getAddress();
    }

    const backupKeyNonce = await this.getAddressNonce(backupKeyAddress, params.apiKey);
    // get balance of backupKey to ensure funds are available to pay fees
    const backupKeyBalance = await this.queryAddressBalance(backupKeyAddress, params.apiKey);
    const totalGasNeeded = gasPrice.mul(gasLimit);

    const weiToGwei = 10 ** 9;
    if (backupKeyBalance.lt(totalGasNeeded)) {
      throw new Error(
        `Backup key address ${backupKeyAddress} has balance ${(backupKeyBalance / weiToGwei).toString()} Gwei.` +
          `This address must have a balance of at least ${(totalGasNeeded / weiToGwei).toString()}` +
          ` Gwei to perform recoveries. Try sending some funds to this address then retry.`
      );
    }

    // get balance of wallet
    const txAmount = await this.queryAddressBalance(params.walletContractAddress, params.apiKey);
    if (new BigNumber(txAmount).isLessThanOrEqualTo(0)) {
      throw new Error('Wallet does not have enough funds to recover');
    }

    // build recipients object
    const recipients = [
      {
        address: params.recoveryDestination,
        amount: txAmount.toString(10),
      },
    ];

    // Get sequence ID using contract call
    // we need to wait between making two explorer api calls to avoid getting banned
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const sequenceId = await this.querySequenceId(params.walletContractAddress, params.apiKey);

    let operationHash, signature;
    // Get operation hash and sign it
    if (!isUnsignedSweep) {
      operationHash = this.getOperationSha3ForExecuteAndConfirm(recipients, this.getDefaultExpireTime(), sequenceId);
      signature = Util.ethSignMsgHash(operationHash, Util.xprvToEthPrivateKey(userKey));

      try {
        Util.ecRecoverEthAddress(operationHash, signature);
      } catch (e) {
        throw new Error('Invalid signature');
      }
    }

    const txInfo = {
      recipient: recipients[0],
      expireTime: this.getDefaultExpireTime(),
      contractSequenceId: sequenceId,
      operationHash: operationHash,
      signature: signature,
      gasLimit: gasLimit.toString(10),
    };

    const txBuilder = this.getTransactionBuilder() as TransactionBuilder;
    txBuilder.counter(backupKeyNonce);
    txBuilder.contract(params.walletContractAddress);
    let txFee;
    if (params.eip1559) {
      txFee = {
        eip1559: {
          maxPriorityFeePerGas: params.eip1559.maxPriorityFeePerGas,
          maxFeePerGas: params.eip1559.maxFeePerGas,
        },
      };
    } else {
      txFee = { fee: gasPrice.toString() };
    }
    txBuilder.fee({
      ...txFee,
      gasLimit: gasLimit.toString(),
    });
    const transferBuilder = txBuilder.transfer() as TransferBuilder;
    transferBuilder
      .coin(this.staticsCoin?.name as string)
      .amount(recipients[0].amount)
      .contractSequenceId(sequenceId)
      .expirationTime(this.getDefaultExpireTime())
      .to(params.recoveryDestination);

    const tx = await txBuilder.build();
    if (isUnsignedSweep) {
      const response: OfflineVaultTxInfo = {
        txHex: tx.toBroadcastFormat(),
        userKey,
        backupKey,
        coin: this.getChain(),
        gasPrice: optionalDeps.ethUtil.bufferToInt(gasPrice).toFixed(),
        gasLimit,
        recipients: [txInfo.recipient],
        walletContractAddress: tx.toJson().to,
        amount: txInfo.recipient.amount,
        backupKeyNonce,
        eip1559: params.eip1559,
      };
      _.extend(response, txInfo);
      response.nextContractSequenceId = response.contractSequenceId;
      return response;
    }

    txBuilder
      .transfer()
      .coin(this.staticsCoin?.name as string)
      .key(new KeyPairLib({ prv: userKey }).getKeys().prv as string);
    txBuilder.sign({ key: backupSigningKey });

    const signedTx = await txBuilder.build();

    return {
      id: signedTx.toJson().id,
      tx: signedTx.toBroadcastFormat(),
    };
  }

  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    // Normally the SDK provides the first signature for an EthLike tx, but occasionally it provides the second and final one.
    if (params.isLastSignature) {
      // In this case when we're doing the second (final) signature, the logic is different.
      return await this.signFinalEthLike(params);
    }
    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(params.txPrebuild.txHex);
    txBuilder
      .transfer()
      .coin(this.staticsCoin?.name as string)
      .key(new KeyPairLib({ prv: params.prv }).getKeys().prv!);
    if (params.walletVersion) {
      txBuilder.walletVersion(params.walletVersion);
    }
    const transaction = await txBuilder.build();

    // In case of tx with contract data from a custodial wallet, we are running into an issue
    // as halfSigned is not having the data field. So, we are adding the data field to the halfSigned tx
    let recipients = params.txPrebuild.recipients || params.recipients;
    if (recipients === undefined) {
      recipients = transaction.outputs.map((output) => ({ address: output.address, amount: output.value }));
    }

    const txParams = {
      eip1559: params.txPrebuild.eip1559,
      txHex: transaction.toBroadcastFormat(),
      recipients: recipients,
      expiration: params.txPrebuild.expireTime,
      hopTransaction: params.txPrebuild.hopTransaction,
      custodianTransactionId: params.custodianTransactionId,
      expireTime: params.expireTime,
      contractSequenceId: params.txPrebuild.nextContractSequenceId as number,
      sequenceId: params.sequenceId,
      ...(params.txPrebuild.isBatch ? { isBatch: params.txPrebuild.isBatch } : {}),
    };

    return { halfSigned: txParams };
  }
}
