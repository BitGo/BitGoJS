/**
 * @prettier
 */

import * as debugLib from 'debug';
import * as _ from 'lodash';
import {
  AddressVerificationData,
  IRequestTracer,
  InvalidAddressDerivationPropertyError,
  IWallet,
  Keychain,
  TransactionPrebuild,
  UnexpectedAddressError,
  VerificationOptions,
} from '@bitgo/sdk-core';
import { AbstractUtxoCoin, Output, TransactionParams, isWalletOutput } from './abstractUtxoCoin';

const debug = debugLib('bitgo:v2:parseoutput');

interface HandleVerifyAddressErrorResponse {
  external: boolean;
  needsCustomChangeKeySignatureVerification?: boolean;
}

/**
 * Check an address which failed initial validation to see if it's the base address of a migrated v1 bch wallet.
 *
 * The wallet in question could be a migrated SafeHD BCH wallet, and the transaction we
 * are currently parsing is trying to spend change back to the v1 wallet base address.
 *
 * It does this since we don't allow new address creation for these wallets,
 * and instead return the base address from the v1 wallet when a new address is requested.
 * If this new address is requested for the purposes of spending change back to the wallet,
 * the change will go to the v1 wallet base address. This address *is* on the wallet,
 * but it will still cause an error to be thrown by verifyAddress, since the derivation path
 * used for this address is non-standard. (I have seen these addresses derived using paths m/0/0 and m/101,
 * whereas the v2 addresses are derived using path  m/0/0/${chain}/${index}).
 *
 * This means we need to check for this case explicitly in this catch block, and classify
 * these types of outputs as internal instead of external. Failing to do so would cause the
 * transaction's implicit external outputs (ie, outputs which go to addresses not specified in
 * the recipients array) to add up to more than the 150 basis point limit which we enforce on
 * pay-as-you-go outputs (which should be the only implicit external outputs on our transactions).
 *
 * The 150 basis point limit for implicit external sends is enforced in verifyTransaction,
 * which calls this function to get information on the total external/internal spend amounts
 * for a transaction. The idea here is to protect from the transaction being maliciously modified
 * to add more implicit external spends (eg, to an attacker-controlled wallet).
 *
 * See verifyTransaction for more information on how transaction prebuilds are verified before signing.
 *
 * @param wallet {Wallet} wallet which is making the transaction
 * @param currentAddress {string} address to check for externality relative to v1 wallet base address
 */
function isMigratedAddress(wallet: IWallet, currentAddress: string): boolean {
  if (_.isString(wallet.migratedFrom()) && wallet.migratedFrom() === currentAddress) {
    debug('found address %s which was migrated from v1 wallet, address is not external', currentAddress);
    return true;
  }

  return false;
}

interface VerifyCustomChangeAddressOptions {
  coin: AbstractUtxoCoin;
  customChangeKeys: HandleVerifyAddressErrorOptions['customChangeKeys'];
  addressType: HandleVerifyAddressErrorOptions['addressType'];
  addressDetails: HandleVerifyAddressErrorOptions['addressDetails'];
  currentAddress: HandleVerifyAddressErrorOptions['currentAddress'];
}

/**
 * Check to see if an address is derived from the given custom change keys
 * @param {VerifyCustomChangeAddressOptions} params
 * @return {boolean}
 */
async function verifyCustomChangeAddress(params: VerifyCustomChangeAddressOptions): Promise<boolean> {
  const { coin, customChangeKeys, addressType, addressDetails, currentAddress } = params;
  try {
    return await coin.verifyAddress(
      _.extend({ addressType }, addressDetails, {
        keychains: customChangeKeys,
        address: currentAddress,
      })
    );
  } catch (e) {
    debug('failed to verify custom change address %s', currentAddress);
    return false;
  }
}

interface HandleVerifyAddressErrorOptions {
  e: Error;
  currentAddress: string;
  wallet: IWallet;
  txParams: TransactionParams;
  customChangeKeys?: CustomChangeOptions['keys'];
  coin: AbstractUtxoCoin;
  addressDetails?: any;
  addressType?: string;
  considerMigratedFromAddressInternal?: boolean;
}

async function handleVerifyAddressError({
  e,
  currentAddress,
  wallet,
  txParams,
  customChangeKeys,
  coin,
  addressDetails,
  addressType,
  considerMigratedFromAddressInternal,
}: HandleVerifyAddressErrorOptions): Promise<HandleVerifyAddressErrorResponse> {
  // Todo: name server-side errors to avoid message-based checking [BG-5124]
  const walletAddressNotFound = e.message.includes('wallet address not found');
  const unexpectedAddress = e instanceof UnexpectedAddressError;
  if (walletAddressNotFound || unexpectedAddress) {
    if (unexpectedAddress && !walletAddressNotFound) {
      // check to see if this is a migrated v1 bch address - it could be internal
      const isMigrated = isMigratedAddress(wallet, currentAddress);
      if (isMigrated) {
        return { external: considerMigratedFromAddressInternal === false };
      }

      debug('Address %s was found on wallet but could not be reconstructed', currentAddress);

      // attempt to verify address using custom change address keys if the wallet has that feature enabled
      if (
        customChangeKeys &&
        (await verifyCustomChangeAddress({ coin, addressDetails, addressType, currentAddress, customChangeKeys }))
      ) {
        // address is valid against the custom change keys. Mark address as not external
        // and request signature verification for the custom change keys
        debug('Address %s verified as derived from the custom change keys', currentAddress);
        return { external: false, needsCustomChangeKeySignatureVerification: true };
      }
    }

    // the address was found, but not on the wallet, which simply means it's external
    debug('Address %s presumed external', currentAddress);
    return { external: true };
  } else if (e instanceof InvalidAddressDerivationPropertyError && currentAddress === txParams.changeAddress) {
    // expect to see this error when passing in a custom changeAddress with no chain or index
    return { external: false };
  }

  console.error('Address classification failed for address', currentAddress);
  console.trace(e);
  /**
   * It might be a completely invalid address or a bad validation attempt or something else completely, in
   * which case we do not proceed and rather rethrow the error, which is safer than assuming that the address
   * validation failed simply because it's external to the wallet.
   */
  throw e;
}

interface FetchAddressDetailsOptions {
  reqId?: IRequestTracer;
  disableNetworking: boolean;
  addressDetailsPrebuild: any;
  addressDetailsVerification: any;
  currentAddress: string;
  wallet: IWallet;
}

async function fetchAddressDetails({
  reqId,
  disableNetworking,
  addressDetailsPrebuild,
  addressDetailsVerification,
  currentAddress,
  wallet,
}: FetchAddressDetailsOptions) {
  let addressDetails = _.extend({}, addressDetailsPrebuild, addressDetailsVerification);
  debug('Locally available address %s details: %O', currentAddress, addressDetails);
  if (_.isEmpty(addressDetails) && !disableNetworking) {
    addressDetails = await wallet.getAddress({ address: currentAddress, reqId });
    debug('Downloaded address %s details: %O', currentAddress, addressDetails);
  }
  return addressDetails;
}

export interface CustomChangeOptions {
  keys: [Keychain, Keychain, Keychain];
  signatures: [string, string, string];
}

export interface ParseOutputOptions {
  currentOutput: Output;
  coin: AbstractUtxoCoin;
  txPrebuild: TransactionPrebuild;
  verification: VerificationOptions;
  keychainArray: [Keychain, Keychain, Keychain];
  wallet: IWallet;
  txParams: TransactionParams;
  customChange?: CustomChangeOptions;
  reqId?: IRequestTracer;
}

export async function parseOutput({
  currentOutput,
  coin,
  txPrebuild,
  verification,
  keychainArray,
  wallet,
  txParams,
  customChange,
  reqId,
}: ParseOutputOptions): Promise<Output> {
  const disableNetworking = !!verification.disableNetworking;
  const currentAddress = currentOutput.address;

  // attempt to grab the address details from either the prebuilt tx, or the verification params.
  // If both of these are empty, then we will try to get the address details from bitgo instead
  const addressDetailsPrebuild = _.get(txPrebuild, `txInfo.walletAddressDetails.${currentAddress}`, {});
  const addressDetailsVerification: AddressVerificationData = verification?.addresses?.[currentAddress] ?? {};
  debug('Parsing address details for %s', currentAddress);
  let currentAddressDetails = undefined;
  let currentAddressType: string | undefined = undefined;
  const RECIPIENT_THRESHOLD = 1000;
  try {
    // In the case of PSBTs, we can already determine the internal/external status of the output addresses
    // based on the derivation information being included in the PSBT. We can short circuit GET v2.wallet.address
    // and save on network requests. Since we have the derivation information already, we can still verify the address
    if (currentOutput.external !== undefined) {
      // In the case that we have a custom change wallet, we need to verify the address against the custom change keys
      // and not the wallet keys. This check is done in the handleVerifyAddressError function if this error is thrown.
      if (customChange !== undefined) {
        throw new UnexpectedAddressError('`address validation failure');
      }
      // If it is an internal address, we can skip the network request and just verify the address locally with the
      // derivation information we have. Otherwise, if the address is external, which is the only remaining case, we
      // can just return the current output as is without contacting the server.
      if (isWalletOutput(currentOutput)) {
        const res = await coin.isWalletAddress({
          addressType: AbstractUtxoCoin.inferAddressType({ chain: currentOutput.chain }) || undefined,
          keychains: keychainArray as { pub: string; commonKeychain?: string | undefined }[],
          address: currentAddress,
          chain: currentOutput.chain,
          index: currentOutput.index,
        });
        if (!res) {
          throw new UnexpectedAddressError();
        }
      }
      return currentOutput;
    }
    /**
     * The only way to determine whether an address is known on the wallet is to initiate a network request and
     * fetch it. Should the request fail and return a 404, it will throw and therefore has to be caught. For that
     * reason, address wallet ownership detection is wrapped in a try/catch. Additionally, once the address
     * details are fetched on the wallet, a local address validation is run, whose errors however are generated
     * client-side and can therefore be analyzed with more granularity and type checking.
     */

    /**
     * In order to minimize API requests, we assume that explicit recipients are always external when the
     * recipient list is > 1000 This is not always a valid assumption and could lead greater apparent spend (but never lower)
     */
    if (txParams.recipients !== undefined && txParams.recipients.length > RECIPIENT_THRESHOLD) {
      const isCurrentAddressInRecipients = txParams.recipients.some((recipient) =>
        recipient.address.includes(currentAddress)
      );

      if (isCurrentAddressInRecipients) {
        return { ...currentOutput };
      }
    }

    const addressDetails = await fetchAddressDetails({
      reqId,
      addressDetailsVerification,
      addressDetailsPrebuild,
      currentAddress,
      disableNetworking,
      wallet,
    });
    // verify that the address is on the wallet. verifyAddress throws if
    // it fails to correctly rederive the address, meaning it's external
    currentAddressType = AbstractUtxoCoin.inferAddressType(addressDetails) || undefined;
    currentAddressDetails = addressDetails;
    await coin.verifyAddress(
      _.extend({ addressType: currentAddressType }, addressDetails, {
        keychains: keychainArray,
        address: currentAddress,
      })
    );
    debug('Address %s verification passed', currentAddress);

    // verify address succeeded without throwing, so the address was
    // correctly rederived from the wallet keychains, making it not external
    return _.extend({}, currentOutput, addressDetails, { external: false });
  } catch (e) {
    debug('Address %s verification threw an error:', currentAddress, e);
    return _.extend(
      {},
      currentOutput,
      await handleVerifyAddressError({
        e,
        coin,
        currentAddress,
        wallet,
        txParams,
        customChangeKeys: customChange && customChange.keys,
        addressDetails: currentAddressDetails,
        addressType: currentAddressType,
        considerMigratedFromAddressInternal: verification.considerMigratedFromAddressInternal,
      })
    );
  }
}
