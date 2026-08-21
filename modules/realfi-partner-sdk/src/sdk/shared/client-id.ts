// Builder/API origin: "partner-sdk" for the curated "." entry, "internal-sdk" for all other uses.
export type TClientSource = "partner-sdk" | "internal-sdk";

// Placeholder version; the publish pipeline injects the released version into
// the built output. Unreleased source (monorepo, first-party) reports the
// placeholder as-is.
export const SDK_VERSION = "0.0.0-dev";

export const DEFAULT_CLIENT_SOURCE: TClientSource = "internal-sdk";
