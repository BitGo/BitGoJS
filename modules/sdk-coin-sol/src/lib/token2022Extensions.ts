/// <reference types="node" />

import { AccountInfo, AccountMeta, clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import { bool, publicKey, u64 } from '@solana/buffer-layout-utils';
import { NetworkType } from '@bitgo/statics';
import { blob, greedy, seq, u8, struct, u32 } from '@solana/buffer-layout';

export const TransferHookLayout = struct<TransferHook>([publicKey('authority'), publicKey('programId')]);

/**
 * Fetch all extension accounts for Token-2022 tokens
 * This includes accounts for transfer hooks, transfer fees, metadata, and other extensions
 * @param tokenAddress - The mint address of the Token-2022 token
 * @param network TESTNET/MAINNET
 * @returns Array of AccountMeta objects for all extensions, or undefined if none
 */
type Mint = splToken.Mint;

export async function fetchExtensionAccounts(
  tokenAddress: string,
  network?: NetworkType
): Promise<AccountMeta[] | undefined> {
  try {
    const connection = getSolanaConnection(network);
    const mintPubkey = new PublicKey(tokenAddress);
    const extensionAccounts: AccountMeta[] = [];

    let extensionTypes: ExtensionType[] = [];

    let mint: Mint | null = null;
    try {
      const mintAccount = await connection.getAccountInfo(mintPubkey);
      mint = splToken.unpackMint(mintPubkey, mintAccount, splToken.TOKEN_2022_PROGRAM_ID);
      extensionTypes = getExtensionTypes(mint.tlvData);
      console.log('extensions', extensionTypes);
    } catch (error) {
      console.debug('Failed to decode mint data:', error);
      return undefined;
    }

    for (const extensionType of extensionTypes) {
      switch (extensionType) {
        case ExtensionType.TransferHook:
          try {
            const transferHookAccounts = await processTransferHook(mint, mintPubkey, connection);
            extensionAccounts.push(...transferHookAccounts);
          } catch (error) {
            console.debug('Error processing transfer hook extension:', error);
          }
          break;
        case ExtensionType.TransferFeeConfig:
          console.debug('Transfer fee extension detected');
          break;
        // Other extensions can be implemented as and when required
        default:
          console.debug(`Extension type ${extensionType} detected`);
      }
    }
    return extensionAccounts.length > 0 ? extensionAccounts : undefined;
  } catch (error) {
    console.warn('Failed to fetch extension accounts:', error);
  }
  return undefined;
}

/**
 * Get or create a connection to the Solana network based on coin name
 * @returns Connection instance for the appropriate network
 * @param network
 */
export function getSolanaConnection(network?: NetworkType): Connection {
  const isTestnet = network === NetworkType.TESTNET;
  if (isTestnet) {
    return new Connection(clusterApiUrl('devnet'), 'confirmed');
  } else {
    return new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
  }
}

/**
 * Process transfer hook extension and extract account metas
 * @param mint - The decoded mint data
 * @param mintPubkey - The mint public key
 * @param connection - Solana connection
 * @returns Array of AccountMeta objects for transfer hook accounts
 * @private
 */
async function processTransferHook(
  mint: Mint | null,
  mintPubkey: PublicKey,
  connection: Connection
): Promise<AccountMeta[]> {
  const accounts: AccountMeta[] = [];
  if (!mint) {
    return accounts;
  }
  const transferHookData = getTransferHook(mint);
  if (!transferHookData) {
    return accounts;
  }
  try {
    // Get the ExtraAccountMetaList PDA
    const extraMetaPda = getExtraAccountMetaAddress(mintPubkey, transferHookData.programId);

    // Fetch the account info for the extra meta PDA
    const extraMetaAccount = await connection.getAccountInfo(extraMetaPda);

    if (extraMetaAccount) {
      // Fetch and parse extra account metas
      const extraMetas = getExtraAccountMetas(extraMetaAccount);
      // Add each extra account meta to the list
      for (const meta of extraMetas) {
        // For static pubkey (discriminator 0), the addressConfig contains the pubkey bytes
        accounts.push({
          pubkey: new PublicKey(meta.addressConfig),
          isSigner: meta.isSigner,
          isWritable: meta.isWritable,
        });
        // Other discriminator types would need different handling
      }
    }
  } catch (error) {
    console.error('Error finding PDA:', error);
  }
  return accounts;
}

export function getExtraAccountMetaAddress(mint: PublicKey, programId: PublicKey): PublicKey {
  const seeds = [Buffer.from('extra-account-metas'), mint.toBuffer()];
  return PublicKey.findProgramAddressSync(seeds, programId)[0];
}

export interface TransferHook {
  /** The transfer hook update authority */
  authority: PublicKey;
  /** The transfer hook program account */
  programId: PublicKey;
}

/** Buffer layout for de/serializing a list of ExtraAccountMetaAccountData prefixed by a u32 length */
export interface ExtraAccountMetaAccountData {
  instructionDiscriminator: bigint;
  length: number;
  extraAccountsList: ExtraAccountMetaList;
}

export interface ExtraAccountMetaList {
  count: number;
  extraAccounts: ExtraAccountMeta[];
}

/** Buffer layout for de/serializing an ExtraAccountMeta */
export const ExtraAccountMetaLayout = struct<ExtraAccountMeta>([
  u8('discriminator'),
  blob(32, 'addressConfig'),
  bool('isSigner'),
  bool('isWritable'),
]);

/** Buffer layout for de/serializing a list of ExtraAccountMeta prefixed by a u32 length */
export const ExtraAccountMetaListLayout = struct<ExtraAccountMetaList>([
  u32('count'),
  seq<ExtraAccountMeta>(ExtraAccountMetaLayout, greedy(ExtraAccountMetaLayout.span), 'extraAccounts'),
]);

export const ExtraAccountMetaAccountDataLayout = struct<ExtraAccountMetaAccountData>([
  u64('instructionDiscriminator'),
  u32('length'),
  ExtraAccountMetaListLayout.replicate('extraAccountsList'),
]);

/** ExtraAccountMeta as stored by the transfer hook program */
export interface ExtraAccountMeta {
  discriminator: number;
  addressConfig: Uint8Array;
  isSigner: boolean;
  isWritable: boolean;
}

/** Unpack an extra account metas account and parse the data into a list of ExtraAccountMetas */
export function getExtraAccountMetas(account: AccountInfo<Buffer>): ExtraAccountMeta[] {
  const extraAccountsList = ExtraAccountMetaAccountDataLayout.decode(account.data).extraAccountsList;
  return extraAccountsList.extraAccounts.slice(0, extraAccountsList.count);
}

export function getTransferHook(mint: Mint): TransferHook | null {
  const extensionData = getExtensionData(ExtensionType.TransferHook, mint.tlvData);
  if (extensionData !== null) {
    return TransferHookLayout.decode(extensionData);
  } else {
    return null;
  }
}

export function getExtensionData(extension: ExtensionType, tlvData: Buffer): Buffer | null {
  let extensionTypeIndex = 0;
  while (addTypeAndLengthToLen(extensionTypeIndex) <= tlvData.length) {
    const entryType = tlvData.readUInt16LE(extensionTypeIndex);
    const entryLength = tlvData.readUInt16LE(extensionTypeIndex + TYPE_SIZE);
    const typeIndex = addTypeAndLengthToLen(extensionTypeIndex);
    if (entryType == extension) {
      return tlvData.slice(typeIndex, typeIndex + entryLength);
    }
    extensionTypeIndex = typeIndex + entryLength;
  }
  return null;
}

const TYPE_SIZE = 2;
const LENGTH_SIZE = 2;

function addTypeAndLengthToLen(len: number): number {
  return len + TYPE_SIZE + LENGTH_SIZE;
}

export function getExtensionTypes(tlvData: Buffer): ExtensionType[] {
  const extensionTypes: number[] = [];
  let extensionTypeIndex = 0;
  while (extensionTypeIndex < tlvData.length) {
    const entryType = tlvData.readUInt16LE(extensionTypeIndex);
    extensionTypes.push(entryType);
    const entryLength = tlvData.readUInt16LE(extensionTypeIndex + TYPE_SIZE);
    extensionTypeIndex += TYPE_SIZE + LENGTH_SIZE + entryLength;
  }
  return extensionTypes;
}

export enum ExtensionType {
  Uninitialized,
  TransferFeeConfig,
  TransferHook = 14,
}
