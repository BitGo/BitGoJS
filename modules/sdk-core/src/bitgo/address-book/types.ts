export interface IAddressBook {
  getConnections: (params?: GetAddressBookConnectionsParams) => Promise<GetAddressBookConnectionsResponse>;
  createConnection: (params: CreateAddressBookConnectionParams) => Promise<CreateAddressBookConnectionResponse>;
  updateConnection: (params: UpdateAddressBookConnectionParams) => Promise<UpdateAddressBookConnectionResponse>;
  getListing: () => Promise<AddressBookListing>;
  createListing: (params: CreateAddressBookListingParams) => Promise<AddressBookListing>;
  updateListing: (params: UpdateAddressBookListingParams) => Promise<UpdateAddressBookListingResponse>;
  getListingEntryContacts: (
    params?: GetAddressBookListingEntryContactsParams
  ) => Promise<GetAddressBookListingEntryContactsResponse>;
  getListingEntryDirectory: (
    params?: GetAddressBookListingEntryDirectoryParams
  ) => Promise<GetAddressBookListingEntryDirectoryResponse>;
  createListingEntry: (params: CreateAddressBookListingEntryParams) => Promise<CreateAddressBookListingEntryResponse>;
  updateListingEntry: (params: UpdateAddressBookListingEntryParams) => Promise<UpdateAddressBookListingEntryResponse>;
}

// METHOD TYPES

/** Connections */

export type GetAddressBookConnectionsParams = AddressBookQueryPaginationParams & {
  listingTypeId?: string;
  id?: string;
  status?: AddressBookConnectionStatus;
  connectionType?: AddressBookConnectionType;
  orderBy?: AddressBookListingConnectionSortableFields;
  orderDirection?: AddressBookListingConnectionDirection;
  ownerWalletId?: string[];
  targetWalletId?: string[];
};

export type GetAddressBookConnectionsResponse = {
  connections: (AddressBookConnection & {
    ownerListingEntry: AddressBookConnectionListingEntry;
    targetListingEntry: AddressBookConnectionListingEntry;
  })[];
};

export type CreateAddressBookConnectionParams = CreateAddressBookCommonConnectionParams &
  (CreateAddressBookDirectoryConnectionParams | CreateAddressBookWalletConnectionParams);

export type CreateAddressBookCommonConnectionParams = {
  listingEntryId: string;
  localListingEntryDescription?: string;
};

export type CreateAddressBookDirectoryConnectionParams = {
  targetListingEntryId: string;
};

export type CreateAddressBookWalletConnectionParams = {
  walletId: string;
  localListingName: string;
  localListingDescription?: string;
};

export type CreateAddressBookConnectionResponse = {
  connection: AddressBookConnection;
};

export type UpdateAddressBookConnectionParams = {
  connectionIds: string[];
  status: 'PENDING_ACTIVATION' | 'PENDING_DEACTIVATION';
};

export type UpdateAddressBookConnectionResponse = {
  connections: AddressBookConnection[];
};

/** Listings */

export type GetAddressBookListingResponse = AddressBookListing;

export type CreateAddressBookListingParams = {
  description?: string;
};

export type CreateAddressBookListingResponse = AddressBookListing;

export type UpdateAddressBookListingParams = {
  listingId: string;
  description?: string;
  name?: string;
};

export type UpdateAddressBookListingResponse = AddressBookListing;

/** Listing Entries */

export type GetAddressBookListingEntryContactsParams = AddressBookQueryPaginationParams & {
  id?: string;
  name?: string;
  coin?: string;
  entryType?: AddressBookEntryType;
  orderBy?: AddressBookListingEntrySortableFields;
  orderDirection?: AddressBookListingEntryDirection;
  status?: 'ACTIVE' | 'INACTIVE';
};

export type GetAddressBookListingEntryContactsResponse = {
  listingEntries: AddressBookListingEntryContact[];
};

export type GetAddressBookListingEntryDirectoryParams = AddressBookQueryPaginationParams & {
  name?: string;
  coin?: string;
  entryType?: AddressBookEntryType;
  orderBy?: AddressBookListingEntrySortableFields;
  orderDirection?: AddressBookListingEntryDirection;
  status?: 'ACTIVE' | 'INACTIVE';
};

export type GetAddressBookListingEntryDirectoryResponse = {
  listingEntries: AddressBookListingEntryContact[];
};

export type CreateAddressBookListingEntryParams = {
  walletId: string;
  description?: string;
  public: boolean;
};

export type CreateAddressBookListingEntryResponse = AddressBookListingEntry;

export type UpdateAddressBookListingEntryParams = {
  listingEntryId: string;
  description?: string;
  public?: boolean;
};

export type UpdateAddressBookListingEntryResponse = AddressBookListingEntry;

// METHOD ARTIFACTS

export type AddressBookQueryPaginationParams = {
  offset?: string | number;
  limit?: string | number;
};

export type AddressBookConnection = {
  id: string;
  label: string;
  status: AddressBookConnectionStatus;
  type: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
};

type AddressBookListingConnectionDirection = 'ASC' | 'DESC';

type AddressBookListingConnectionSortableFields = 'description' | 'connectionType' | 'createdAt' | 'updatedAt';

export type AddressBookConnectionStatus = 'PENDING_ACTIVATION' | 'ACTIVE' | 'INACTIVE' | 'PENDING_DEACTIVATION';

export type AddressBookConnectionType = 'DVP';

export type AddressBookConnectionListingEntry = {
  id: string;
  walletId: string;
  coin: string;
  type: string;
  description: string;
  discoverable: boolean;
  listing: AddressBookConnectionListing;
  createdAt: string;
  updatedAt: string;
};

export type AddressBookConnectionListing = {
  id: string;
  name: string;
  description?: string;
  editable?: boolean;
};

export type AddressBookListing = {
  id: string;
  enterpriseId: string;
  description?: string;
  name: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  listingEntries?: AddressBookListingEntry[];
};

export type AddressBookListingEntry = {
  id: string;
  listingId: string;
  globalListingEntryId?: string;
  walletId: string;
  coin: string;
  type: AddressBookEntryType;
  description?: string;
  discoverable: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AddressBookEntryType = 'GO_ACCOUNT';

type AddressBookListingEntrySortableFields =
  | 'listing.name'
  | 'description'
  | 'coin'
  | 'entryType'
  | 'createdAt'
  | 'updatedAt';

type AddressBookListingEntryDirection = 'ASC' | 'DESC';

export type AddressBookListingEntryContact = AddressBookListingEntry & {
  listing: AddressBookConnectionListing;
  connections: (AddressBookConnection & {
    ownerListingEntry: Omit<AddressBookListingEntry, 'listingId' | 'globalListingEntryId'> & {
      listing: AddressBookConnectionListing;
    };
  })[];
};
