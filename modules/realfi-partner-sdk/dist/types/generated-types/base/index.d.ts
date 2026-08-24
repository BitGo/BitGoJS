import { type Script } from "@blaze-cardano/core";
type OutputReference = {
    output_index: bigint;
    transaction_id: string;
};
export declare class BaseMintProxyMintProxyMint {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class BaseMintProxyMintProxyElse {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class BaseOneshotOneshotMint {
    Script: Script;
    constructor(utxoRef: OutputReference, trace?: boolean);
}
export declare class BaseOneshotOneshotElse {
    Script: Script;
    constructor(utxoRef: OutputReference, trace?: boolean);
}
export {};
//# sourceMappingURL=index.d.ts.map