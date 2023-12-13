import { paths } from '@bitgo/sdk-types';

export interface ITradingNetwork {
  getBalances: (params?: GetNetworkBalancesParams) => Promise<GetNetworkBalancesResponse>;
  getSupportedCurrencies: (
    params: GetNetworkSupportedCurrenciesParams
  ) => Promise<GetNetworkSupportedCurrenciesResponse>;
  getConnections: (params?: GetNetworkConnectionsParams) => Promise<GetNetworkConnectionsResponse>;
  getConnectionById: (params: GetNetworkConnectionByIdParams) => Promise<GetNetworkConnectionByIdResponse>;
  createConnection: (params: CreateNetworkConnectionParams) => Promise<CreateNetworkConnectionResponse>;
  updateConnection: (params: UpdateNetworkConnectionParams) => Promise<UpdateNetworkConnectionResponse>;
  getAllocations: (params?: GetNetworkAllocationsParams) => Promise<GetNetworkAllocationsResponse>;
  getAllocationById: (params: GetNetworkAllocationByIdParams) => Promise<GetNetworkAllocationByIdResponse>;
  createAllocation: (params: CreateNetworkAllocationParams) => Promise<CreateNetworkAllocationResponse>;
  createDeallocation: (params: CreateNetworkDeallocationParams) => Promise<CreateNetworkDeallocationResponse>;
  getSettlements: (params?: GetNetworkSettlementsParams) => Promise<GetNetworkSettlementsResponse>;
  getSettlementById: (params: GetNetworkSettlementByIdParams) => Promise<GetNetworkSettlementByIdResponse>;
  getSettlementTransfers: (
    params?: GetNetworkSettlementTransfersParams
  ) => Promise<GetNetworkSettlementTransfersResponse>;
}

// METHOD TYPES

export type GetNetworkBalancesParams =
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/balances']['get']['parameters']['query'];

export type GetNetworkBalancesResponse =
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/balances']['get']['responses'][200]['content']['application/json'];

export type GetNetworkSupportedCurrenciesParams =
  paths['/api/network/v1/enterprises/{enterpriseId}/supportedCurrencies']['get']['parameters']['query'];

export type GetNetworkSupportedCurrenciesResponse =
  paths['/api/network/v1/enterprises/{enterpriseId}/supportedCurrencies']['get']['responses'][200]['content']['application/json'];

/** Connections */

export type GetNetworkConnectionsParams =
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/connections']['get']['parameters']['query'];

export type GetNetworkConnectionsResponse =
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/connections']['get']['responses'][200]['content']['application/json'];

export type GetNetworkConnectionByIdParams = Omit<
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/connections/{connectionId}']['get']['parameters']['path'],
  'enterpriseId'
>;

export type GetNetworkConnectionByIdResponse =
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/connections/{connectionId}']['get']['responses'][200]['content']['application/json'];

export type CreateNetworkConnectionParams =
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/connections']['post']['requestBody']['content']['application/json'];

export type CreateNetworkConnectionResponse =
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/connections']['post']['responses'][200]['content']['application/json'];

export type UpdateNetworkConnectionParams = Omit<
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/connections/{connectionId}']['put']['parameters']['path'],
  'enterpriseId'
> &
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/connections/{connectionId}']['put']['requestBody']['content']['application/json'];

export type UpdateNetworkConnectionResponse =
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/connections/{connectionId}']['put']['responses'][200]['content']['application/json'];

/** Allocations */

export type GetNetworkAllocationsParams =
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/allocations']['get']['parameters']['query'];

export type GetNetworkAllocationsResponse =
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/allocations']['get']['responses'][200]['content']['application/json'];

export type GetNetworkAllocationByIdParams = Omit<
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/allocations/{allocationId}']['get']['parameters']['path'],
  'enterpriseId'
>;

export type GetNetworkAllocationByIdResponse =
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/allocations/{allocationId}']['get']['responses'][200]['content']['application/json'];

export type PrepareNetworkAllocationParams = Omit<CreateNetworkAllocationParams, 'payload' | 'signature'> & {
  walletPassphrase: string;
  clientExternalId?: string;
  nonce?: string;
};

export type CreateNetworkAllocationParams = Omit<
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/connections/{connectionId}/allocations']['post']['parameters']['path'],
  'enterpriseId'
> &
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/connections/{connectionId}/allocations']['post']['requestBody']['content']['application/json'];

export type CreateNetworkAllocationResponse =
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/connections/{connectionId}/allocations']['post']['responses'][200]['content']['application/json'];

/** Deallocations */

export type CreateNetworkDeallocationParams = Omit<
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/connections/{connectionId}/deallocations']['post']['parameters']['path'],
  'enterpriseId'
> &
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/connections/{connectionId}/deallocations']['post']['requestBody']['content']['application/json'];

export type CreateNetworkDeallocationResponse =
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/connections/{connectionId}/deallocations']['post']['responses'][200]['content']['application/json'];

export type GetNetworkSettlementsParams =
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/settlements']['get']['parameters']['query'];

export type GetNetworkSettlementsResponse =
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/settlements']['get']['responses'][200]['content']['application/json'];

export type GetNetworkSettlementByIdParams = Omit<
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/settlements/{settlementId}']['get']['parameters']['path'],
  'enterpriseId'
> &
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/settlements/{settlementId}']['get']['parameters']['query'];

export type GetNetworkSettlementByIdResponse =
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/settlements/{settlementId}']['get']['responses'][200]['content']['application/json'];

export type GetNetworkSettlementTransfersParams =
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/settlementTransfers']['get']['parameters']['query'];

export type GetNetworkSettlementTransfersResponse =
  paths['/api/network/v1/enterprises/{enterpriseId}/clients/settlementTransfers']['get']['responses'][200]['content']['application/json'];
