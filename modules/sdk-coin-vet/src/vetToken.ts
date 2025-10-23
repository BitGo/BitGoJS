import assert from 'assert';
import BigNumber from 'bignumber.js';
import { BitGoBase, CoinConstructor, Ecdsa, ECDSAUtils, NamedCoinConstructor } from '@bitgo/sdk-core';
import { VetTokenConfig, coins, tokens } from '@bitgo/statics';
import * as mpc from '@bitgo/sdk-lib-mpc';
import { KeyPair as EthKeyPair } from '@bitgo/abstract-eth';
import { RecoverOptions, RecoveryTransaction, UnsignedSweepRecoveryTransaction } from './lib/types';
import { TokenTransaction, Transaction } from './lib';
import { AVG_GAS_UNITS, EXPIRATION, feeEstimateData, GAS_PRICE_COEF } from './lib/constants';
import { Vet } from './vet';

export class VetToken extends Vet {
  public readonly tokenConfig: VetTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: VetTokenConfig) {
    const staticsCoin = tokenConfig.network === 'Mainnet' ? coins.get('vet') : coins.get('tvet');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: VetTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new VetToken(bitgo, config);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of [...tokens.bitcoin.vet.tokens, ...tokens.testnet.vet.tokens]) {
      const tokenConstructor = VetToken.createTokenConstructor(token);
      tokensCtors.push({ name: token.type, coinConstructor: tokenConstructor });
    }
    return tokensCtors;
  }

  get name(): string {
    return this.tokenConfig.name;
  }

  get coin(): string {
    return this.tokenConfig.coin;
  }

  get network(): string {
    return this.tokenConfig.network;
  }

  get contractAddress(): string {
    return this.tokenConfig.contractAddress;
  }

  get decimalPlaces(): number {
    return this.tokenConfig.decimalPlaces;
  }

  getChain(): string {
    return this.tokenConfig.type;
  }

  getBaseChain(): string {
    return this.coin;
  }

  getFullName(): string {
    return 'Vet Token';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }

  async recover(params: RecoverOptions): Promise<RecoveryTransaction | UnsignedSweepRecoveryTransaction> {
    try {
      if (!params.recoveryDestination || !this.isValidAddress(params.recoveryDestination)) {
        throw new Error('invalid recoveryDestination');
      }
      if (!params.tokenContractAddress || !this.isValidAddress(params.tokenContractAddress)) {
        throw new Error('invalid tokenContractAddress');
      }

      const isUnsignedSweep = !params.userKey && !params.backupKey && !params.walletPassphrase;

      let publicKey: string | undefined;
      let userKeyShare, backupKeyShare, commonKeyChain;
      const MPC = new Ecdsa();

      if (isUnsignedSweep) {
        const bitgoKey = params.bitgoKey;
        if (!bitgoKey) {
          throw new Error('missing bitgoKey');
        }

        const hdTree = new mpc.Secp256k1Bip32HdTree();
        const derivationPath = 'm/0';
        const derivedPub = hdTree.publicDerive(
          {
            pk: mpc.bigIntFromBufferBE(Buffer.from(bitgoKey.slice(0, 66), 'hex')),
            chaincode: mpc.bigIntFromBufferBE(Buffer.from(bitgoKey.slice(66), 'hex')),
          },
          derivationPath
        );

        publicKey = mpc.bigIntToBufferBE(derivedPub.pk).toString('hex');
      } else {
        if (!params.userKey) {
          throw new Error('missing userKey');
        }

        if (!params.backupKey) {
          throw new Error('missing backupKey');
        }

        if (!params.walletPassphrase) {
          throw new Error('missing wallet passphrase');
        }

        const userKey = params.userKey.replace(/\s/g, '');
        const backupKey = params.backupKey.replace(/\s/g, '');

        ({ userKeyShare, backupKeyShare, commonKeyChain } = await ECDSAUtils.getMpcV2RecoveryKeyShares(
          userKey,
          backupKey,
          params.walletPassphrase
        ));
        publicKey = MPC.deriveUnhardened(commonKeyChain, 'm/0').slice(0, 66);
      }

      if (!publicKey) {
        throw new Error('failed to derive public key');
      }

      const backupKeyPair = new EthKeyPair({ pub: publicKey });
      const baseAddress = backupKeyPair.getAddress();

      const tx = await this.buildRecoveryTransaction({
        baseAddress,
        params,
      });

      const signableHex = await tx.signablePayload;
      const serializedTxHex = await tx.toBroadcastFormat();

      if (isUnsignedSweep) {
        return {
          txHex: serializedTxHex,
          coin: this.getChain(),
        };
      }

      const signableMessage = this.getHashFunction().update(signableHex).digest();

      const signatureObj = await ECDSAUtils.signRecoveryMpcV2(
        signableMessage,
        userKeyShare,
        backupKeyShare,
        commonKeyChain
      );
      const signature = Buffer.from(signatureObj.r + signatureObj.s + (signatureObj.recid === 0 ? '00' : '01'), 'hex');
      const tokenTransaction = new TokenTransaction(coins.get(this.getChain()));
      const txBuilder = this.getTxBuilderFactory().getTokenTransactionBuilder(tokenTransaction);
      await txBuilder.from(serializedTxHex);
      txBuilder.isRecovery(true);
      await txBuilder.addSenderSignature(signature);

      const signedTx = await txBuilder.build();

      return {
        id: signedTx.id,
        tx: signedTx.toBroadcastFormat(),
      };
    } catch (error) {
      throw new Error(`Error during Vechain token recovery: ${error.message || error}`);
    }
  }

  protected async buildRecoveryTransaction(buildParams: {
    baseAddress: string;
    params: RecoverOptions;
  }): Promise<Transaction> {
    const { baseAddress, params } = buildParams;
    const tokenContractAddress = params.tokenContractAddress;
    assert(tokenContractAddress, 'tokenContractAddress is required for token recovery');

    const balance = await this.getBalance(baseAddress, tokenContractAddress);
    //replace with get balance function

    if (balance.isLessThanOrEqualTo(0)) {
      throw new Error(
        `no token balance to recover for address ${baseAddress} contract address ${tokenContractAddress}`
      );
    }

    // create the recipients here so that we can build the clauses for gas estimation
    const roughFeeEstimate = this.calculateFee(feeEstimateData, new BigNumber(51390));
    let recipients = [
      {
        address: params.recoveryDestination,
        amount: balance.minus(roughFeeEstimate).toString(),
      },
    ];

    const blockRef = await this.getBlockRef();

    const tokenTransaction = new TokenTransaction(coins.get(this.getChain()));
    const txBuilder = this.getTxBuilderFactory().getTokenTransactionBuilder(tokenTransaction);

    txBuilder.tokenAddress(tokenContractAddress);
    txBuilder.chainTag(this.bitgo.getEnv() === 'prod' ? 0x4a : 0x27);
    txBuilder.recipients(recipients);
    txBuilder.sender(baseAddress);
    txBuilder.addFeePayerAddress(baseAddress);
    txBuilder.gas(Number(AVG_GAS_UNITS));
    txBuilder.blockRef(blockRef);
    txBuilder.expiration(EXPIRATION);
    txBuilder.gasPriceCoef(Number(GAS_PRICE_COEF));
    txBuilder.nonce(this.getRandomNonce());
    txBuilder.isRecovery(true);

    let tx = (await txBuilder.build()) as Transaction;

    const clauses = tx.clauses;

    const actualGasUnits = await this.estimateGas(clauses, baseAddress);

    await this.ensureVthoBalanceForFee(baseAddress, actualGasUnits);

    const requiredFee = this.calculateFee(feeEstimateData, actualGasUnits);

    // create the final recipients with the fee deducted
    recipients = [
      {
        address: params.recoveryDestination,
        amount: balance.minus(requiredFee).toString(),
      },
    ];

    txBuilder.recipients(recipients);
    txBuilder.gas(actualGasUnits.toNumber());

    tx = (await txBuilder.build()) as Transaction;

    return tx;
  }
}
