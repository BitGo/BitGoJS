import type { Provider } from "@blaze-cardano/query";
import { type Blaze, Core, type TxBuilder, type Wallet } from "@blaze-cardano/sdk";
import type { GovernanceConfig } from "../../generated-types/v1_1_rc1/index.js";
import type { IBuildChangeConfigTxParams, IBuildChangeLogicTxParams, IBuildChangePermissionsTxParams, IBuildMigrateTxParams, IProtocolSettingsAdminInstance, IProtocolSettingsAdminParams, IProtocolSettingsAdminSource, IProtocolSettingsState, TSettingsChange, TSettingsSignatures } from "./types.js";
export declare class RealfiProtocolSettingsAdmin<P extends Provider, W extends Wallet> implements IProtocolSettingsAdminInstance<P, W> {
    readonly blaze: Blaze<P, W>;
    readonly proxyPolicyId: Core.PolicyId;
    readonly governanceConfig: GovernanceConfig;
    readonly settingsScript: Core.Script;
    readonly settingsScriptHash: Core.ScriptHash;
    readonly settingsValidatorAddress: Core.Address;
    readonly settingsRewardAccount: Core.RewardAccount;
    readonly enableTrace: boolean;
    private settingsRefInput?;
    private constructor();
    static create<P extends Provider, W extends Wallet>(blaze: Blaze<P, W>, params: IProtocolSettingsAdminParams): RealfiProtocolSettingsAdmin<P, W>;
    static fromProtocolSdk<P extends Provider, W extends Wallet>(sdk: IProtocolSettingsAdminSource<P, W>, params: Omit<IProtocolSettingsAdminParams, "proxyPolicyId" | "enableTrace"> & {
        enableTrace?: boolean;
    }): RealfiProtocolSettingsAdmin<P, W>;
    deploySettingsValidator(): Promise<TxBuilder>;
    registerSettingsStake(): TxBuilder;
    getSettingsState(): Promise<IProtocolSettingsState>;
    buildDepositProxyTx(): Promise<TxBuilder>;
    /**
     * Compute the 32-byte auth-payload hash the governance keys must COSE-sign for
     * `change`, against the current on-chain proxy state. Two-phase, mirroring the
     * orchestrator's `getSignedPayloadFromOrderInputs`: get this hash, collect the
     * signatures out-of-band, then pass them to the matching build method. The
     * proxy UTxO must be unchanged between the two calls (it is the nonce).
     */
    getSettingsAuthPayloadHash(change: TSettingsChange<P, W>): Promise<string>;
    buildChangePermissionsTx(params: IBuildChangePermissionsTxParams): Promise<TxBuilder>;
    buildChangeConfigTx(params: IBuildChangeConfigTxParams): Promise<TxBuilder>;
    buildChangeLogicTx(params: IBuildChangeLogicTxParams): Promise<TxBuilder>;
    buildShutdownTx(params: {
        signatures: TSettingsSignatures;
    }): Promise<TxBuilder>;
    buildRestoreTx(params: {
        signatures: TSettingsSignatures;
    }): Promise<TxBuilder>;
    buildMigrateTx(params: IBuildMigrateTxParams<P, W>): Promise<TxBuilder>;
    /**
     * Resolve a change against the current state into the concrete redeemer +
     * resulting proxy output (logic, canonical settings, destination). Shared by
     * `getSettingsAuthPayloadHash` and `buildChange` so the signed hash and the
     * submitted tx always describe the same resulting state. Settings read from
     * chain are canonicalized through the typed schema (see `canonicalizeSettings`)
     * so blaze's encoding matches the validator's `cbor.serialise`.
     */
    private resolveChange;
    private requireLive;
    /**
     * Re-serialize live settings through the typed schema so the CBOR matches the
     * validator's `cbor.serialise` of the parsed output datum. Settings read from
     * chain and re-embedded opaquely (Restore's unwrap, Migrate's passthrough)
     * otherwise don't. Frozen settings aren't a `SettingsV1`, so pass through.
     */
    private canonicalizeSettings;
    private buildChange;
    /**
     * The value to put on a settings output carrying `datum`, topped up to the
     * min-ADA floor for that datum when the incoming coin no longer covers it.
     *
     * A settings edit can grow the datum (appending a reserve asset, a larger
     * registry), and the coin comes from the UTxO being spent, which was sized
     * for the *previous* datum. `TxBuilder` would raise an under-funded output to
     * the floor on its way out, but that happens after balancing has already
     * decided what to draw from the wallet, so the bump is never funded and the
     * built transaction is short by exactly that amount. Reserving it here means
     * `complete()` treats the growth as an ordinary larger payment from the first
     * iteration.
     *
     * The floor is recomputed after each raise: a larger coin is itself a few
     * bytes wider on the wire, which can lift the floor again.
     */
    private valueWithDatumMinAda;
    /** The payment-credential script hash of a settings validator address. */
    private scriptHashOfAddress;
    private requireGovernedState;
    applySettingsWitness(tx: TxBuilder): Promise<void>;
}
//# sourceMappingURL=v1_1_rc1.d.ts.map