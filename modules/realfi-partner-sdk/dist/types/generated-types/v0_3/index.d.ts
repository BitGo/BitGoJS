import { type Script } from "@blaze-cardano/core";
import { Exact } from "@blaze-cardano/data";
export declare const Bool: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "Bool">;
export type Bool = Exact<typeof Bool>;
export declare const COSESign1: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "COSESign1">;
export type COSESign1 = Exact<typeof COSESign1>;
export declare const HeaderMap: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "HeaderMap">;
export type HeaderMap = Exact<typeof HeaderMap>;
export declare const Headers: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "Headers">;
export type Headers = Exact<typeof Headers>;
export declare const MultisigScript: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "MultisigScript">;
export type MultisigScript = Exact<typeof MultisigScript>;
export declare const Asset: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "Asset">;
export type Asset = Exact<typeof Asset>;
export declare const Destination: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "Destination">;
export type Destination = Exact<typeof Destination>;
export declare const ExtraProtocolRedeemer: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "ExtraProtocolRedeemer">;
export type ExtraProtocolRedeemer = Exact<typeof ExtraProtocolRedeemer>;
export declare const Nonce: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "Nonce">;
export type Nonce = Exact<typeof Nonce>;
export declare const OrderAction: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "OrderAction">;
export type OrderAction = Exact<typeof OrderAction>;
export declare const OrderDatum: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "OrderDatum">;
export type OrderDatum = Exact<typeof OrderDatum>;
export declare const OrderRedeemer: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "OrderRedeemer">;
export type OrderRedeemer = Exact<typeof OrderRedeemer>;
export declare const ProtocolRedeemer: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "ProtocolRedeemer">;
export type ProtocolRedeemer = Exact<typeof ProtocolRedeemer>;
export declare const ProxyDatum: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "ProxyDatum">;
export type ProxyDatum = Exact<typeof ProxyDatum>;
export declare const Registry: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "Registry">;
export type Registry = Exact<typeof Registry>;
export declare const Request: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "Request">;
export type Request = Exact<typeof Request>;
export declare const Settings: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "Settings">;
export type Settings = Exact<typeof Settings>;
export declare const SigWithKey: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "SigWithKey">;
export type SigWithKey = Exact<typeof SigWithKey>;
export declare const SignatureList: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "SignatureList">;
export type SignatureList = Exact<typeof SignatureList>;
export declare const SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "SignedPayload_ProtocolRedeemer">;
export type SignedPayload_ProtocolRedeemer = Exact<typeof SignedPayload_ProtocolRedeemer>;
export declare const SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TImport<{
    Bool: import("@sinclair/typebox").TBoolean;
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
        request_to_outputs: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBigInt>;
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
    }>, import("@sinclair/typebox").TObject<{
        Nullifier: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString]>;
    }>]>;
    OrderAction: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        OMint: import("@sinclair/typebox").TObject<{
            amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        ORedeem: import("@sinclair/typebox").TObject<{
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
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Burn: import("@sinclair/typebox").TObject<{
            requests: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"Request">>;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Withdraw: import("@sinclair/typebox").TObject<{
            withdraw_amount: import("@sinclair/typebox").TBigInt;
        }>;
    }>, import("@sinclair/typebox").TObject<{
        Deposit: import("@sinclair/typebox").TObject<{
            deposit_amount: import("@sinclair/typebox").TBigInt;
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
    }>;
    Request: import("@sinclair/typebox").TObject<{
        destination: import("@sinclair/typebox").TRef<"Destination">;
        amount: import("@sinclair/typebox").TBigInt;
        origin: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    Settings: import("@sinclair/typebox").TObject<{
        mint_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        burn_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        withdraw_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        deposit_permission: import("@sinclair/typebox").TRef<"MultisigScript">;
        registry: import("@sinclair/typebox").TRef<"Registry">;
        reserve_token: import("@sinclair/typebox").TRef<"Asset">;
    }>;
    SigWithKey: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TRef<"COSESign1">]>;
    SignatureList: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRef<"SigWithKey">>;
    SignedPayload_ProtocolRedeemer: import("@sinclair/typebox").TObject<{
        action: import("@sinclair/typebox").TRef<"ProtocolRedeemer">;
        nonce: import("@sinclair/typebox").TRef<"Nonce">;
    }>;
    SignedRedeemer_ExtraProtocolRedeemer: import("@sinclair/typebox").TObject<{
        extra: import("@sinclair/typebox").TRef<"ExtraProtocolRedeemer">;
        payload: import("@sinclair/typebox").TString;
        signatures: import("@sinclair/typebox").TRef<"SignatureList">;
    }>;
}, "SignedRedeemer_ExtraProtocolRedeemer">;
export type SignedRedeemer_ExtraProtocolRedeemer = Exact<typeof SignedRedeemer_ExtraProtocolRedeemer>;
export declare class V0_3OrderOrderSpend {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V0_3OrderOrderElse {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V0_3ProtocolProtocolWithdraw {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
export declare class V0_3ProtocolProtocolElse {
    Script: Script;
    constructor(proxyPolicyId: PolicyId, trace?: boolean);
}
//# sourceMappingURL=index.d.ts.map