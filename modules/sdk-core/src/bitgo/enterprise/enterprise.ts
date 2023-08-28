/**
 * @prettier
 */
import * as _ from 'lodash';
import { IBaseCoin } from '../baseCoin';
import { BitGoBase } from '../bitgoBase';
import { EnterpriseData, EnterpriseFeatureFlag, IEnterprise } from '../enterprise';
import { getFirstPendingTransaction } from '../internal';
import { Affirmations, Settlements } from '../trading';
import { Wallet } from '../wallet';
import { BitGoProofSignatures, EcdsaUtils, SerializedNtildeWithVerifiers } from '../utils/tss/ecdsa';
import { EcdsaTypes } from '@bitgo/sdk-lib-mpc';
import { verifyEcdhSignature } from '../ecdh';
import { Buffer } from 'buffer';
import { EcdhDerivedKeypair } from '../keychain';

export class Enterprise implements IEnterprise {
  private readonly bitgo: BitGoBase;
  private readonly baseCoin: IBaseCoin;
  public readonly id: string;
  public readonly name: string;
  public readonly _enterprise: EnterpriseData;

  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin, enterpriseData: EnterpriseData) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
    if (!_.isObject(enterpriseData)) {
      throw new Error('enterpriseData has to be an object');
    }
    if (!_.isString(enterpriseData.id)) {
      throw new Error('enterprise id has to be a string');
    }
    if (!_.isString(enterpriseData.name)) {
      throw new Error('enterprise name has to be a string');
    }
    this._enterprise = enterpriseData;
    this.id = enterpriseData.id;
    this.name = enterpriseData.name;
  }

  /**
   * Enterprise URL for v1 methods, such as getting users
   * @param query
   */
  url(query = ''): string {
    return this.bitgo.url(`/enterprise/${this.id}${query}`);
  }

  /**
   * Enterprise URL for v2 methods, such as getting fee address balances
   * @param query
   */
  coinUrl(query = ''): string {
    return this.baseCoin.url(`/enterprise/${this.id}${query}`);
  }

  /**
   * Get the wallets associated with this Enterprise
   * @param params
   */
  async coinWallets(params: Record<string, never> = {}): Promise<Wallet[]> {
    const walletData = (await this.bitgo.get(this.baseCoin.url('/wallet/enterprise/' + this.id)).result()) as any;
    walletData.wallets = walletData.wallets.map((w) => {
      return new Wallet(this.bitgo, this.baseCoin, w);
    });
    return walletData;
  }

  /**
   * Get the users associated with this Enterprise
   * @param params
   */
  async users(params: Record<string, never> = {}): Promise<any> {
    return await this.bitgo.get(this.url('/user')).result();
  }

  /**
   * Get the fee address balance for this Enterprise
   * @param params
   */
  async getFeeAddressBalance(params: Record<string, never> = {}): Promise<any> {
    return await this.bitgo.get(this.coinUrl('/feeAddressBalance')).result();
  }

  /**
   * Add a user to this Enterprise
   * @param params
   */
  async addUser(params: any = {}): Promise<any> {
    return await this.bitgo.post(this.url('/user')).send(params).result();
  }

  /**
   * Remove a user from this Enterprise
   * @param params
   */
  async removeUser(params: any = {}): Promise<any> {
    return await this.bitgo.del(this.url('/user')).send(params).result();
  }

  /**
   * Get the first pending transaction for this Enterprise
   * @param params
   */
  async getFirstPendingTransaction(params: Record<string, never> = {}): Promise<any> {
    return getFirstPendingTransaction({ enterpriseId: this.id }, this.baseCoin, this.bitgo);
  }

  /**
   * Manage settlements for an enterprise
   */
  settlements(): Settlements {
    return new Settlements(this.bitgo, this.id);
  }

  /**
   * Manage affirmations for an enterprise
   */
  affirmations(): Affirmations {
    return new Affirmations(this.bitgo, this.id);
  }

  /**
   * Verifies and signs bitgo proofs for the enterprise
   * @param userPassword - enterprise admin's login password
   */
  async verifyEcdsaBitGoChallengeProofs(userPassword: string): Promise<BitGoProofSignatures> {
    return EcdsaUtils.getVerifyAndSignBitGoChallenges(this.bitgo, this.id, userPassword);
  }

  /**
   * Manages all the challenges and signatures and uploads them to enable
   * ECDSA signing on enterprise. Also generates a client side Ntilde challenge
   * if not provided, but note that can take approx. a minute.
   * @param userPassword
   * @param bitgoInstChallengeProofSignature
   * @param bitgoNitroChallengeProofSignature
   * @param challenge
   */
  async uploadAndEnableTssEcdsaSigning(
    userPassword: string,
    bitgoInstChallengeProofSignature: Buffer,
    bitgoNitroChallengeProofSignature: Buffer,
    challenge?: EcdsaTypes.DeserializedNtildeWithProofs
  ): Promise<void> {
    await EcdsaUtils.initiateChallengesForEnterprise(
      this.bitgo,
      this.id,
      userPassword,
      bitgoInstChallengeProofSignature,
      bitgoNitroChallengeProofSignature,
      challenge
    );
  }

  /**
   * Fetches the existing TSS ECDSA enterprise challenge if one exists.
   * Can be used with uploadAndEnableTssEcdsaSigning to re-sign the
   * enterprise challenge with new signatures.
   */
  async getExistingTssEcdsaChallenge(): Promise<EcdsaTypes.DeserializedNtildeWithProofs> {
    const urlPath = `/enterprise/${this.id}/tssconfig`;
    const tssConfig = await this.bitgo.get(this.bitgo.url(urlPath, 2)).send().result();
    const enterpriseChallenge = tssConfig?.ecdsa.challenge?.enterprise;
    if (!enterpriseChallenge) {
      throw new Error('No existing ECDSA challenge on the enterprise.');
    }
    if (!enterpriseChallenge.ntildeProof) {
      throw new Error(
        'Existing ECDSA challenge does not have a proof. Please contact your enterprise admin to set this up.'
      );
    }
    return EcdsaTypes.deserializeNtildeWithProofs({
      ntilde: enterpriseChallenge.ntilde,
      h1: enterpriseChallenge.h1,
      h2: enterpriseChallenge.h2,
      ntildeProof: enterpriseChallenge.ntildeProof,
    });
  }

  /**
   * Resigns the enterprise and bitgo challenges with a new ECDH keychain.
   * Verifies that the old keychain signed the challenges previously.
   * @param oldEcdhKeypair - the old keychain that signed the challenges
   * @param newEcdhKeypair - the new keychain that will sign the challenges
   * @param entChallenge - existing signed enterprise challenge
   * @param bitgoInstChallenge - existing signed bitgo institutional challenge
   * @param bitgoNitroChallenge - existing signed bitgo nitro challenge
   */
  async resignEnterpriseChallenges(
    oldEcdhKeypair: EcdhDerivedKeypair,
    newEcdhKeypair: EcdhDerivedKeypair,
    entChallenge: SerializedNtildeWithVerifiers,
    bitgoInstChallenge: SerializedNtildeWithVerifiers,
    bitgoNitroChallenge: SerializedNtildeWithVerifiers
  ): Promise<void> {
    // Verify all the challenges were signed by the old keypair
    if (
      !verifyEcdhSignature(
        EcdsaUtils.getMessageToSignFromChallenge(entChallenge),
        entChallenge.verifiers.adminSignature,
        Buffer.from(oldEcdhKeypair.derivedPubKey, 'hex')
      )
    ) {
      throw new Error(`Cannot re-sign. The Enterprise TSS config was signed by another user.`);
    }
    if (
      !verifyEcdhSignature(
        EcdsaUtils.getMessageToSignFromChallenge(bitgoInstChallenge),
        bitgoInstChallenge.verifiers.adminSignature,
        Buffer.from(oldEcdhKeypair.derivedPubKey, 'hex')
      )
    ) {
      throw new Error(`Cannot re-sign. The BitGo Institutional TSS config was signed by another user.`);
    }
    if (
      !verifyEcdhSignature(
        EcdsaUtils.getMessageToSignFromChallenge(bitgoNitroChallenge),
        bitgoNitroChallenge.verifiers.adminSignature,
        Buffer.from(oldEcdhKeypair.derivedPubKey, 'hex')
      )
    ) {
      throw new Error(`Cannot re-sign. The BitGo Nitro TSS config was signed by another user.`);
    }

    // Once all the challenges are verified, we can re-sign them with the new keypair.
    const signedEntChallenge = EcdsaUtils.signChallenge(
      entChallenge,
      newEcdhKeypair.xprv,
      newEcdhKeypair.derivationPath
    );
    const signedBitGoInstChallenge = EcdsaUtils.signChallenge(
      bitgoInstChallenge,
      newEcdhKeypair.xprv,
      newEcdhKeypair.derivationPath
    );
    const signedBitGoNitroChallenge = EcdsaUtils.signChallenge(
      bitgoNitroChallenge,
      newEcdhKeypair.xprv,
      newEcdhKeypair.derivationPath
    );
    await EcdsaUtils.uploadChallengesToEnterprise(
      this.bitgo,
      this.id,
      entChallenge,
      signedEntChallenge.toString('hex'),
      signedBitGoInstChallenge.toString('hex'),
      signedBitGoNitroChallenge.toString('hex')
    );
  }

  /**
   *  Check if the enterprise has a set of featureFlags
   * @param flags
   */
  hasFeatureFlags(flags: EnterpriseFeatureFlag[]): boolean {
    return flags.every((targetFlag) => this._enterprise.featureFlags?.includes(targetFlag));
  }
}
