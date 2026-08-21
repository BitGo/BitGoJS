import * as Core from "@blaze-cardano/core";
/** POST a GraphQL query and return its `data`, throwing on HTTP or GraphQL errors. */
export async function gqlRequest(url, query, variables, clientId) {
  const payload = {
    query,
    variables
  };
  if (clientId) {
    payload.extensions = {
      clientId
    };
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`RealFi API request failed: ${response.status} ${response.statusText}`);
  }
  const body = await response.json();
  if (body.errors?.length) {
    throw new Error(`RealFi API error: ${body.errors.map(error => error.message).join("; ")}`);
  }
  if (body.data == null) {
    throw new Error("RealFi API returned no data");
  }
  return body.data;
}

/**
 * Derive the payment (and stake, when present) key hashes from a bech32 address.
 * Wallet-keyed queries match on any supplied hash.
 */
export function ownerKeyHashes(address) {
  const props = Core.Address.fromBech32(address).getProps();
  return [props.paymentPart?.hash, props.delegationPart?.hash].filter(hash => Boolean(hash));
}
//# sourceMappingURL=client.js.map