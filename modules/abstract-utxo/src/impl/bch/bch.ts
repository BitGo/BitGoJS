import { BitGoBase } from '@bitgo/sdk-core';
import { address as wasmAddress } from '@bitgo/wasm-utxo';

import { AbstractUtxoCoin } from '../../abstractUtxoCoin';
import { UtxoCoinName, WasmUtxoCoinName } from '../../names';
import { AddressCodec } from '../../transaction';

type BchAddressFormat = 'default' | 'cashaddr';

class BchAddressCodec extends AddressCodec {
  constructor(coinName: UtxoCoinName, wasmName: WasmUtxoCoinName, private readonly format: BchAddressFormat) {
    super(coinName, wasmName);
  }

  override encode(script: Uint8Array): string {
    return wasmAddress.fromOutputScriptWithCoin(script, this.wasmName, this.format);
  }
}

export class Bch extends AbstractUtxoCoin {
  readonly name: UtxoCoinName = 'bch';

  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Bch {
    return new Bch(bitgo);
  }

  private getBchAddressCodec(format: BchAddressFormat): BchAddressCodec {
    return new BchAddressCodec(this.name, this.wasmName, format);
  }

  override get addressCodec(): BchAddressCodec {
    return this.getBchAddressCodec('default');
  }

  override isValidAddress(
    address: string,
    param?: { anyFormat?: boolean; allowLightning?: boolean } | boolean
  ): boolean {
    const anyFormat = typeof param === 'object' ? param?.anyFormat ?? true : true;
    const isDefaultAddress = super.isValidAddress(address, param);
    if (isDefaultAddress || !anyFormat) {
      return isDefaultAddress;
    }
    return this.getBchAddressCodec('cashaddr').isValidAddress(address);
  }

  /**
   * Canonicalize a Bitcoin Cash address for a specific version
   *
   * Starting on January 14th, 2018 Bitcoin Cash's bitcoin-abc node switched over to using cashaddr
   * encoding for all of their addresses in order to distinguish them from Bitcoin Core's.
   * https://www.bitcoinabc.org/cashaddr. We're sticking with the old base58 format because
   * migrating over to the new format will be laborious, and we want to see how the space evolves
   *
   * @param address may or may not be prefixed with the network, example bitcoincash:pppkt7q2axpsm2cajyjtu6x8fsh6ywauzgxmsru962 or pppkt7q2axpsm2cajyjtu6x8fsh6ywauzgxmsru962
   * @param version the version of the desired address, 'base58' or 'cashaddr', defaulting to 'base58'
   * @returns {*} address string
   */
  canonicalAddress(address: string, version: unknown = 'base58'): string {
    if (AddressCodec.isScriptRecipient(address)) {
      return address;
    }

    if (version === 'base58') {
      const codec = this.addressCodec;
      const script = codec.decode(address);
      return codec.encode(script);
    }

    if (version === 'cashaddr') {
      const codec = this.getBchAddressCodec('cashaddr');
      return codec.encode(codec.decode(address));
    }

    throw new Error(`invalid version ${version}`);
  }
}
