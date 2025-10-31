export const APT_ADDRESS_LENGTH = 64;
export const APT_TRANSACTION_ID_LENGTH = 64;
export const APT_BLOCK_ID_LENGTH = 64;
export const APT_SIGNATURE_LENGTH = 128;
export const UNAVAILABLE_TEXT = 'UNAVAILABLE';
export const DEFAULT_GAS_UNIT_PRICE = 100;
export const SECONDS_PER_WEEK = 7 * 24 * 60 * 60; // Days * Hours * Minutes * Seconds
export const ADDRESS_BYTES_LENGTH = 32;
export const AMOUNT_BYTES_LENGTH = 8;

export const DIGITAL_ASSET_TRANSFER_AMOUNT = '1';

export const FUNGIBLE_ASSET_TRANSFER_FUNCTION = '0x1::primary_fungible_store::transfer';
export const FUNGIBLE_ASSET_BATCH_TRANSFER_FUNCTION = '0x1::aptos_account::batch_transfer_fungible_assets';
export const COIN_TRANSFER_FUNCTION = '0x1::aptos_account::transfer_coins';
export const COIN_BATCH_TRANSFER_FUNCTION = '0x1::aptos_account::batch_transfer_coins';
export const DIGITAL_ASSET_TRANSFER_FUNCTION = '0x1::object::transfer';
export const DELEGATION_POOL_ADD_STAKE_FUNCTION = '0x1::delegation_pool::add_stake';
export const DELEGATION_POOL_UNLOCK_FUNCTION = '0x1::delegation_pool::unlock';
export const DELEGATION_POOL_WITHDRAW_FUNCTION = '0x1::delegation_pool::withdraw';

export const APTOS_COIN = '0x1::aptos_coin::AptosCoin';
export const FUNGIBLE_ASSET_TYPE_ARGUMENT = '0x1::fungible_asset::Metadata';
export const DIGITAL_ASSET_TYPE_ARGUMENT = '0x4::token::Token';

export const FUNBIGLE_ASSET_TYPE_TAG = '0x1::object::Object';
export const BATCH_FUNGIBLE_ASSET_TYPE_TAG = '0x1::object::Object<0x1::fungible_asset::Metadata>';
