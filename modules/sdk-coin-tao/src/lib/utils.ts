import { Interface, Utils as SubstrateUtils } from '@bitgo-beta/abstract-substrate';
import { BaseCoin as CoinConfig, coins, NetworkType, TaoCoin } from '@bitgo-beta/statics';
import assert from 'assert';
import { mainnetMaterial, testnetMaterial } from '../resources';

export class Utils extends SubstrateUtils {
  getMaterial(networkType: NetworkType): Interface.Material {
    return (networkType === NetworkType.MAINNET ? mainnetMaterial : testnetMaterial) as unknown as Interface.Material;
  }

  getTaoTokenBySubnetId(subnetId: string | number): Readonly<CoinConfig> {
    const tokens = coins
      .filter((coin) => coin instanceof TaoCoin && coin.subnetId === String(subnetId))
      .map((coin) => coin);

    assert(tokens.length > 0, `No Tao token found for subnetId: ${subnetId}`);
    assert(tokens.length === 1, `Multiple Tao tokens found for subnetId: ${subnetId}`);
    return tokens[0];
  }
}

const utils = new Utils();
export default utils;
