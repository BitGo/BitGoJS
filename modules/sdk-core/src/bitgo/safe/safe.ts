/**
 * @prettier
 *
 * @experimental The safe client surface is experimental and may change (including breaking
 * changes) before the public release.
 */
import { FreezeSafeBody, SafeData, SafeShareData, SafeShareState } from '@bitgo/public-types';
import { BitGoBase } from '../bitgoBase';
import { decodeWithCodec } from '../utils/codecs';
import { postWithCodec } from '../utils/postWithCodec';
import { Wallet } from '../wallet';
import {
  AcceptSafeShareOptions,
  AddSafeMemberOptions,
  AddSafeWalletMemberOptions,
  CreateSafeWalletOptions,
  ISafe,
  WalletShareData,
} from './iSafe';

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
   * Mint a child wallet in this safe (server-side public derivation — no ceremony).
   * Body lands in WCN-1203.
   */
  async createWallet(params: CreateSafeWalletOptions): Promise<Wallet> {
    throw new Error('Safe.createWallet is not yet implemented (WCN-1203)');
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
