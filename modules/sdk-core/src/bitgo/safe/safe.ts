/**
 * @prettier
 *
 * @experimental The safe client surface is experimental and may change (including breaking
 * changes) before the public release.
 */
import * as t from 'io-ts';
import { FreezeSafeBody, SafeData, SafeShareData, SafeShareState, type RootKeyType } from '@bitgo/public-types';
import { coins, KeyCurve } from '@bitgo/statics';
import { IBaseCoin } from '../baseCoin';
import { BitGoBase } from '../bitgoBase';
import { IncorrectPasswordError } from '../errors';
import { decryptKeychainPrivateKey } from '../keychain';
import { ECDSAUtils } from '../utils';
import { boundedInt, decodeWithCodec } from '../utils/codecs';
import { postWithCodec } from '../utils/postWithCodec';
import { Wallet } from '../wallet';
import { InvalidRootKeychainSourceError } from '../wallet/safeKeychain';
import {
  AcceptSafeShareOptions,
  AddSafeMemberOptions,
  AddSafeWalletMemberOptions,
  CreateSafeWalletOptions,
  ISafe,
  WalletShareData,
} from './iSafe';
import { deriveAndSelfCheckSafeChildHardened, DerivedFromParentWithHardenedPath } from './safeDerivation';

const SafeRootKeySlot = t.keyof({
  secp256k1Multisig: null,
  ecdsaMpc: null,
  eddsaMpc: null,
  ed25519Multisig: null,
});

const GetDerivationIndexResponse = t.type({
  slot: SafeRootKeySlot,
  index: boundedInt(0, 0x7fffffff, 'derivationIndex'),
});

const CreateWalletInSafeBody = t.union([
  t.strict({
    coin: t.string,
    label: t.string,
    type: t.literal('hot'),
    multisigType: t.literal('onchain'),
    keys: t.tuple([t.string]),
  }),
  // TSS mint: the SDK registers the user AND backup child keys (both carry
  // encryptedPrv); the BitGo child key is minted by the server.
  t.strict({
    coin: t.string,
    label: t.string,
    type: t.literal('hot'),
    multisigType: t.literal('tss'),
    keys: t.tuple([t.string, t.string]),
  }),
]);

function onchainSlotForCoin(coin: IBaseCoin): Extract<RootKeyType, 'secp256k1Multisig'> {
  if (coin.getDefaultMultisigType() === 'tss') {
    throw new Error('MPC safe wallet minting requires multisigType "tss"; use "onchain" for non-MPC minting');
  }
  const curve = coins.get(coin.getChain()).primaryKeyCurve;
  if (curve === KeyCurve.Secp256k1) {
    return 'secp256k1Multisig';
  }
  if (curve === KeyCurve.Ed25519) {
    throw new Error('ed25519 coin safe wallet minting is not yet supported');
  }
  throw new Error(`Coin '${coin.getChain()}' is not supported for safe wallet minting`);
}

function tssSlotForCoin(coin: IBaseCoin): Extract<RootKeyType, 'ecdsaMpc'> {
  if (coin.getDefaultMultisigType() !== 'tss') {
    throw new Error(`Coin '${coin.getChain()}' is not a TSS coin; cannot mint a tss safe wallet for it`);
  }
  const curve = coins.get(coin.getChain()).primaryKeyCurve;
  if (curve === KeyCurve.Secp256k1) {
    return 'ecdsaMpc';
  }
  if (curve === KeyCurve.Ed25519) {
    throw new Error('ed25519 MPC safe wallet minting is not yet supported');
  }
  throw new Error(`Coin '${coin.getChain()}' is not supported for safe wallet minting`);
}

function rootIdFromSafe(safe: SafeData, slot: RootKeyType, position: 0 | 1 | 2): string | undefined {
  const triplet = safe.rootKeys?.hot?.[slot];
  if (!triplet || triplet.length !== 3) {
    return undefined;
  }
  const rootId = triplet[position];
  return rootId.length > 0 ? rootId : undefined;
}

/**
 * @experimental
 */
export class Safe implements ISafe {
  private readonly bitgo: BitGoBase;
  public readonly _safe: SafeData;

  constructor(bitgo: BitGoBase, safeData: SafeData) {
    this.bitgo = bitgo;
    this._safe = safeData;
  }

  id(): string {
    return this._safe.id;
  }

  enterpriseId(): string {
    return this._safe.enterpriseId;
  }

  label(): string {
    return this._safe.label;
  }

  status(): SafeData['status'] {
    return this._safe.status;
  }

  /**
   * Enterprise-scoped v2 URL for this safe, e.g. /api/v2/enterprise/:eId/safes/:safeId
   * @param extra
   */
  url(extra = ''): string {
    return this.bitgo.url(`/enterprise/${this.enterpriseId()}/safes/${this.id()}${extra}`, 2);
  }

  /**
   * Mint a child wallet: peek the sequential index, derive the child keys, register
   * them, then mint.
   *
   * `onchain`: hardened-derive the user child (`m/<index>'`), register it
   * public-only; backup and BitGo children are soft-derived on the server.
   *
   * `tss`: decrypt the safe's `ecdsaMpc` root blobs (each carries the DKLS signing
   * keyshare and the Ristretto VRF keyshare), run the hard-derive ceremony against
   * the server (SDK drives user and backup), register the user and backup children
   * with the derived signing share encrypted under the Safe passphrase, then mint.
   */
  async createWallet(params: CreateSafeWalletOptions): Promise<Wallet> {
    if (params.passphrase.length === 0) {
      throw new Error('passphrase is required to mint a safe wallet');
    }
    if (params.type !== undefined && params.type !== 'hot') {
      throw new Error('Safe wallets are hot-only in v1');
    }
    const isTss = params.multisigType === 'tss';

    const coin = this.bitgo.coin(params.coin);
    const slot = isTss ? tssSlotForCoin(coin) : onchainSlotForCoin(coin);

    const indexResponse = await this.bitgo.get(this.url('/derivation-index')).query({ slot }).result();
    const peeked = decodeWithCodec(GetDerivationIndexResponse, indexResponse, 'GetDerivationIndexResponse');
    if (peeked.slot !== slot) {
      throw new Error(`derivation-index returned slot '${peeked.slot}', expected '${slot}'`);
    }
    const { index } = peeked;

    const safeData = rootIdFromSafe(this._safe, slot, 0) !== undefined ? this._safe : await this.fetchSafeData();
    const userRootId = rootIdFromSafe(safeData, slot, 0);
    if (userRootId === undefined) {
      throw new Error(`Safe ${this.id()} is missing rootKeys.hot.${slot}`);
    }

    if (isTss) {
      const backupRootId = rootIdFromSafe(safeData, slot, 1);
      const bitgoRootId = rootIdFromSafe(safeData, slot, 2);
      if (backupRootId === undefined) {
        throw new Error(`Safe ${this.id()} is missing rootKeys.hot.${slot} backup key`);
      }
      if (bitgoRootId === undefined) {
        throw new Error(`Safe ${this.id()} is missing rootKeys.hot.${slot} bitgo key`);
      }
      return this.createTssWalletInSafe(coin, userRootId, backupRootId, bitgoRootId, index, params);
    }

    const keychains = coin.keychains();
    const rootKeychain = await keychains.get({ id: userRootId });
    if (rootKeychain.source !== 'user') {
      throw new InvalidRootKeychainSourceError(rootKeychain.id, rootKeychain.source);
    }
    const rootPrv = await decryptKeychainPrivateKey(this.bitgo, rootKeychain, params.passphrase);
    if (!rootPrv) {
      throw new IncorrectPasswordError();
    }

    const derived = deriveAndSelfCheckSafeChildHardened(rootPrv, index);
    const derivedFromParentWithHardenedPath = decodeWithCodec(
      DerivedFromParentWithHardenedPath,
      derived.derivationPath,
      'derivedFromParentWithHardenedPath'
    );

    const child = await keychains.add({
      pub: derived.pub,
      source: 'user',
      keyType: 'independent',
      parent: userRootId,
      safeId: this.id(),
      derivedFromParentWithPath: derivedFromParentWithHardenedPath,
    });
    const childId = child.id;
    if (childId.length === 0) {
      throw new Error('safe child key registration returned an empty id');
    }
    const keys: [string] = [childId];

    const response = await postWithCodec(this.bitgo, this.url('/wallets'), CreateWalletInSafeBody, {
      coin: params.coin,
      label: params.label,
      type: 'hot',
      multisigType: 'onchain',
      keys,
    }).result();
    return new Wallet(this.bitgo, coin, response);
  }

  /**
   * TSS wallet mint: decrypt both root blobs, seed and run the hard-derive ceremony
   * with the server, register the derived user and backup children (encryptedPrv
   * holds the signing share only), then POST the unchanged mint endpoint with both
   * child ids.
   */
  private async createTssWalletInSafe(
    coin: IBaseCoin,
    userRootId: string,
    backupRootId: string,
    bitgoRootId: string,
    index: number,
    params: CreateSafeWalletOptions
  ): Promise<Wallet> {
    const keychains = coin.keychains();
    const [userRootKeychain, backupRootKeychain] = await Promise.all([
      keychains.get({ id: userRootId }),
      keychains.get({ id: backupRootId }),
    ]);
    if (userRootKeychain.source !== 'user') {
      throw new InvalidRootKeychainSourceError(userRootKeychain.id, userRootKeychain.source);
    }
    if (backupRootKeychain.source !== 'backup') {
      throw new InvalidRootKeychainSourceError(backupRootKeychain.id, backupRootKeychain.source);
    }
    const [userRootPrv, backupRootPrv] = await Promise.all([
      decryptKeychainPrivateKey(this.bitgo, userRootKeychain, params.passphrase),
      decryptKeychainPrivateKey(this.bitgo, backupRootKeychain, params.passphrase),
    ]);
    if (!userRootPrv || !backupRootPrv) {
      throw new IncorrectPasswordError();
    }

    const userRootMaterial = ECDSAUtils.parseVrfKeyEnvelopes(userRootPrv);
    const backupRootMaterial = ECDSAUtils.parseVrfKeyEnvelopes(backupRootPrv);

    const tssUtils = new ECDSAUtils.EcdsaVrfMPCv2Utils(this.bitgo, coin);
    const { userKeychain, backupKeychain } = await tssUtils.createSafeChildKeychains({
      passphrase: params.passphrase,
      enterprise: this.enterpriseId(),
      safeId: this.id(),
      // Derive from the safe's BitGo root key (its material holds the VRF share).
      parentKeyId: bitgoRootId,
      derivationIndex: index,
      userRootKeyId: userRootId,
      backupRootKeyId: backupRootId,
      userRootKeyShare: userRootMaterial.signing,
      userRootVrfKeyShare: userRootMaterial.vrf,
      backupRootKeyShare: backupRootMaterial.signing,
      backupRootVrfKeyShare: backupRootMaterial.vrf,
    });
    if (userKeychain.id.length === 0 || backupKeychain.id.length === 0) {
      throw new Error('safe child key registration returned an empty id');
    }
    const keys: [string, string] = [userKeychain.id, backupKeychain.id];

    const response = await postWithCodec(this.bitgo, this.url('/wallets'), CreateWalletInSafeBody, {
      coin: params.coin,
      label: params.label,
      type: 'hot',
      multisigType: 'tss',
      keys,
    }).result();
    return new Wallet(this.bitgo, coin, response);
  }

  private async fetchSafeData(): Promise<SafeData> {
    const response = await this.bitgo.get(this.url()).result();
    return decodeWithCodec(SafeData, response, 'SafeData');
  }

  /**
   * Add a member to the whole safe (view/admin/spend). Spend opens a key share.
   */
  async addMember(params: AddSafeMemberOptions): Promise<SafeData> {
    throw new Error('Safe.addMember is not yet implemented');
  }

  /**
   * Share ONE safe wallet with a non-member via the existing wallet-share handshake.
   */
  async addMemberToWallet(params: AddSafeWalletMemberOptions): Promise<WalletShareData> {
    throw new Error('Safe.addMemberToWallet is not yet implemented');
  }

  /**
   * List the safe key shares visible to the caller.
   */
  async listShares(params: { state?: SafeShareState } = {}): Promise<SafeShareData[]> {
    throw new Error('Safe.listShares is not yet implemented');
  }

  /**
   * Accept a safe key share addressed to the caller.
   */
  async acceptShare(params: AcceptSafeShareOptions): Promise<SafeShareData> {
    throw new Error('Safe.acceptShare is not yet implemented');
  }

  /**
   * Freeze the safe — blocks withdrawals on all safe wallets. Safe stays 'active'.
   * @param params
   */
  async freeze(params: FreezeSafeBody = {}): Promise<SafeData> {
    const response = await postWithCodec(this.bitgo, this.url('/freeze'), FreezeSafeBody, params).result();
    return decodeWithCodec(SafeData, response, 'SafeData');
  }

  /**
   * Archive the safe. Requires every safe wallet to already be archived; also the abandonment
   * path for a stuck 'initializing' safe.
   */
  async archive(): Promise<SafeData> {
    const response = await this.bitgo.post(this.url('/archive')).send().result();
    return decodeWithCodec(SafeData, response, 'SafeData');
  }

  toJSON(): SafeData {
    return this._safe;
  }
}
