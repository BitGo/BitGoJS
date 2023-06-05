import {
  BaseCoin,
  BitGoBase,
  Ecdsa,
  ECDSA,
  ECDSAMethodTypes,
  hexToBigInt,
  InvalidAddressError,
  InvalidMemoIdError,
  KeyPair,
  MPCAlgorithm,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  UnexpectedAddressError,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { EcdsaPaillierProof, EcdsaRangeProof, EcdsaTypes } from '@bitgo/sdk-lib-mpc';
import { BaseCoin as StaticsBaseCoin, CoinFamily } from '@bitgo/statics';
import { bip32 } from '@bitgo/utxo-lib';
import { BigNumber } from 'bignumber.js';
import { createHash, Hash, randomBytes } from 'crypto';
import * as _ from 'lodash';
import utils from './lib/utils';
import * as url from 'url';
import * as querystring from 'querystring';
import { CosmosKeyPair } from './lib';
import { Buffer } from 'buffer';

/**
 * Cosmos accounts support memo Id based addresses
 */
interface AddressDetails {
  address: string;
  memoId?: string | undefined;
}

/**
 * Cosmos accounts support memo Id based addresses
 */
interface CosmosCoinSpecific {
  rootAddress: string;
}

export class CosmosCoin extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new CosmosCoin(bitgo, staticsCoin);
  }

  /** @inheritDoc **/
  getBaseFactor(): string | number {
    return 1e6;
  }

  /** @inheritDoc **/
  getChain(): string {
    return this._staticsCoin.name;
  }

  /** @inheritDoc **/
  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  /** @inheritDoc **/
  getFullName(): string {
    return this._staticsCoin.fullName;
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** @inheritDoc **/
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  /** @inheritDoc **/
  isValidPub(pub: string): boolean {
    return utils.isValidPublicKey(pub);
  }

  /** @inheritDoc **/
  isValidPrv(prv: string): boolean {
    return utils.isValidPrivateKey(prv);
  }

  verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  isValidAddress(address: string): boolean {
    throw new Error('Method not implemented.');
  }

  signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc **/
  async parseTransaction(params: ParseTransactionOptions & { txHex: string }): Promise<ParsedTransaction> {
    const transactionExplanation = await this.explainTransaction({ txHex: params.txHex });
    if (!transactionExplanation) {
      throw new Error('Invalid transaction');
    }

    if (transactionExplanation.outputs.length <= 0) {
      return {
        inputs: [],
        outputs: [],
      };
    }
    const senderAddress = transactionExplanation.outputs[0].address;
    const feeAmount = new BigNumber(transactionExplanation.fee.fee === '' ? '0' : transactionExplanation.fee.fee);
    const inputs = [
      {
        address: senderAddress,
        amount: new BigNumber(transactionExplanation.outputAmount).plus(feeAmount).toFixed(),
      },
    ];
    const outputs = transactionExplanation.outputs.map((output) => {
      return {
        address: output.address,
        amount: new BigNumber(output.amount).toFixed(),
      };
    });
    return {
      inputs,
      outputs,
    };
  }

  /** @inheritDoc **/
  generateKeyPair(seed?: Buffer): KeyPair {
    if (!seed) {
      // An extended private key has both a normal 256 bit private key and a 256
      // bit chain code, both of which must be random. 512 bits is therefore the
      // maximum entropy and gives us maximum security against cracking.
      seed = randomBytes(512 / 8);
    }
    const extendedKey = bip32.fromSeed(seed);
    return {
      pub: extendedKey.neutered().toBase58(),
      prv: extendedKey.toBase58(),
    };
  }

  getAddressFromPublicKey(pubKey: string): string {
    return new CosmosKeyPair({ pub: pubKey }).getAddress();
  }

  /** @inheritDoc **/
  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    const addressDetails = this.getAddressDetails(params.address);

    if (!this.isValidAddress(addressDetails.address)) {
      throw new InvalidAddressError(`invalid address: ${addressDetails.address}`);
    }
    const rootAddress = (params.coinSpecific as CosmosCoinSpecific).rootAddress;
    if (addressDetails.address !== rootAddress) {
      throw new UnexpectedAddressError(`address validation failure: ${addressDetails.address} vs ${rootAddress}`);
    }
    return true;
  }

  getHashFunction(): Hash {
    return createHash('sha256');
  }

  /**
   * Process address into address and memo id
   *
   * @param address the address
   * @returns object containing address and memo id
   */
  getAddressDetails(address: string): AddressDetails {
    const destinationDetails = url.parse(address);
    const destinationAddress = destinationDetails.pathname || '';

    // address doesn't have a memo id
    if (destinationDetails.pathname === address) {
      return {
        address: address,
        memoId: undefined,
      };
    }

    if (!destinationDetails.query) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    const queryDetails = querystring.parse(destinationDetails.query);
    if (!queryDetails.memoId) {
      // if there are more properties, the query details need to contain the memo id property
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    if (Array.isArray(queryDetails.memoId)) {
      throw new InvalidAddressError(
        `memoId may only be given at most once, but found ${queryDetails.memoId.length} instances in address ${address}`
      );
    }

    if (Array.isArray(queryDetails.memoId) && queryDetails.memoId.length !== 1) {
      // valid addresses can only contain one memo id
      throw new InvalidAddressError(`invalid address '${address}', must contain exactly one memoId`);
    }

    const [memoId] = _.castArray(queryDetails.memoId) || undefined;
    if (!this.isValidMemoId(memoId)) {
      throw new InvalidMemoIdError(`invalid address: '${address}', memoId is not valid`);
    }

    return {
      address: destinationAddress,
      memoId,
    };
  }

  /**
   * Return boolean indicating whether a memo id is valid
   *
   * @param memoId memo id
   * @returns true if memo id is valid
   */
  isValidMemoId(memoId: string): boolean {
    let memoIdNumber;
    try {
      memoIdNumber = new BigNumber(memoId);
    } catch (e) {
      return false;
    }
    return memoIdNumber.gte(0);
  }

  private getKeyCombinedFromTssKeyShares(
    userPublicOrPrivateKeyShare: string,
    backupPrivateOrPublicKeyShare: string,
    walletPassphrase?: string
  ): [ECDSAMethodTypes.KeyCombined, ECDSAMethodTypes.KeyCombined] {
    let backupPrv;
    let userPrv;
    try {
      backupPrv = this.bitgo.decrypt({
        input: backupPrivateOrPublicKeyShare,
        password: walletPassphrase,
      });
      userPrv = this.bitgo.decrypt({
        input: userPublicOrPrivateKeyShare,
        password: walletPassphrase,
      });
    } catch (e) {
      throw new Error(`Error decrypting backup keychain: ${e.message}`);
    }

    const userSigningMaterial = JSON.parse(userPrv) as ECDSAMethodTypes.SigningMaterial;
    const backupSigningMaterial = JSON.parse(backupPrv) as ECDSAMethodTypes.SigningMaterial;

    if (!userSigningMaterial.backupNShare) {
      throw new Error('Invalid user key - missing backupNShare');
    }

    if (!backupSigningMaterial.userNShare) {
      throw new Error('Invalid backup key - missing userNShare');
    }

    const MPC = new Ecdsa();

    const userKeyCombined = MPC.keyCombine(userSigningMaterial.pShare, [
      userSigningMaterial.bitgoNShare,
      userSigningMaterial.backupNShare,
    ]);

    const userSigningKeyDerived = MPC.keyDerive(
      userSigningMaterial.pShare,
      [userSigningMaterial.bitgoNShare, userSigningMaterial.backupNShare],
      'm/0'
    );

    const userKeyDerivedCombined = {
      xShare: userSigningKeyDerived.xShare,
      yShares: userKeyCombined.yShares,
    };

    const backupKeyCombined = MPC.keyCombine(backupSigningMaterial.pShare, [
      userSigningKeyDerived.nShares[2],
      backupSigningMaterial.bitgoNShare,
    ]);

    if (
      userKeyDerivedCombined.xShare.y !== backupKeyCombined.xShare.y ||
      userKeyDerivedCombined.xShare.chaincode !== backupKeyCombined.xShare.chaincode
    ) {
      throw new Error('Common keychains do not match');
    }

    return [userKeyDerivedCombined, backupKeyCombined];
  }

  // TODO(BG-78714): Reduce code duplication between this and eth.ts
  private async signRecoveryTSS(
    userKeyCombined: ECDSA.KeyCombined,
    backupKeyCombined: ECDSA.KeyCombined,
    txHex: string,
    {
      rangeProofChallenge,
    }: {
      rangeProofChallenge?: EcdsaTypes.SerializedNtilde;
    } = {}
  ): Promise<ECDSAMethodTypes.Signature> {
    const MPC = new Ecdsa();
    const signerOneIndex = userKeyCombined.xShare.i;
    const signerTwoIndex = backupKeyCombined.xShare.i;

    // Since this is a user <> backup signing, we will reuse the same range proof challenge
    rangeProofChallenge =
      rangeProofChallenge ?? EcdsaTypes.serializeNtildeWithProofs(await EcdsaRangeProof.generateNtilde());

    const userToBackupPaillierChallenge = await EcdsaPaillierProof.generateP(
      hexToBigInt(userKeyCombined.yShares[signerTwoIndex].n)
    );
    const backupToUserPaillierChallenge = await EcdsaPaillierProof.generateP(
      hexToBigInt(backupKeyCombined.yShares[signerOneIndex].n)
    );

    const userXShare = MPC.appendChallenge(
      userKeyCombined.xShare,
      rangeProofChallenge,
      EcdsaTypes.serializePaillierChallenge({ p: userToBackupPaillierChallenge })
    );
    const userYShare = MPC.appendChallenge(
      userKeyCombined.yShares[signerTwoIndex],
      rangeProofChallenge,
      EcdsaTypes.serializePaillierChallenge({ p: backupToUserPaillierChallenge })
    );
    const backupXShare = MPC.appendChallenge(
      backupKeyCombined.xShare,
      rangeProofChallenge,
      EcdsaTypes.serializePaillierChallenge({ p: backupToUserPaillierChallenge })
    );
    const backupYShare = MPC.appendChallenge(
      backupKeyCombined.yShares[signerOneIndex],
      rangeProofChallenge,
      EcdsaTypes.serializePaillierChallenge({ p: userToBackupPaillierChallenge })
    );

    const signShares: ECDSA.SignShareRT = await MPC.signShare(userXShare, userYShare);

    const signConvertS21 = await MPC.signConvertStep1({
      xShare: backupXShare,
      yShare: backupYShare, // YShare corresponding to the other participant signerOne
      kShare: signShares.kShare,
    });
    const signConvertS12 = await MPC.signConvertStep2({
      aShare: signConvertS21.aShare,
      wShare: signShares.wShare,
    });
    const signConvertS21_2 = await MPC.signConvertStep3({
      muShare: signConvertS12.muShare,
      bShare: signConvertS21.bShare,
    });

    const [signCombineOne, signCombineTwo] = [
      MPC.signCombine({
        gShare: signConvertS12.gShare,
        signIndex: {
          i: signConvertS12.muShare.i,
          j: signConvertS12.muShare.j,
        },
      }),
      MPC.signCombine({
        gShare: signConvertS21_2.gShare,
        signIndex: {
          i: signConvertS21_2.signIndex.i,
          j: signConvertS21_2.signIndex.j,
        },
      }),
    ];

    const MESSAGE = Buffer.from(txHex, 'hex');

    const [signA, signB] = [
      MPC.sign(MESSAGE, signCombineOne.oShare, signCombineTwo.dShare, createHash('sha256')),
      MPC.sign(MESSAGE, signCombineTwo.oShare, signCombineOne.dShare, createHash('sha256')),
    ];

    return MPC.constructSignature([signA, signB]);
  }
}
