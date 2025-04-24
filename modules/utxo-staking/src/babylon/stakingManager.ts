import * as bitcoinjslib from 'bitcoinjs-lib';
import * as utxolib from '@bitgo/utxo-lib';
import * as vendor from '@bitgo/babylonlabs-io-btc-staking-ts';
import {
  BIP322Sig,
  BTCSigType,
  ProofOfPossessionBTC,
} from '@babylonlabs-io/babylon-proto-ts/dist/generated/babylon/btcstaking/v1/pop';

import { getStakingParams } from './stakingParams';

/**
 * Subclass of BabylonBtcStakingManager with the sole purpose of forcing
 * a ECDSA signature.
 */
class BitGoStakingManager extends vendor.BabylonBtcStakingManager {
  constructor(
    network: bitcoinjslib.Network,
    stakingParams: vendor.VersionedStakingParams[],
    btcProvider: vendor.BtcProvider,
    babylonProvider: vendor.BabylonProvider
  ) {
    super(network, stakingParams, btcProvider, babylonProvider);
  }

  /**
   * Creates a proof of possession for the staker based on ECDSA signature.
   *
   * This is a parameterized version of the superclass method which infers
   * the signature type from the stakerBtcAddress.
   *
   * @param bech32Address - The staker's bech32 address on the babylon network.
   * @param stakerBtcAddress - The staker's BTC address.
   * @param sigType - The signature type (BIP322 or ECDSA).
   * @returns The proof of possession.
   */
  async createProofOfPossessionWithSigType(
    bech32Address: string,
    stakerBtcAddress: string,
    sigType: BTCSigType
  ): Promise<ProofOfPossessionBTC> {
    const signedBabylonAddress = await this.btcProvider.signMessage(
      vendor.SigningStep.PROOF_OF_POSSESSION,
      bech32Address,
      sigType === BTCSigType.BIP322 ? 'bip322-simple' : 'ecdsa'
    );

    let btcSig: Uint8Array;
    if (sigType === BTCSigType.BIP322) {
      const bip322Sig = BIP322Sig.fromPartial({
        address: stakerBtcAddress,
        sig: Buffer.from(signedBabylonAddress, 'base64'),
      });
      // Encode the BIP322 protobuf message to a Uint8Array
      btcSig = BIP322Sig.encode(bip322Sig).finish();
    } else {
      // Encode the ECDSA signature to a Uint8Array
      btcSig = Buffer.from(signedBabylonAddress, 'base64');
    }

    return {
      btcSigType: sigType,
      btcSig,
    };
  }

  /**
   * Creates a proof of possession for the staker based on ECDSA signature.
   * @param bech32Address - The staker's bech32 address on the babylon network.
   * @param stakerBtcAddress
   * @returns The proof of possession.
   */
  async createProofOfPossession(bech32Address: string, stakerBtcAddress: string): Promise<ProofOfPossessionBTC> {
    // force the ECDSA signature type
    return this.createProofOfPossessionWithSigType(bech32Address, stakerBtcAddress, BTCSigType.ECDSA);
  }
}

export const mockBabylonProvider: vendor.BabylonProvider = {
  signTransaction(): Promise<Uint8Array> {
    throw new Error('Function not implemented.');
  },
};

export function createStakingManager(
  network: bitcoinjslib.Network | utxolib.Network,
  btcProvider: vendor.BtcProvider,
  stakingParams?: vendor.VersionedStakingParams[],
  babylonProvider = mockBabylonProvider
): vendor.BabylonBtcStakingManager {
  if (utxolib.isValidNetwork(network)) {
    switch (network) {
      case utxolib.networks.bitcoin:
        network = bitcoinjslib.networks.bitcoin;
        break;
      case utxolib.networks.testnet:
      case utxolib.networks.bitcoinTestnet4:
        throw new Error('Unsupported bitcoin testnet network - only signet is supported');
      case utxolib.networks.bitcoinPublicSignet:
        network = bitcoinjslib.networks.testnet;
        break;
      default:
        throw new Error('Unsupported network');
    }
  }
  return new BitGoStakingManager(network, stakingParams ?? getStakingParams(network), btcProvider, babylonProvider);
}
