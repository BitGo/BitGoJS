import { Utils as SubstrateUtils, Interface } from '@bitgo/abstract-substrate';
import { NetworkType } from '@bitgo/statics';
import { mainnetMaterial, testnetMaterial } from '../resources';

export class Utils extends SubstrateUtils {
  getMaterial(networkType: NetworkType): Interface.Material {
    return (networkType === NetworkType.MAINNET ? mainnetMaterial : testnetMaterial) as unknown as Interface.Material;
  }
}

const utils = new Utils();
export default utils;
