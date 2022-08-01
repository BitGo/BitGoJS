import { BaseTxInfo, TypeRegistry } from '@acala-network/txwrapper-acala';

/**
 * Base transaction info shared across all types of transactions
 */
export interface AcaCreateBaseTxInfo {
  baseTxInfo: BaseTxInfo;
  options: {
    metadataRpc: `0x${string}`;
    registry: TypeRegistry; // Type registry imported from correct place
    isImmortalEra?: boolean;
  };
}
