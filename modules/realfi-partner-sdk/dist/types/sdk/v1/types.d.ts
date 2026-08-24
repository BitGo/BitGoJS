import type { TSchema } from "@blaze-cardano/data";
import type { Core } from "@blaze-cardano/sdk";
import type { Nonce, OrderRedeemerV1, RegistryV1, SettingsV1 as SettingsV1_0 } from "../../generated-types/v1_0/index.js";
/**
 * A TypeBox schema whose inferred static is exactly `T`, regardless of which
 * generated module it came from.
 *
 * The generated modules export `TImport` schemas that carry the WHOLE
 * module's `$defs` in their type, so `typeof V1_0Types.X` is not assignable
 * to `typeof V1_1Rc1Types.X` even when the statics are structurally identical.
 * `Data.serialize`/`parse` only infer through `T["static"]`, so this
 * intersection keeps full type safety at every call site while accepting any
 * version's schema value. Runtime ref resolution reads `$defs` off the schema
 * VALUE, so cross-version dispatch is safe.
 */
export type TSchemaOf<T> = TSchema & {
    static: T;
};
/**
 * Version-agnostic proxy datum shape. `ProxyDatumV1.settings` is the only
 * settings-transitive field in the schemas the family touches, so the family
 * is generic over it instead of using a version's concrete `ProxyDatumV1`.
 */
export interface IProxyDatum<TSettings> {
    logic: string;
    settings: TSettings;
}
/**
 * The minimal vault-datum shape every V1-family version shares. Shared code
 * may READ `circulating_susdr`; it must never construct a whole vault datum —
 * datum construction goes through the version's `buildInitialVaultDatum` /
 * `buildUpdatedVaultDatum` seam so versions with extra fields (v1_1_rc1's
 * yield-diffusion fields) can't be silently truncated.
 */
export interface IVaultDatumLike {
    circulating_susdr: bigint;
}
/**
 * The schema values the family base serializes/parses. Each per-version
 * generated module namespace satisfies this structurally.
 *
 * `OrderDatumV1` is deliberately loose (`TSchema`): the order-datum statics
 * differ across the family (v1_0 actions carry `min_received`, v1_0_rc1's do
 * not), so the base's v1_0-semantics defaults cast parse results to the v1_0
 * static. Versions with a different static override every constructor and
 * consumer of order datums.
 */
export interface IV1FamilySchemas<TSettings, TVaultDatum> {
    ProxyDatumV1: TSchemaOf<IProxyDatum<TSettings>>;
    SettingsV1: TSchemaOf<TSettings>;
    OrderDatumV1: TSchema;
    OrderRedeemerV1: TSchemaOf<OrderRedeemerV1>;
    VaultDatumV1: TSchemaOf<TVaultDatum>;
    Nonce: TSchemaOf<Nonce>;
}
/**
 * Schemas used ONLY by the base's v1_0-semantics signing/execute defaults
 * (`getSignedPayloadFromOrderInputs`, `buildExecuteOrdersTx`). Versions whose
 * protocol redeemer is structurally different (v1_0_rc1) omit this bag and
 * override both consumers; the family's guarded accessor throws if neither
 * is done.
 *
 * Both fields are deliberately loose (`TSchema`), for the same reason
 * `OrderDatumV1` above is: the protocol-redeemer static diverges across the
 * family (v1_1_rc1's `Deposit` carries `alpha` and its action union adds
 * `MigrateState`), so a `TSchemaOf<SignedPayload_...v1_0>` would reject the
 * wider v1_1_rc1 schema value even though runtime ref-resolution reads `$defs`
 * off the schema VALUE and is safe. Versions build their own action shape via
 * the `buildDepositAction` / `serializeOrchestratorWithdrawalRedeemer` seams.
 */
export interface IV1SigningSchemas {
    SignedPayload_ProtocolRedeemerV1: TSchema;
    SignedRedeemer_ExtraProtocolRedeemerV1: TSchema;
}
/**
 * The fraction of a deposit's yield routed to the staked vault, the remainder
 * going to the unstaked yield pot (v1_1_rc1+ `YieldSplitAlpha`).
 *
 * It is a parameter of the batch: its creator picks it, the backend stores it on
 * the batch, and every co-signer signs THAT value. On-chain every signature of a
 * batch is verified against a single payload hash, so a signer deriving its own
 * value from live state could never be co-signed — which is why the signing path
 * takes it as an input instead of reading the vault itself.
 */
export interface IYieldSplitAlpha {
    numerator: bigint;
    denominator: bigint;
}
/**
 * Version-agnostic view over the settings fields the shared tx-builders use.
 * v1_0: the (flat) settings object itself. v1_1_rc1: `settings.config`.
 */
export type TV1SettingsConfig = Pick<SettingsV1_0, "reserve_assets" | "unstaked_yield_pot">;
/**
 * The registry fields the family base reads (protocol-upgrade checks).
 * Registries differ across versions (v1_0 adds `yield_oracle`), so the
 * seam exposes only the shared field.
 */
export type TV1Registry = Pick<RegistryV1, "order">;
/**
 * Instantiated scripts each version's `create()` builds from its own
 * generated script classes and hands to the family constructor. Method
 * bodies only ever see `Core.Script` values.
 */
export interface IV1FamilyScripts {
    oneShotScript: Core.Script;
    protocolOrchestratorScript: Core.Script;
    protocolMintScript: Core.Script;
    protocolStakeScript: Core.Script;
    protocolManagementScript: Core.Script;
    mintProxyScript: Core.Script;
    treasuryScript: Core.Script;
    orderScript: Core.Script;
    stakingVaultScript: Core.Script;
}
//# sourceMappingURL=types.d.ts.map