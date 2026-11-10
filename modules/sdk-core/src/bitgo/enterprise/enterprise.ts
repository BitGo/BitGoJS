/**
 * @prettier
 */
import * as _ from 'lodash';
import { IBaseCoin } from '../baseCoin';
import { BitGoBase } from '../bitgoBase';
import { EnterpriseData, EnterpriseFeatureFlag, IEnterprise } from '../enterprise';
import { getFirstPendingTransaction } from '../internal';
import { ListWalletOptions, Wallet } from '../wallet';
import { Safes } from '../safe';
import { BitGoProofSignatures, EcdsaUtils, SerializedNtildeWithVerifiers } from '../utils/tss/ecdsa';
import { EcdsaTypes } from '@bitgo/sdk-lib-mpc';
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
  async coinWallets(params: ListWalletOptions = {}): Promise<Wallet[]> {
    if (params.skip && params.prevId) {
      throw new Error('cannot specify both skip and prevId');
    }

    const walletData = (await this.bitgo
      .get(this.baseCoin.url('/wallet/enterprise/' + this.id))
      .query(params)
      .result()) as any;
    return walletData.wallets.map((w) => {
      return new Wallet(this.bitgo, this.baseCoin, w);
    });
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
   * @param challenge - deprecated; see overload
   */
  uploadAndEnableTssEcdsaSigning(
    userPassword: string,
    bitgoInstChallengeProofSignature: Buffer,
    bitgoNitroChallengeProofSignature: Buffer,
    openSSLBytes: Uint8Array
  ): Promise<void>;
  /**
   * @deprecated Passing `challenge` signs it without provenance verification. Omit it to generate a fresh
   * challenge locally, or use resignTssEcdsaChallenge to re-sign the enterprise's existing challenge.
   */
  uploadAndEnableTssEcdsaSigning(
    userPassword: string,
    bitgoInstChallengeProofSignature: Buffer,
    bitgoNitroChallengeProofSignature: Buffer,
    openSSLBytes: Uint8Array,
    challenge?: EcdsaTypes.DeserializedNtildeWithProofs
  ): Promise<void>;
  async uploadAndEnableTssEcdsaSigning(
    userPassword: string,
    bitgoInstChallengeProofSignature: Buffer,
    bitgoNitroChallengeProofSignature: Buffer,
    openSSLBytes: Uint8Array,
    challenge?: EcdsaTypes.DeserializedNtildeWithProofs
  ): Promise<void> {
    await EcdsaUtils.initiateChallengesForEnterprise(
      this.bitgo,
      this.id,
      userPassword,
      bitgoInstChallengeProofSignature,
      bitgoNitroChallengeProofSignature,
      openSSLBytes,
      challenge
    );
  }

  private async fetchTssEcdsaEnterpriseChallenge(): Promise<
    EcdsaTypes.SerializedNtildeWithProofs & { verifiers?: { adminSignature?: string } }
  > {
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
    return enterpriseChallenge;
  }

  /**
   * Fetches the existing TSS ECDSA enterprise challenge if one exists.
   * The returned challenge is NOT verified.
   * @deprecated Use {@link resignTssEcdsaChallenge} to re-sign the existing challenge. Signing the value returned here
   * without verification lets a compromised server obtain an admin signature on a challenge whose trapdoor it knows.
   */
  async getExistingTssEcdsaChallenge(): Promise<EcdsaTypes.DeserializedNtildeWithProofs> {
    const c = await this.fetchTssEcdsaEnterpriseChallenge();
    return EcdsaTypes.deserializeNtildeWithProofs({
      ntilde: c.ntilde,
      h1: c.h1,
      h2: c.h2,
      ntildeProof: c.ntildeProof,
    });
  }

  /**
   * Re-signs the enterprise's existing TSS ECDSA challenge and BitGo's HSM challenges with the admin's ECDH key.
   * Before signing, verifies that the existing challenge was previously signed by this admin's own ECDH key
   * (pubkey derived from the decrypted xprv), is not a BitGo HSM challenge, and has valid ntilde proofs.
   * If verification fails, generate a fresh challenge with uploadAndEnableTssEcdsaSigning instead.
   * Takes roughly 30-40 seconds (three 3072-bit ntilde proof verifications).
   * @param userPassword - enterprise admin's login password
   */
  async resignTssEcdsaChallenge(userPassword: string): Promise<void> {
    const existing = await this.fetchTssEcdsaEnterpriseChallenge();
    const ecdhKeypair = await this.bitgo.getEcdhKeypairPrivate(userPassword, this.id);
    const bitgoChallenges = await EcdsaUtils.getBitGoChallenges(this.bitgo);
    await EcdsaUtils.verifyEnterpriseChallengeForResign(existing, ecdhKeypair, bitgoChallenges);
    if (!(await EcdsaUtils.verifyBitGoChallenges(bitgoChallenges))) {
      throw new Error(
        `Failed to verify BitGo's challenge needed to enable ECDSA signing. Please contact support@bitgo.com`
      );
    }
    const entChallenge: EcdsaTypes.SerializedNtildeWithProofs = {
      ntilde: existing.ntilde,
      h1: existing.h1,
      h2: existing.h2,
      ntildeProof: existing.ntildeProof,
    };
    const { xprv, derivationPath } = ecdhKeypair;
    const signedEntChallenge = EcdsaUtils.signChallenge(entChallenge, xprv, derivationPath);
    const signedInstChallenge = EcdsaUtils.signChallenge(bitgoChallenges.bitgoInstitutionalHsm, xprv, derivationPath);
    const signedNitroChallenge = EcdsaUtils.signChallenge(bitgoChallenges.bitgoNitroHsm, xprv, derivationPath);
    await EcdsaUtils.uploadChallengesToEnterprise(
      this.bitgo,
      this.id,
      entChallenge,
      signedEntChallenge.toString('hex'),
      signedInstChallenge.toString('hex'),
      signedNitroChallenge.toString('hex')
    );
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
    if (!EcdsaUtils.isChallengeSignedByEcdhKeypair(entChallenge, oldEcdhKeypair)) {
      throw new Error(`Cannot re-sign. The Enterprise TSS config was signed by another user.`);
    }
    if (!EcdsaUtils.isChallengeSignedByEcdhKeypair(bitgoInstChallenge, oldEcdhKeypair)) {
      throw new Error(`Cannot re-sign. The BitGo Institutional TSS config was signed by another user.`);
    }
    if (!EcdsaUtils.isChallengeSignedByEcdhKeypair(bitgoNitroChallenge, oldEcdhKeypair)) {
      throw new Error(`Cannot re-sign. The BitGo Nitro TSS config was signed by another user.`);
    }
    // The old keychain legitimately signed BitGo's HSM challenges during setup, so a valid signature alone
    // cannot distinguish the enterprise challenge from a replayed HSM challenge. Compare against the HSM
    // challenges being re-signed: if the server serves one of them as the enterprise challenge, refuse.
    if (
      entChallenge.ntilde.toLowerCase() === bitgoInstChallenge.ntilde.toLowerCase() ||
      entChallenge.ntilde.toLowerCase() === bitgoNitroChallenge.ntilde.toLowerCase()
    ) {
      throw new Error('Cannot re-sign. The enterprise ECDSA challenge matches a BitGo HSM challenge.');
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

  /**
   * Get the safes collection accessor scoped to this Enterprise
   * @experimental
   */
  safes(): Safes {
    return new Safes(this.bitgo, this.id);
  }
}
