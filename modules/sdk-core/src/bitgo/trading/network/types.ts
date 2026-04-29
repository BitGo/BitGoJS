export interface ITradingNetwork {
  getBalances: (params?: GetNetworkBalancesParams) => Promise<GetNetworkBalancesResponse>;
  getPartners: (params?: GetNetworkPartnersParams) => Promise<GetNetworkPartnersResponse>;
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

export type GetNetworkBalancesParams = NetworkPaginationParams & {
  connectionIds?: string[];
  partnerIds?: string[];
};

export type GetNetworkBalancesResponse = {
  clientId: string;
  // ofc coin
  balances: Record<string, NetworkAccountBalanceRecord>;
  // connectionId
  networkBalances: Record<string, NetworkBalance>;
};

export type GetNetworkPartnersParams = NetworkPaginationParams & {
  ids?: string[];
  names?: string[];
  institutionIds?: string[];
  institutionIdentifiers?: string[];
  active?: boolean;
};

export type GetNetworkPartnersResponse = {
  partners: NetworkPartner[];
};

export type GetNetworkSupportedCurrenciesParams = {
  partnerIds: string[];
};

export type GetNetworkSupportedCurrenciesResponse = {
  supportedCurrencies: Record<string, V1SupportedCurrency[]>;
  domain: string;
};

/** Connections */

export type GetNetworkConnectionsParams = NetworkPaginationParams & {
  active?: string;
  connectionIds?: string;
  partnerIds?: string;
  names?: string;
};

export type GetNetworkConnectionsResponse = {
  connections: NetworkConnection[];
};

export type GetNetworkConnectionByIdParams = {
  connectionId: string;
};

export type GetNetworkConnectionByIdResponse = {
  connection: NetworkConnection;
};

export type CreateNetworkConnectionParams = {
  partnerId: string;
  name: string;
  connectionKey: NetworkConnectionKey;
  nonce: string;
  payload: string;
  signature: string;
};

export type CreateNetworkConnectionResponse = {
  connection: NetworkConnection;
};

export type UpdateNetworkConnectionParams = {
  connectionId: string;
  name?: string;
  active?: boolean;
};

export type UpdateNetworkConnectionResponse = {
  connection: NetworkConnection;
};

/** Allocations */

export type GetNetworkAllocationsParams = NetworkPaginationParams & {
  sortField?: 'id' | 'updatedAt' | 'quantity' | 'currency';
  sortDirection?: NetworkSortDirection;
  allocationIds?: string[];
  types?: NetworkAllocationType[];
  statuses?: NetworkAllocationStatus[];
  currencies?: string[];
  connectionIds?: string[];
  partnerIds?: string[];
};

export type GetNetworkAllocationsResponse = {
  allocations: NetworkAllocation[];
};

export type GetNetworkAllocationByIdParams = {
  allocationId: string;
};

export type GetNetworkAllocationByIdResponse = {
  allocation: NetworkAllocation;
};

export type PrepareNetworkAllocationParams = Omit<CreateNetworkAllocationParams, 'payload' | 'signature'> & {
  walletPassphrase: string;
  clientExternalId?: string;
  nonce?: string;
};

export type CreateNetworkAllocationParams = {
  connectionId: string;
  payload: string;
  signature: string;
  amount: NetworkAllocationAmount;
  clientExternalId: string;
  nonce: string;
  notes?: string;
};

export type CreateNetworkAllocationResponse = {
  allocation: NetworkAllocation;
};

/** Deallocations */

export type CreateNetworkDeallocationParams = {
  connectionId: string;
  payload: string;
  signature: string;
  amount: NetworkAllocationAmount;
  clientExternalId: string;
  nonce: string;
  notes?: string;
};

export type CreateNetworkDeallocationResponse = {
  allocation: NetworkAllocation;
};

export type GetNetworkSettlementsParams = NetworkPaginationParams & {
  settlementIds?: string[];
  partnerIds?: string[];
  partyConnectionIds?: string[];
  counterpartyConnectionIds?: string[];
};

export type GetNetworkSettlementsResponse = {
  settlements: NetworkSettlement[];
};

export type GetNetworkSettlementByIdParams = NetworkPaginationParams & {
  settlementId: string;
  currencies?: string[];
};

export type GetNetworkSettlementByIdResponse = {
  settlement: NetworkSettlement;
  settlementTransfers: NetworkSettlementTransfer[];
};

export type GetNetworkSettlementTransfersParams = NetworkPaginationParams & {
  currencies?: string[];
  initiatedBy?: string[];
  partnerIds?: string[];
  settlementIds?: string[];
  settlementStatuses?: NetworkSettlementStatus[];
  settlementUpdatedBefore?: string;
  settlementUpdatedOnOrAfter?: string;
};

export type GetNetworkSettlementTransfersResponse = {
  settlementTransfers: NetworkSettlementTransfer[];
};

// METHOD ARTIFACTS

type NetworkPaginationParams = {
  pageNumber?: string | number;
  pageSize?: string | number;
};

type NetworkSortDirection = 'ASC' | 'DESC';

export type NetworkAccountBalanceRecord = {
  available: string;
  held: string;
};

export type NetworkBalance = {
  balances: Record<string, NetworkAccountBalanceRecord>;
  name: string;
  partnerId: string;
  partnerInstitutionIdentifier: string;
  partnersConnectionId: string;
};

export type V1SupportedCurrency = {
  ofcCurrency: string;
  backingCurrency: string;
  partnerNames: string[];
};

export type NetworkConnection = {
  active: boolean;
  clientId: string;
  initialized: boolean;
  name: string;
  partnersConnectionId: string;
  partnersClientId: string;
  partnerId: string;
  networkAccountId: string;
  proof: string;
  nonce: string;
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type NetworkConnectionKey =
  | NetworkConnectionKeyToken
  | NetworkConnectionKeyTokenAndSignature
  | NetworkConnectionKeyApiKeyAndSecret
  | NetworkConnectionKeyClearloop;

export type NetworkConnectionKeyToken = {
  schema: 'token';
  connectionToken: string;
};

export type NetworkConnectionKeyTokenAndSignature = {
  schema: 'tokenAndSignature';
  connectionToken: string;
  signature: string;
};

export type NetworkConnectionKeyApiKeyAndSecret = {
  schema: 'apiKeyAndSecret';
  apiKey: string;
  apiSecret: string;
};

export type NetworkConnectionKeyClearloop = Omit<NetworkConnectionKeyApiKeyAndSecret, 'schema'> & {
  schema: 'clearloop';
  clientAccountId: string;
  companyRegistrationNumber: string;
};

export type NetworkAllocationType = 'allocation' | 'deallocation';
export type NetworkAllocationStatus = 'cleared' | 'released' | 'reserved';

export type NetworkAllocation = {
  reason: string;
  status: NetworkAllocationStatus;
  type: NetworkAllocationType;
  id: string;
  amount: NetworkAllocationAmount;
  connectionId: string;
  clientExternalId: string;
  partnerExternalId?: string;
  initiatedBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type NetworkAllocationAmount = {
  currency: string;
  quantity?: string;
};

export type NetworkDeallocation = NetworkAllocation;

export type NetworkSettlement = {
  status: NetworkSettlementStatus;
  reason?: string;
  id: string;
  partnerId: string;
  externalId: string;
  reconciled: boolean;
  initiatedBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type NetworkSettlementTransfer = {
  id: string;
  currency: string;
  settlementId: string;
  quantity: string;
  txIds: string[];
  settlementStatus: NetworkSettlementStatus;
  settlementNotes?: string;
  sourceTradingAccountId?: string;
  sourceClientName?: string;
  destinationTradingAccountId?: string;
  destinationClientName?: string;
  sourceNetworkAccountId?: string;
  sourceConnectionName?: string;
  destinationNetworkAccountId?: string;
  destinationConnectionName?: string;
  createdAt: string;
  updatedAt: string;
};

export type NetworkSettlementStatus = 'failed' | 'completed' | 'pending';

export type ConnectionKeySchema = 'token' | 'tokenAndSignature' | 'apiKeyAndSecret' | 'clearloop';

export type NetworkPartner = {
  id: string;
  name: string;
  institutionId: string;
  institutionIdentifier: string;
  connectionKeySchema: ConnectionKeySchema;
  active: boolean;
  publicKey?: string;
};
