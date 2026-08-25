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

const CreateWalletInSafeBody = t.strict({
  coin: t.string,
  label: t.string,
  type: t.literal('hot'),
  multisigType: t.literal('onchain'),
  keys: t.tuple([t.string]),
});

function onchainSlotForCoin(coin: IBaseCoin): Extract<RootKeyType, 'secp256k1Multisig'> {
  if (coin.getDefaultMultisigType() === 'tss') {
    throw new Error('MPC safe wallet minting is not yet implemented; use a slot-1 onchain coin');
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

function userRootIdFromSafe(safe: SafeData, slot: RootKeyType): string | undefined {
  const triplet = safe.rootKeys?.hot?.[slot];
  if (!triplet || triplet.length !== 3) {
    return undefined;
  }
  const userRootId = triplet[0];
  return userRootId.length > 0 ? userRootId : undefined;
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
   * Mint a child wallet: peek the sequential index, hardened-derive the user child,
   * register it public-only, then mint. Backup and BitGo children are soft-derived on the server.
   */
  async createWallet(params: CreateSafeWalletOptions): Promise<Wallet> {
    if (params.passphrase.length === 0) {
      throw new Error('passphrase is required to mint a safe wallet');
    }
    if (params.type !== undefined && params.type !== 'hot') {
      throw new Error('Safe wallets are hot-only in v1');
    }
    if (params.multisigType === 'tss') {
      throw new Error('MPC safe wallet minting is not yet implemented; use multisigType "onchain"');
    }

    const coin = this.bitgo.coin(params.coin);
    const slot = onchainSlotForCoin(coin);

    const indexResponse = await this.bitgo.get(this.url('/derivation-index')).query({ slot }).result();
    const peeked = decodeWithCodec(GetDerivationIndexResponse, indexResponse, 'GetDerivationIndexResponse');
    if (peeked.slot !== slot) {
      throw new Error(`derivation-index returned slot '${peeked.slot}', expected '${slot}'`);
    }
    const { index } = peeked;

    const userRootId = userRootIdFromSafe(this._safe, slot) ?? userRootIdFromSafe(await this.fetchSafeData(), slot);
    if (userRootId === undefined) {
      throw new Error(`Safe ${this.id()} is missing rootKeys.hot.${slot}`);
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
      derivedFromParentWithHardenedPath,
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

  private async fetchSafeData(): Promise<SafeData> {
    const response = await this.bitgo.get(this.url()).result();
    return decodeWithCodec(SafeData, response, 'SafeData');
  }

  /**
   * Add a member to the whole safe (view/admin/spend). Spend opens a key share.
   * Body lands in WCN-1204.
   */
  async addMember(params: AddSafeMemberOptions): Promise<SafeData> {
    throw new Error('Safe.addMember is not yet implemented (WCN-1204)');
  }

  /**
   * Share ONE safe wallet with a non-member via the existing wallet-share handshake (FR-13).
   * Body lands in WCN-1204.
   */
  async addMemberToWallet(params: AddSafeWalletMemberOptions): Promise<WalletShareData> {
    throw new Error('Safe.addMemberToWallet is not yet implemented (WCN-1204)');
  }

  /**
   * List the safe key shares visible to the caller.
   * Body lands in WCN-1204.
   */
  async listShares(params: { state?: SafeShareState } = {}): Promise<SafeShareData[]> {
    throw new Error('Safe.listShares is not yet implemented (WCN-1204)');
  }

  /**
   * Accept a safe key share addressed to the caller.
   * Body lands in WCN-1204.
   */
  async acceptShare(params: AcceptSafeShareOptions): Promise<SafeShareData> {
    throw new Error('Safe.acceptShare is not yet implemented (WCN-1204)');
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
