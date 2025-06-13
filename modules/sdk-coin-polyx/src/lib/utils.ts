import { Utils as SubstrateUtils, Interface } from '@bitgo/abstract-substrate';
import { NetworkType } from '@bitgo/statics';
import { TypeRegistry } from '@substrate/txwrapper-core/lib/types';
import { mainnetMaterial, testnetMaterial } from '../resources';
import { BatchCallObject } from './iface';

export class Utils extends SubstrateUtils {
  getMaterial(networkType: NetworkType): Interface.Material {
    return (networkType === NetworkType.MAINNET ? mainnetMaterial : testnetMaterial) as unknown as Interface.Material;
  }

  decodeMethodName(call: BatchCallObject, registry: TypeRegistry): string {
    // Handle both callIndex and method formats
    const callWithIndex = call as BatchCallObject & { callIndex?: string };
    const methodIdentifier = callWithIndex.callIndex || call.method;

    if (typeof methodIdentifier === 'string') {
      // Check if it looks like a hex callIndex
      if (methodIdentifier.startsWith('0x') && methodIdentifier.length > 2) {
        try {
          const decodedCall = registry.findMetaCall(
            new Uint8Array(Buffer.from(methodIdentifier.replace('0x', ''), 'hex'))
          );
          return decodedCall.method;
        } catch (e) {
          // Fallback: assume it's already the method name
          return methodIdentifier;
        }
      } else {
        // Already a simple method name
        return methodIdentifier;
      }
    }

    // Fallback
    return String(methodIdentifier);
  }
}

const utils = new Utils();
export default utils;
