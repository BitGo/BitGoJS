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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "Destination">;
export type Destination = Exact<typeof Destination>;
export declare const DirectRequestV1: import("@sinclair/typebox").TImport<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "DirectRequestV1">;
export type DirectRequestV1 = Exact<typeof DirectRequestV1>;
export declare const ExchangeRequestV1: import("@sinclair/typebox").TImport<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "ExchangeRequestV1">;
export type ExchangeRequestV1 = Exact<typeof ExchangeRequestV1>;
export declare const ExtraProtocolRedeemerV1: import("@sinclair/typebox").TImport<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "ExtraProtocolRedeemerV1">;
export type ExtraProtocolRedeemerV1 = Exact<typeof ExtraProtocolRedeemerV1>;
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "Nonce">;
export type Nonce = Exact<typeof Nonce>;
export declare const OrderActionV1: import("@sinclair/typebox").TImport<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "OrderActionV1">;
export type OrderActionV1 = Exact<typeof OrderActionV1>;
export declare const OrderDatumV1: import("@sinclair/typebox").TImport<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "OrderDatumV1">;
export type OrderDatumV1 = Exact<typeof OrderDatumV1>;
export declare const OrderRedeemerV1: import("@sinclair/typebox").TImport<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "OrderRedeemerV1">;
export type OrderRedeemerV1 = Exact<typeof OrderRedeemerV1>;
export declare const ProtocolRedeemerV1: import("@sinclair/typebox").TImport<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "ProtocolRedeemerV1">;
export type ProtocolRedeemerV1 = Exact<typeof ProtocolRedeemerV1>;
export declare const ProxyDatumV1: import("@sinclair/typebox").TImport<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "ProxyDatumV1">;
export type ProxyDatumV1 = Exact<typeof ProxyDatumV1>;
export declare const RegistryV1: import("@sinclair/typebox").TImport<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "RegistryV1">;
export type RegistryV1 = Exact<typeof RegistryV1>;
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "ReserveAsset">;
export type ReserveAsset = Exact<typeof ReserveAsset>;
export declare const SettingsV1: import("@sinclair/typebox").TImport<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "SettingsV1">;
export type SettingsV1 = Exact<typeof SettingsV1>;
export declare const SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TImport<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "SignedPayload_ProtocolRedeemerV1">;
export type SignedPayload_ProtocolRedeemerV1 = Exact<typeof SignedPayload_ProtocolRedeemerV1>;
export declare const SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TImport<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "SignedRedeemer_ExtraProtocolRedeemerV1">;
export type SignedRedeemer_ExtraProtocolRedeemerV1 = Exact<typeof SignedRedeemer_ExtraProtocolRedeemerV1>;
export declare const StakeRequestV1: import("@sinclair/typebox").TImport<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "StakeRequestV1">;
export type StakeRequestV1 = Exact<typeof StakeRequestV1>;
export declare const StakingVaultRedeemerV1: import("@sinclair/typebox").TImport<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "StakingVaultRedeemerV1">;
export type StakingVaultRedeemerV1 = Exact<typeof StakingVaultRedeemerV1>;
export declare const TreasuryDatumV1: import("@sinclair/typebox").TImport<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "TreasuryDatumV1">;
export type TreasuryDatumV1 = Exact<typeof TreasuryDatumV1>;
export declare const TreasuryRequestV1: import("@sinclair/typebox").TImport<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "TreasuryRequestV1">;
export type TreasuryRequestV1 = Exact<typeof TreasuryRequestV1>;
export declare const VaultDatumV1: import("@sinclair/typebox").TImport<{
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
    DirectRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
    }>;
    ExchangeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
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
    OrderActionV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
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
            min_received: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        OUnstake: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
            min_received: import("@sinclair/typebox").TBigInt;
            forfeit: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ODirectBurn: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>]>;
    OrderDatumV1: import("@sinclair/typebox").TObject<{
        owner: import("@sinclair/typebox").TRef<"MultisigScript">;
        destination: import("@sinclair/typebox").TRef<"Destination">;
        action: import("@sinclair/typebox").TRef<"OrderActionV1">;
        data: import("@sinclair/typebox").TSchema;
    }>;
    OrderRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"Execute">, import("@sinclair/typebox").TLiteral<"Cancel">, import("@sinclair/typebox").TLiteral<"Invalidated">]>;
    ProtocolRedeemerV1: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        Mint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"ExchangeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"TreasuryRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Stake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Unstake: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"StakeRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectMint: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        DirectBurn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"DirectRequestV1">>;
        }>;
    }>]>;
    ProxyDatumV1: import("@sinclair/typebox").TObject<{
        logic: import("@sinclair/typebox").TString;
        settings: import("@sinclair/typebox").TRef<"SettingsV1">;
    }>;
    RegistryV1: import("@sinclair/typebox").TObject<{
        treasury: import("@sinclair/typebox").TString;
        usdr: import("@sinclair/typebox").TString;
        order: import("@sinclair/typebox").TString;
        staking_vault: import("@sinclair/typebox").TString;
        yield_oracle: import("@sinclair/typebox").TString;
    }>;
    ReserveAsset: import("@sinclair/typebox").TObject<{
        asset: import("@sinclair/typebox").TRef<"Asset">;
        numerator: import("@sinclair/typebox").TBigInt;
        denominator: import("@sinclair/typebox").TBigInt;
    }>;
    SettingsV1: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        stake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        unstake_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        direct_burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        yield_oracle_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"RegistryV1">;
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
    SignedPayload_ProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemerV1">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemerV1: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemerV1">;
        payload: import("@sinclair/typebox").TRef<"SignedPayload_ProtocolRedeemerV1">;
        signatures: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Tuple_VerificationKey_COSESign1">>;
    }>;
    StakeRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        min_received: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        forfeit: import("@sinclair/typebox").TBigInt;
    }>;
    StakingVaultRedeemerV1: import("@sinclair/typebox").TUndefined;
    TreasuryDatumV1: import("@sinclair/typebox").TObject<{
        circulating_supply: import("@sinclair/typebox").TBigInt;
    }>;
    TreasuryRequestV1: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        yield: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TObject<{
            transaction_id: import("@sinclair/typebox").TString;
            output_index: import("@sinclair/typebox").TBigInt;
        }>;
        reserve_asset: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    VaultDatumV1: import("@sinclair/typebox").TObject<{
        circulating_susdr: import("@sinclair/typebox").TBigInt;
    }>;
}, "VaultDatumV1">;
export type VaultDatumV1 = Exact<typeof VaultDatumV1>;
export declare class V1_0OrderOrderSpend {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, protocolScripthash: ScriptHash, trace?: boolean);
}
export declare class V1_0OrderOrderElse {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, protocolScripthash: ScriptHash, trace?: boolean);
}
export declare class V1_0ProtocolManagementProtocolManagementWithdraw {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V1_0ProtocolManagementProtocolManagementPublish {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V1_0ProtocolManagementProtocolManagementElse {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V1_0ProtocolMintProtocolMintWithdraw {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V1_0ProtocolMintProtocolMintPublish {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V1_0ProtocolMintProtocolMintElse {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V1_0ProtocolOrchestratorProtocolOrchestratorWithdraw {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, mintValidator: ScriptHash, stakeValidator: ScriptHash, managementValidator: ScriptHash, trace?: boolean);
}
export declare class V1_0ProtocolOrchestratorProtocolOrchestratorPublish {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, mintValidator: ScriptHash, stakeValidator: ScriptHash, managementValidator: ScriptHash, trace?: boolean);
}
export declare class V1_0ProtocolOrchestratorProtocolOrchestratorElse {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, mintValidator: ScriptHash, stakeValidator: ScriptHash, managementValidator: ScriptHash, trace?: boolean);
}
export declare class V1_0ProtocolStakeProtocolStakeWithdraw {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V1_0ProtocolStakeProtocolStakePublish {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V1_0ProtocolStakeProtocolStakeElse {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V1_0ProxyNftProxyNftMint {
    Script: Script;
    constructor(utxoRef: OutputReference, trace?: boolean);
}
export declare class V1_0ProxyNftProxyNftElse {
    Script: Script;
    constructor(utxoRef: OutputReference, trace?: boolean);
}
export declare class V1_0RealfiMintingPolicyRealfiMintingPolicyMint {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V1_0RealfiMintingPolicyRealfiMintingPolicyElse {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V1_0StakingVaultStakingVaultMint {
    Script: Script;
    constructor(utxoRef: OutputReference, proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V1_0StakingVaultStakingVaultSpend {
    Script: Script;
    constructor(utxoRef: OutputReference, proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V1_0StakingVaultStakingVaultElse {
    Script: Script;
    constructor(utxoRef: OutputReference, proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V1_0TreasuryTreasuryMint {
    Script: Script;
    constructor(utxoRef: OutputReference, proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V1_0TreasuryTreasurySpend {
    Script: Script;
    constructor(utxoRef: OutputReference, proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V1_0TreasuryTreasuryElse {
    Script: Script;
    constructor(utxoRef: OutputReference, proxyPolicyId: PolicyId, trace?: boolean);
}
export {};
//# sourceMappingURL=index.d.ts.map