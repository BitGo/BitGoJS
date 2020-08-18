/**
 * @prettier
 */

import * as debugLib from 'debug';
import * as _ from 'lodash';
import * as errors from '../../errors';
import { TransactionPrebuild, VerificationOptions } from '../baseCoin';
import { AbstractUtxoCoin, Output, TransactionParams } from '../coins/abstractUtxoCoin';
import { Keychain } from '../keychains';
import { Wallet } from '../wallet';
import { RequestTracer } from './util';

const debug = debugLib('bitgo:v2:parseoutput');

export async function parseOutput(
  currentOutput: Output,
  coin: AbstractUtxoCoin,
  txPrebuild: TransactionPrebuild,
  verification: VerificationOptions,
  keychainArray: [Keychain, Keychain, Keychain],
  wallet: Wallet,
  txParams: TransactionParams,
  reqId?: RequestTracer
): Promise<Output> {
  const disableNetworking = !!verification.disableNetworking;
  const currentAddress = currentOutput.address;

  // attempt to grab the address details from either the prebuilt tx, or the verification params.
  // If both of these are empty, then we will try to get the address details from bitgo instead
  const addressDetailsPrebuild = _.get(txPrebuild, `txInfo.walletAddressDetails.${currentAddress}`, {});
  const addressDetailsVerification = _.get(verification, `addresses.${currentAddress}`, {});
  debug('Parsing address details for %s', currentAddress);
  try {
    /**
     * The only way to determine whether an address is known on the wallet is to initiate a network request and
     * fetch it. Should the request fail and return a 404, it will throw and therefore has to be caught. For that
     * reason, address wallet ownership detection is wrapped in a try/catch. Additionally, once the address
     * details are fetched on the wallet, a local address validation is run, whose errors however are generated
     * client-side and can therefore be analyzed with more granularity and type checking.
     */
    let addressDetails = _.extend({}, addressDetailsPrebuild, addressDetailsVerification);
    debug('Locally available address %s details: %O', currentAddress, addressDetails);
    if (_.isEmpty(addressDetails) && !disableNetworking) {
      addressDetails = await wallet.getAddress({ address: currentAddress, reqId });
      debug('Downloaded address %s details: %O', currentAddress, addressDetails);
    }
    // verify that the address is on the wallet. verifyAddress throws if
    // it fails to correctly rederive the address, meaning it's external
    const addressType = AbstractUtxoCoin.inferAddressType(addressDetails);
    coin.verifyAddress(
      _.extend({ addressType }, addressDetails, {
        keychains: keychainArray,
        address: currentAddress,
      })
    );
    debug('Address %s verification passed', currentAddress);

    // verify address succeeded without throwing, so the address was
    // correctly rederived from the wallet keychains, making it not external
    return _.extend({}, currentOutput, addressDetails, { external: false });
  } catch (e) {
    // verify address threw an exception
    debug('Address %s verification threw an error:', currentAddress, e);
    // Todo: name server-side errors to avoid message-based checking [BG-5124]
    const walletAddressNotFound = e.message.includes('wallet address not found');
    const unexpectedAddress = e instanceof errors.UnexpectedAddressError;
    if (walletAddressNotFound || unexpectedAddress) {
      if (unexpectedAddress && !walletAddressNotFound) {
        /**
         * this could be a migrated SafeHD BCH wallet, and the transaction we are currently
         * parsing is trying to spend change back to the v1 wallet base address.
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
         */

        if (_.isString(wallet.migratedFrom()) && wallet.migratedFrom() === currentAddress) {
          debug('found address %s which was migrated from v1 wallet, address is not external', currentAddress);
          return _.extend({}, currentOutput, { external: false });
        }

        debug('Address %s was found on wallet but could not be reconstructed', currentAddress);
      }

      // the address was found, but not on the wallet, which simply means it's external
      debug('Address %s presumed external', currentAddress);
      return _.extend({}, currentOutput, { external: true });
    } else if (e instanceof errors.InvalidAddressDerivationPropertyError && currentAddress === txParams.changeAddress) {
      // expect to see this error when passing in a custom changeAddress with no chain or index
      return _.extend({}, currentOutput, { external: false });
    }

    debug('Address %s verification failed', currentAddress);
    /**
     * It might be a completely invalid address or a bad validation attempt or something else completely, in
     * which case we do not proceed and rather rethrow the error, which is safer than assuming that the address
     * validation failed simply because it's external to the wallet.
     */
    throw e;
  }
}
