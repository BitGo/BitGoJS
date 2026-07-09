/**
 * @prettier
 *
 * @experimental The vault client surface is experimental and may change (including breaking
 * changes) before the public release.
 */
import * as _ from 'lodash';
import { BitGoBase } from '../bitgoBase';
import { decodeWithCodec } from '../utils/codecs';
import { postWithCodec } from '../utils/postWithCodec';
import { FreezeOptions, Wallet } from '../wallet';
import * as VaultCodecs from './codecs';
import {
  AcceptVaultShareOptions,
  AddVaultMemberOptions,
  AddVaultWalletMemberOptions,
  CreateVaultWalletOptions,
  IVault,
  VaultData,
  VaultShareData,
  VaultShareState,
  WalletShareData,
} from './iVault';

/**
 * @experimental
 */
export class Vault implements IVault {
  private readonly bitgo: BitGoBase;
  public readonly _vault: VaultData;

  constructor(bitgo: BitGoBase, vaultData: VaultData) {
    this.bitgo = bitgo;
    if (!_.isObject(vaultData)) {
      throw new Error('vaultData has to be an object');
    }
    if (!_.isString(vaultData.id)) {
      throw new Error('vault id has to be a string');
    }
    if (!_.isString(vaultData.enterpriseId)) {
      throw new Error('vault enterpriseId has to be a string');
    }
    this._vault = vaultData;
  }

  id(): string {
    return this._vault.id;
  }

  enterpriseId(): string {
    return this._vault.enterpriseId;
  }

  label(): string {
    return this._vault.label;
  }

  status(): VaultData['status'] {
    return this._vault.status;
  }

  /**
   * Enterprise-scoped v2 URL for this vault, e.g. /api/v2/enterprise/:eId/vaults/:vId
   * @param extra
   */
  url(extra = ''): string {
    return this.bitgo.url(`/enterprise/${this.enterpriseId()}/vaults/${this.id()}${extra}`, 2);
  }

  /**
   * Mint a child wallet in this vault (server-side public derivation — no ceremony).
   * Body lands in WCN-1203.
   */
  async createWallet(params: CreateVaultWalletOptions): Promise<Wallet> {
    throw new Error('Vault.createWallet is not yet implemented (WCN-1203)');
  }

  /**
   * Add a member to the whole vault (view/admin/spend). Spend opens a key share.
   * Body lands in WCN-1204.
   */
  async addMember(params: AddVaultMemberOptions): Promise<VaultData> {
    throw new Error('Vault.addMember is not yet implemented (WCN-1204)');
  }

  /**
   * Share ONE vault wallet with a non-member via the existing wallet-share handshake (FR-13).
   * Body lands in WCN-1204.
   */
  async addMemberToWallet(params: AddVaultWalletMemberOptions): Promise<WalletShareData> {
    throw new Error('Vault.addMemberToWallet is not yet implemented (WCN-1204)');
  }

  /**
   * List the vault key shares visible to the caller.
   * Body lands in WCN-1204.
   */
  async listShares(params: { state?: VaultShareState } = {}): Promise<VaultShareData[]> {
    throw new Error('Vault.listShares is not yet implemented (WCN-1204)');
  }

  /**
   * Accept a vault key share addressed to the caller.
   * Body lands in WCN-1204.
   */
  async acceptShare(params: AcceptVaultShareOptions): Promise<VaultShareData> {
    throw new Error('Vault.acceptShare is not yet implemented (WCN-1204)');
  }

  /**
   * Freeze the vault — blocks withdrawals on all vault wallets. Vault stays 'active'.
   * @param params
   */
  async freeze(params: FreezeOptions = {}): Promise<VaultData> {
    const response = await postWithCodec(this.bitgo, this.url('/freeze'), VaultCodecs.FreezeVaultBody, params).result();
    return decodeWithCodec(VaultCodecs.VaultData, response, 'VaultData');
  }

  /**
   * Archive the vault. Requires every vault wallet to already be archived; also the abandonment
   * path for a stuck 'initializing' vault.
   */
  async archive(): Promise<VaultData> {
    const response = await this.bitgo.post(this.url('/archive')).send().result();
    return decodeWithCodec(VaultCodecs.VaultData, response, 'VaultData');
  }

  toJSON(): VaultData {
    return this._vault;
  }
}
