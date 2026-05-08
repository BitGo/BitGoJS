import { TypeRegistry } from '@substrate/txwrapper-core/lib/types';
import { getRegistry } from '@substrate/txwrapper-registry';
import { Material } from './iface';

export class SingletonRegistry {
  private static instance: TypeRegistry;
  private static material: Material;

  static getInstance(material: Material): TypeRegistry {
    if (material !== SingletonRegistry.material) {
      SingletonRegistry.material = material;
      SingletonRegistry.instance = getRegistry({
        chainName: material.chainName,
        specName: material.specName,
        specVersion: material.specVersion,
        metadataRpc: material.metadata,
      });
    }
    return SingletonRegistry.instance;
  }
}
