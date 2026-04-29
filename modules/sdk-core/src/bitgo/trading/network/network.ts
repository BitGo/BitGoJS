import { v4 as uuidV4 } from 'uuid';
import crypto from 'crypto';
import { BitGoBase } from '../../bitgoBase';
import { IWallet } from '../../wallet';
import {
  CreateNetworkAllocationParams,
  CreateNetworkAllocationResponse,
  CreateNetworkConnectionParams,
  CreateNetworkConnectionResponse,
  CreateNetworkDeallocationParams,
  CreateNetworkDeallocationResponse,
  GetNetworkAllocationByIdParams,
  GetNetworkAllocationByIdResponse,
  GetNetworkAllocationsParams,
  GetNetworkAllocationsResponse,
  GetNetworkBalancesParams,
  GetNetworkBalancesResponse,
  GetNetworkConnectionByIdParams,
  GetNetworkConnectionByIdResponse,
  GetNetworkConnectionsParams,
  GetNetworkConnectionsResponse,
  GetNetworkPartnersParams,
  GetNetworkPartnersResponse,
  GetNetworkSettlementByIdParams,
  GetNetworkSettlementByIdResponse,
  GetNetworkSettlementTransfersParams,
  GetNetworkSettlementTransfersResponse,
  GetNetworkSettlementsParams,
  GetNetworkSettlementsResponse,
  GetNetworkSupportedCurrenciesParams,
  GetNetworkSupportedCurrenciesResponse,
  ITradingNetwork,
  PrepareNetworkAllocationParams,
  UpdateNetworkConnectionParams,
  UpdateNetworkConnectionResponse,
} from './types';

export class TradingNetwork implements ITradingNetwork {
  private readonly bitgo: BitGoBase;
  private readonly enterpriseId: string;

  public wallet: IWallet;

  constructor(enterpriseId: string, wallet: IWallet, bitgo: BitGoBase) {
    this.enterpriseId = enterpriseId;
    this.wallet = wallet;
    this.bitgo = bitgo;
  }

  getBalances(params?: GetNetworkBalancesParams): Promise<GetNetworkBalancesResponse> {
    const url = this.bitgo.microservicesUrl(`/api/network/v1/enterprises/${this.enterpriseId}/clients/balances`);
    return this.bitgo.get(url).set('enterprise-id', this.enterpriseId).send(params).result();
  }

  getPartners(params?: GetNetworkPartnersParams): Promise<GetNetworkPartnersResponse> {
    const url = this.bitgo.microservicesUrl(`/api/network/v1/enterprises/${this.enterpriseId}/partners`);
    return this.bitgo.get(url).set('enterprise-id', this.enterpriseId).send(params).result();
  }

  getSupportedCurrencies(params: GetNetworkSupportedCurrenciesParams): Promise<GetNetworkSupportedCurrenciesResponse> {
    const url = this.bitgo.microservicesUrl(`/api/network/v1/enterprises/${this.enterpriseId}/supportedCurrencies`);
    return this.bitgo.get(url).set('enterprise-id', this.enterpriseId).send(params).result();
  }

  getConnections(params?: GetNetworkConnectionsParams): Promise<GetNetworkConnectionsResponse> {
    const url = this.bitgo.microservicesUrl(`/api/network/v1/enterprises/${this.enterpriseId}/clients/connections`);
    return this.bitgo.get(url).set('enterprise-id', this.enterpriseId).send(params).result();
  }

  getConnectionById({
    connectionId,
    ...params
  }: GetNetworkConnectionByIdParams): Promise<GetNetworkConnectionByIdResponse> {
    const url = this.bitgo.microservicesUrl(
      `/api/network/v1/enterprises/${this.enterpriseId}/clients/connections/${connectionId}`
    );
    return this.bitgo.get(url).set('enterprise-id', this.enterpriseId).send(params).result();
  }

  createConnection(params: CreateNetworkConnectionParams): Promise<CreateNetworkConnectionResponse> {
    const url = this.bitgo.microservicesUrl(`/api/network/v1/enterprises/${this.enterpriseId}/clients/connections`);
    return this.bitgo.post(url).set('enterprise-id', this.enterpriseId).send(params).result();
  }

  updateConnection({
    connectionId,
    ...params
  }: UpdateNetworkConnectionParams): Promise<UpdateNetworkConnectionResponse> {
    const url = this.bitgo.microservicesUrl(
      `/api/network/v1/enterprises/${this.enterpriseId}/clients/connections/${connectionId}`
    );
    return this.bitgo.put(url).set('enterprise-id', this.enterpriseId).send(params).result();
  }

  getAllocations(params?: GetNetworkAllocationsParams): Promise<GetNetworkAllocationsResponse> {
    const url = this.bitgo.microservicesUrl(`/api/network/v1/enterprises/${this.enterpriseId}/clients/allocations`);
    return this.bitgo.get(url).set('enterprise-id', this.enterpriseId).send(params).result();
  }

  getAllocationById({
    allocationId,
    ...params
  }: GetNetworkAllocationByIdParams): Promise<GetNetworkAllocationByIdResponse> {
    const url = this.bitgo.microservicesUrl(
      `/api/network/v1/enterprises/${this.enterpriseId}/clients/allocations/${allocationId}`
    );
    return this.bitgo.get(url).set('enterprise-id', this.enterpriseId).send(params).result();
  }

  /**
   * Prepare an allocation for submission
   * @param {string} walletPassphrase ofc wallet passphrase
   * @param {string} connectionId connection to whom to make the allocation or deallocation
   * @param {string=} clientExternalId one time generated uuid v4
   * @param {string} currency currency for which the allocation should be made. e.g. btc / tbtc
   * @param {string} quantity base amount. e.g. 10000000 (1 BTC)
   * @param {string} notes Private note that you can view and edit
   * @param {string=} nonce one time generated string .e.g. crypto.randomBytes(32).toString('hex')
   * @returns
   */
  async prepareAllocation({
    walletPassphrase,
    ...body
  }: PrepareNetworkAllocationParams): Promise<CreateNetworkAllocationParams> {
    if (!body.clientExternalId) {
      body.clientExternalId = uuidV4();
    }
    if (!body.nonce) {
      body.nonce = crypto.randomBytes(32).toString('hex');
    }

    const payload = JSON.stringify(body);

    const prv = await this.wallet.getPrv({ walletPassphrase });
    const signedBuffer: Buffer = await this.wallet.baseCoin.signMessage({ prv }, payload);
    const signature = signedBuffer.toString('hex');

    return {
      ...body,
      payload,
      signature,
    };
  }

  createAllocation({
    connectionId,
    ...params
  }: CreateNetworkAllocationParams): Promise<CreateNetworkAllocationResponse> {
    const url = this.bitgo.microservicesUrl(
      `/api/network/v1/enterprises/${this.enterpriseId}/clients/connections/${connectionId}/allocations`
    );
    return this.bitgo.post(url).set('enterprise-id', this.enterpriseId).send(params).result();
  }

  createDeallocation({
    connectionId,
    ...params
  }: CreateNetworkDeallocationParams): Promise<CreateNetworkDeallocationResponse> {
    const url = this.bitgo.microservicesUrl(
      `/api/network/v1/enterprises/${this.enterpriseId}/clients/connections/${connectionId}/deallocations`
    );
    return this.bitgo.post(url).set('enterprise-id', this.enterpriseId).send(params).result();
  }

  getSettlements(params?: GetNetworkSettlementsParams): Promise<GetNetworkSettlementsResponse> {
    const url = this.bitgo.microservicesUrl(`/api/network/v1/enterprises/${this.enterpriseId}/clients/settlements`);
    return this.bitgo.get(url).set('enterprise-id', this.enterpriseId).send(params).result();
  }

  getSettlementById({
    settlementId,
    ...params
  }: GetNetworkSettlementByIdParams): Promise<GetNetworkSettlementByIdResponse> {
    const url = this.bitgo.microservicesUrl(
      `/api/network/v1/enterprises/${this.enterpriseId}/clients/settlements/${settlementId}`
    );
    return this.bitgo.get(url).set('enterprise-id', this.enterpriseId).send(params).result();
  }

  getSettlementTransfers(params?: GetNetworkSettlementTransfersParams): Promise<GetNetworkSettlementTransfersResponse> {
    const url = this.bitgo.microservicesUrl(
      `/api/network/v1/enterprises/${this.enterpriseId}/clients/settlementTransfers`
    );
    return this.bitgo.get(url).set('enterprise-id', this.enterpriseId).send(params).result();
  }
}
