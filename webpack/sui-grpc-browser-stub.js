// Browser-only stub for the SUI gRPC client module.
//
// The real @mysten/sui/grpc is ESM-only and drags a graphql/valibot/noble-curves
// dependency graph into browser bundles, where it can never execute. This stub
// keeps the bundle graph resolvable while excluding that entire graph.
//
// assertNodeEnvironment() in sdk-coin-sui throws before this module is ever
// evaluated; the throw below is a tripwire in case that invariant is broken.
module.exports = {};
throw new Error(
  'SUI gRPC is not supported in browser environments; route SUI node calls through a server-side backend.'
);
