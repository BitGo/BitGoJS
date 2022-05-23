export enum TradingPartnerStatus {
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELED = 'canceled',
  PENDING = 'pending',
}

// Type of partnership used for settlements
export enum TradingPartnerType {
  DIRECT = 'direct', // direct settlement between requester and counterparty
  AGENCY = 'agency', // agent settlement between two counterparties of the agent
}

export interface ITradingPartner {
  checkBalance(currency: string, amount: string): Promise<boolean>;
}
