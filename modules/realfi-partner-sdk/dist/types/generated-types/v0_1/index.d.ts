import { type Script } from "@blaze-cardano/core";
import { Exact } from "@blaze-cardano/data";
type OutputReference = {
    output_index: bigint;
    transaction_id: string;
};
export declare const MultisigScript: import("@sinclair/typebox").TImport<{
    MultisigScript: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Signature: import("@sinclair/typebox").TObject<{
            key_hash: import("@sinclair/typebox").TString;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AllOf: import("@sinclair/typebox").TObject<{
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AnyOf: import("@sinclair/typebox").TObject<{
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AtLeast: import("@sinclair/typebox").TObject<{
            required: import("@sinclair/typebox").TBigInt;
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Before: import("@sinclair/typebox").TObject<{
            time: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        After: import("@sinclair/typebox").TObject<{
            time: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Script: import("@sinclair/typebox").TObject<{
            script_hash: import("@sinclair/typebox").TString;
        }>;
    }>]>;
    Asset: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TString]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Mint">, import("@sinclair/typebox").TLiteral<"Burn">]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    TreasuryDatum: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
}, "MultisigScript">;
export type MultisigScript = Exact<typeof MultisigScript>;
export declare const Asset: import("@sinclair/typebox").TImport<{
    MultisigScript: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Signature: import("@sinclair/typebox").TObject<{
            key_hash: import("@sinclair/typebox").TString;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AllOf: import("@sinclair/typebox").TObject<{
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AnyOf: import("@sinclair/typebox").TObject<{
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AtLeast: import("@sinclair/typebox").TObject<{
            required: import("@sinclair/typebox").TBigInt;
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Before: import("@sinclair/typebox").TObject<{
            time: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        After: import("@sinclair/typebox").TObject<{
            time: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Script: import("@sinclair/typebox").TObject<{
            script_hash: import("@sinclair/typebox").TString;
        }>;
    }>]>;
    Asset: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TString]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Mint">, import("@sinclair/typebox").TLiteral<"Burn">]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    TreasuryDatum: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
}, "Asset">;
export type Asset = Exact<typeof Asset>;
export declare const ProtocolRedeemer: import("@sinclair/typebox").TImport<{
    MultisigScript: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Signature: import("@sinclair/typebox").TObject<{
            key_hash: import("@sinclair/typebox").TString;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AllOf: import("@sinclair/typebox").TObject<{
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AnyOf: import("@sinclair/typebox").TObject<{
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AtLeast: import("@sinclair/typebox").TObject<{
            required: import("@sinclair/typebox").TBigInt;
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Before: import("@sinclair/typebox").TObject<{
            time: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        After: import("@sinclair/typebox").TObject<{
            time: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Script: import("@sinclair/typebox").TObject<{
            script_hash: import("@sinclair/typebox").TString;
        }>;
    }>]>;
    Asset: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TString]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Mint">, import("@sinclair/typebox").TLiteral<"Burn">]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    TreasuryDatum: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
}, "ProtocolRedeemer">;
export type ProtocolRedeemer = Exact<typeof ProtocolRedeemer>;
export declare const ProxyDatum: import("@sinclair/typebox").TImport<{
    MultisigScript: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Signature: import("@sinclair/typebox").TObject<{
            key_hash: import("@sinclair/typebox").TString;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AllOf: import("@sinclair/typebox").TObject<{
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AnyOf: import("@sinclair/typebox").TObject<{
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AtLeast: import("@sinclair/typebox").TObject<{
            required: import("@sinclair/typebox").TBigInt;
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Before: import("@sinclair/typebox").TObject<{
            time: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        After: import("@sinclair/typebox").TObject<{
            time: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Script: import("@sinclair/typebox").TObject<{
            script_hash: import("@sinclair/typebox").TString;
        }>;
    }>]>;
    Asset: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TString]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Mint">, import("@sinclair/typebox").TLiteral<"Burn">]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    TreasuryDatum: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
}, "ProxyDatum">;
export type ProxyDatum = Exact<typeof ProxyDatum>;
export declare const Registry: import("@sinclair/typebox").TImport<{
    MultisigScript: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Signature: import("@sinclair/typebox").TObject<{
            key_hash: import("@sinclair/typebox").TString;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AllOf: import("@sinclair/typebox").TObject<{
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AnyOf: import("@sinclair/typebox").TObject<{
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AtLeast: import("@sinclair/typebox").TObject<{
            required: import("@sinclair/typebox").TBigInt;
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Before: import("@sinclair/typebox").TObject<{
            time: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        After: import("@sinclair/typebox").TObject<{
            time: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Script: import("@sinclair/typebox").TObject<{
            script_hash: import("@sinclair/typebox").TString;
        }>;
    }>]>;
    Asset: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TString]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Mint">, import("@sinclair/typebox").TLiteral<"Burn">]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    TreasuryDatum: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
}, "Registry">;
export type Registry = Exact<typeof Registry>;
export declare const Settings: import("@sinclair/typebox").TImport<{
    MultisigScript: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Signature: import("@sinclair/typebox").TObject<{
            key_hash: import("@sinclair/typebox").TString;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AllOf: import("@sinclair/typebox").TObject<{
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AnyOf: import("@sinclair/typebox").TObject<{
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AtLeast: import("@sinclair/typebox").TObject<{
            required: import("@sinclair/typebox").TBigInt;
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Before: import("@sinclair/typebox").TObject<{
            time: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        After: import("@sinclair/typebox").TObject<{
            time: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Script: import("@sinclair/typebox").TObject<{
            script_hash: import("@sinclair/typebox").TString;
        }>;
    }>]>;
    Asset: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TString]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Mint">, import("@sinclair/typebox").TLiteral<"Burn">]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    TreasuryDatum: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
}, "Settings">;
export type Settings = Exact<typeof Settings>;
export declare const TreasuryDatum: import("@sinclair/typebox").TImport<{
    MultisigScript: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Signature: import("@sinclair/typebox").TObject<{
            key_hash: import("@sinclair/typebox").TString;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AllOf: import("@sinclair/typebox").TObject<{
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AnyOf: import("@sinclair/typebox").TObject<{
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        AtLeast: import("@sinclair/typebox").TObject<{
            required: import("@sinclair/typebox").TBigInt;
            scripts: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"MultisigScript">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Before: import("@sinclair/typebox").TObject<{
            time: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        After: import("@sinclair/typebox").TObject<{
            time: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Script: import("@sinclair/typebox").TObject<{
            script_hash: import("@sinclair/typebox").TString;
        }>;
    }>]>;
    Asset: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TString]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Mint">, import("@sinclair/typebox").TLiteral<"Burn">]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    TreasuryDatum: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
}, "TreasuryDatum">;
export type TreasuryDatum = Exact<typeof TreasuryDatum>;
export declare class V0_1ProtocolProtocolWithdraw {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V0_1ProtocolProtocolElse {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V0_1TreasuryTreasuryMint {
    Script: Script;
    constructor(utxoRef: OutputReference, proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V0_1TreasuryTreasurySpend {
    Script: Script;
    constructor(utxoRef: OutputReference, proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V0_1TreasuryTreasuryElse {
    Script: Script;
    constructor(utxoRef: OutputReference, proxyPolicyId: PolicyId, trace?: boolean);
}
export {};
//# sourceMappingURL=index.d.ts.map