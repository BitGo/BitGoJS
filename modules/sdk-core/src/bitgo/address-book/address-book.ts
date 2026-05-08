import { BitGoBase } from '../bitgoBase';
import { IWallet } from '../wallet';
import {
  AddressBookListing,
  CreateAddressBookConnectionParams,
  CreateAddressBookConnectionResponse,
  CreateAddressBookListingEntryParams,
  CreateAddressBookListingEntryResponse,
  CreateAddressBookListingParams,
  CreateAddressBookListingResponse,
  GetAddressBookConnectionsParams,
  GetAddressBookConnectionsResponse,
  GetAddressBookListingEntryContactsParams,
  GetAddressBookListingEntryContactsResponse,
  GetAddressBookListingEntryDirectoryParams,
  GetAddressBookListingEntryDirectoryResponse,
  GetAddressBookListingResponse,
  IAddressBook,
  UpdateAddressBookConnectionParams,
  UpdateAddressBookConnectionResponse,
  UpdateAddressBookListingEntryParams,
  UpdateAddressBookListingEntryResponse,
  UpdateAddressBookListingParams,
  UpdateAddressBookListingResponse,
} from './types';

export class AddressBook implements IAddressBook {
  private readonly bitgo: BitGoBase;
  private readonly enterpriseId: string;

  public wallet?: IWallet;
  private _listing?: AddressBookListing;

  constructor(enterpriseId: string, bitgo: BitGoBase, wallet?: IWallet) {
    this.enterpriseId = enterpriseId;
    this.wallet = wallet;
    this.bitgo = bitgo;
  }

  listing(): AddressBookListing | undefined {
    /**
     * TODO(PX-2794): Move to structuredClone
     * https://github.com/BitGo/BitGoJS/pull/4119
     */
    return JSON.parse(JSON.stringify(this._listing));
  }

  /**
   * Get a list of connections the wallet has made to other directory or manually added contacts.
   */
  getConnections(params?: GetAddressBookConnectionsParams): Promise<GetAddressBookConnectionsResponse> {
    const url = this.bitgo.microservicesUrl('/api/address-book/v1/connections');
    return this.bitgo.get(url).set('enterprise-id', this.enterpriseId).send(params).result();
  }

  /**
   * Create a connection between an enterprise listing entry (wallet) to another listing entry
   * @param params
   * @param {string} listingEntryId Your enterprise listing entry id. Requires the creation of a listing entry before use.
   * @param {string=} localListingEntryDescription Optional name to override the name of the counterparties listing entry.
   * @param {string} targetListingEntryId If you know the other parties listing entry id
   * @param {string} walletId If you don't know the targetListingEntryId and are adding manually
   * @param {string} localListingName Required if using walletId
   * @returns {Promise<CreateAddressBookConnectionResponse>}
   */
  createConnection(params: CreateAddressBookConnectionParams): Promise<CreateAddressBookConnectionResponse> {
    const url = this.bitgo.microservicesUrl('/api/address-book/v1/connections');
    return this.bitgo.post(url).set('enterprise-id', this.enterpriseId).send(params).result();
  }

  /**
   * Update one or many connections to a new status
   */
  updateConnection(params: UpdateAddressBookConnectionParams): Promise<UpdateAddressBookConnectionResponse> {
    const url = this.bitgo.microservicesUrl('/api/address-book/v1/connections');
    return this.bitgo.put(url).set('enterprise-id', this.enterpriseId).send(params).result();
  }

  /**
   * Get the address book listing for the enterprise
   */
  async getListing(): Promise<AddressBookListing> {
    const url = this.bitgo.microservicesUrl('/api/address-book/v1/listing/global');
    const response: GetAddressBookListingResponse = await this.bitgo
      .get(url)
      .set('enterprise-id', this.enterpriseId)
      .send()
      .result();
    this._listing = response;
    return this.listing() as AddressBookListing;
  }

  /**
   * Create the listing used for each wallet's listing entry
   */
  async createListing(params: CreateAddressBookListingParams): Promise<AddressBookListing> {
    const url = this.bitgo.microservicesUrl('/api/address-book/v1/listing/global');
    const response: CreateAddressBookListingResponse = await this.bitgo
      .post(url)
      .set('enterprise-id', this.enterpriseId)
      .send(params)
      .result();
    this._listing = { ...response, listingEntries: [] };
    return this.listing() as AddressBookListing;
  }

  /**
   * Update the name and description of the listing
   */
  async updateListing({ listingId, ...params }: UpdateAddressBookListingParams): Promise<AddressBookListing> {
    const url = this.bitgo.microservicesUrl(`/api/address-book/v1/listing/${listingId}`);
    const response: UpdateAddressBookListingResponse = await this.bitgo
      .put(url)
      .set('enterprise-id', this.enterpriseId)
      .send(params)
      .result();
    this._listing = { ...response, listingEntries: this._listing?.listingEntries ? this._listing.listingEntries : [] };
    return this.listing() as AddressBookListing;
  }

  /**
   * Return a list of listing entry contacts that are connected to your enterprise listing entries (wallets)
   */
  getListingEntryContacts(
    params?: GetAddressBookListingEntryContactsParams
  ): Promise<GetAddressBookListingEntryContactsResponse> {
    const url = this.bitgo.microservicesUrl('/api/address-book/v1/listing/entry/contacts');
    return this.bitgo.get(url).set('enterprise-id', this.enterpriseId).send(params).result();
  }

  /**
   * Return a public list of other listing entries that you can connect with.
   */
  getListingEntryDirectory(
    params?: GetAddressBookListingEntryDirectoryParams
  ): Promise<GetAddressBookListingEntryDirectoryResponse> {
    const url = this.bitgo.microservicesUrl('/api/address-book/v1/listing/entry/directory');
    return this.bitgo.get(url).set('enterprise-id', this.enterpriseId).send(params).result();
  }

  /**
   * Create a listing entry for use in the public directory or keep private and share the listing entry id with others.
   */
  async createListingEntry(
    params: Omit<CreateAddressBookListingEntryParams, 'walletId'> & {
      walletId?: string;
    }
  ): Promise<CreateAddressBookListingEntryResponse> {
    if (!params.walletId && this.wallet) {
      params.walletId = this.wallet.id();
    }
    const url = this.bitgo.microservicesUrl('/api/address-book/v1/listing/entry/global');
    const response: CreateAddressBookListingEntryResponse = await this.bitgo
      .post(url)
      .set('enterprise-id', this.enterpriseId)
      .send(params)
      .result();
    if (this._listing) {
      this._listing.listingEntries?.push({ ...response });
    }
    return response;
  }

  /**
   * Update a listing entry (wallet)
   */
  async updateListingEntry({
    listingEntryId,
    ...params
  }: UpdateAddressBookListingEntryParams): Promise<UpdateAddressBookListingEntryResponse> {
    const url = this.bitgo.microservicesUrl(`/api/address-book/v1/listing/entry/${listingEntryId}`);
    const response: UpdateAddressBookListingEntryResponse = await this.bitgo
      .put(url)
      .set('enterprise-id', this.enterpriseId)
      .send(params)
      .result();
    if (this._listing) {
      const index = this._listing?.listingEntries?.findIndex((x) => x.id === response.id) ?? -1;
      if (index > -1 && this._listing.listingEntries) {
        this._listing.listingEntries[index] = { ...response };
      } else {
        this._listing.listingEntries?.push({ ...response });
      }
    }
    return response;
  }
}
