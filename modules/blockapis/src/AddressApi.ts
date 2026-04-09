export type AddressInfo = {
  /** number of transactions affecting the address */
  txCount: number;
  /** the aggregate value available for the address */
  balance: number;
};

/**
 * Methods related to basic address data
 */
export interface AddressApi {
  /** @return Address info for address */
  getAddressInfo(address: string): Promise<AddressInfo>;
}
