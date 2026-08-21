import { type Script } from "@blaze-cardano/core";
import { Exact } from "@blaze-cardano/data";
type OutputReference = {
    output_index: bigint;
    transaction_id: string;
};
export declare const Bool: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "Bool">;
export type Bool = Exact<typeof Bool>;
export declare const Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "Tuple_VerificationKey_COSESign1">;
export type Tuple_VerificationKey_COSESign1 = Exact<typeof Tuple_VerificationKey_COSESign1>;
export declare const COSESign1: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "COSESign1">;
export type COSESign1 = Exact<typeof COSESign1>;
export declare const HeaderMap: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "HeaderMap">;
export type HeaderMap = Exact<typeof HeaderMap>;
export declare const Headers: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "Headers">;
export type Headers = Exact<typeof Headers>;
export declare const MultisigScript: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "MultisigScript">;
export type MultisigScript = Exact<typeof MultisigScript>;
export declare const Asset: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "Asset">;
export type Asset = Exact<typeof Asset>;
export declare const Destination: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "Destination">;
export type Destination = Exact<typeof Destination>;
export declare const ExtraProtocolRedeemer: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "ExtraProtocolRedeemer">;
export type ExtraProtocolRedeemer = Exact<typeof ExtraProtocolRedeemer>;
export declare const Nonce: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "Nonce">;
export type Nonce = Exact<typeof Nonce>;
export declare const OrderAction: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "OrderAction">;
export type OrderAction = Exact<typeof OrderAction>;
export declare const OrderDatum: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "OrderDatum">;
export type OrderDatum = Exact<typeof OrderDatum>;
export declare const OrderRedeemer: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "OrderRedeemer">;
export type OrderRedeemer = Exact<typeof OrderRedeemer>;
export declare const ProtocolRedeemer: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "ProtocolRedeemer">;
export type ProtocolRedeemer = Exact<typeof ProtocolRedeemer>;
export declare const ProxyDatum: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "ProxyDatum">;
export type ProxyDatum = Exact<typeof ProxyDatum>;
export declare const Registry: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "Registry">;
export type Registry = Exact<typeof Registry>;
export declare const Request: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "Request">;
export type Request = Exact<typeof Request>;
export declare const ReserveAsset: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "ReserveAsset">;
export type ReserveAsset = Exact<typeof ReserveAsset>;
export declare const Settings: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "Settings">;
export type Settings = Exact<typeof Settings>;
export declare const SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "SignedPayload_ProtocolRedeemer">;
export type SignedPayload_ProtocolRedeemer = Exact<typeof SignedPayload_ProtocolRedeemer>;
export declare const SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "SignedRedeemer_ExtraProtocolRedeemer">;
export type SignedRedeemer_ExtraProtocolRedeemer = Exact<typeof SignedRedeemer_ExtraProtocolRedeemer>;
export declare const StakingVaultRedeemer: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "StakingVaultRedeemer">;
export type StakingVaultRedeemer = Exact<typeof StakingVaultRedeemer>;
export declare const TreasuryRequest: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "TreasuryRequest">;
export type TreasuryRequest = Exact<typeof TreasuryRequest>;
export declare const VaultDatum: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
    Tuple_VerificationKey_COSESign1: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    COSESign1: import("@sinclair/typebox").TObject<{
        headers: import("@sinclair/typebox").TRef<"Headers">;
        payload: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        signature: import("@sinclair/typebox").TString;
    }>;
    HeaderMap: import("@sinclair/typebox").TString;
    Headers: import("@sinclair/typebox").TObject<{
        protected: import("@sinclair/typebox").TRef<"HeaderMap">;
        unprotected: import("@sinclair/typebox").TRef<"HeaderMap">;
    }>;
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
    Destination: import("@sinclair/typebox").TObject<{
        address: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
        datum: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NoDatum">, import("@sinclair/typebox").TObject<{
            DatumHash: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
        }>, import("@sinclair/typebox").TObject<{
            InlineDatum: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TSchema]>;
        }>]>;
    }>;
    ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        request_to_outputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        input_to_requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TBigInt>;
        treasury_input_idx: import("@sinclair/typebox").TBigInt;
        treasury_output_idx: import("@sinclair/typebox").TBigInt;
        vault_input_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
        vault_output_idx: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBigInt>;
    }>;
    Nonce: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        UTxO: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>]>;
    }>, import("@sinclair/typebox").TObject<{
        Validity: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TObject<{
            lower_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
            upper_bound: import("@sinclair/typebox").TObject<{
                bound_type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"NegativeInfinity">, import("@sinclair/typebox").TObject<{
                    Finite: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TBigInt]>;
                }>, import("@sinclair/typebox").TLiteral<"PositiveInfinity">]>;
                is_inclusive: import("@sinclair/typebox").TRef<"Bool">;
            }>;
        }>]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODeposit: import("@sinclair/typebox").TObject<{
            principal: import("@sinclair/typebox").TBigInt;
            yield: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OWithdraw: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OStake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatum: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderAction">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">]>;
    ProtocolRedeemer: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequest">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>]>;
    ProxyDatum: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"Settings">;
    }>;
    Registry: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        susdr: import("@sinclair/typebox").TString;
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_assets: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ReserveAsset">>;
        unstaked_yield_pot: import("@sinclair/typebox").TObject<{
            payment_credential: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>, import("@sinclair/typebox").TObject<{
                Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
            }>]>;
            stake_credential: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                Inline: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                    VerificationKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>, import("@sinclair/typebox").TObject<{
                    Script: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
                }>]>]>;
            }>, import("@sinclair/typebox").TObject<{
                Pointer: import("@sinclair/typebox").TObject<{
                    slot_number: import("@sinclair/typebox").TBigInt;
                    transaction_index: import("@sinclair/typebox").TBigInt;
                    certificate_index: import("@sinclair/typebox").TBigInt;
                }>;
            }>]>>;
        }>;
    }>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemer">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakingVaultRedeemer: import("@sinclair/typebox").TUndefined;
    TreasuryRequest: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatum: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "VaultDatum">;
export type VaultDatum = Exact<typeof VaultDatum>;
export declare class V0_4OrderOrderSpend {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V0_4OrderOrderElse {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V0_4ProtocolProtocolWithdraw {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V0_4ProtocolProtocolElse {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V0_4StakingVaultStakingVaultMint {
    Script: Script;
    constructor(utxoRef: OutputReference, proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V0_4StakingVaultStakingVaultSpend {
    Script: Script;
    constructor(utxoRef: OutputReference, proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V0_4StakingVaultStakingVaultElse {
    Script: Script;
    constructor(utxoRef: OutputReference, proxyPolicyId: PolicyId, trace?: boolean);
}
export {};
//# sourceMappingURL=index.d.ts.map