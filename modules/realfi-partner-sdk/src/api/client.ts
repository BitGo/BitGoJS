import * as Core from "@blaze-cardano/core";

interface IGraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

/** POST a GraphQL query and return its `data`, throwing on HTTP or GraphQL errors. */
export async function gqlRequest<T>(
  url: string,
  query: string,
  variables?: Record<string, unknown>,
  clientId?: string,
): Promise<T> {
  const payload: Record<string, unknown> = { query, variables };
  if (clientId) {
    payload.extensions = { clientId };
  }
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(
      `RealFi API request failed: ${response.status} ${response.statusText}`,
    );
  }
  const body = (await response.json()) as IGraphQLResponse<T>;
  if (body.errors?.length) {
    throw new Error(
      `RealFi API error: ${body.errors.map((error) => error.message).join("; ")}`,
    );
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
export function ownerKeyHashes(address: string): string[] {
  const props = Core.Address.fromBech32(address).getProps();
  return [props.paymentPart?.hash, props.delegationPart?.hash].filter(
    (hash): hash is string => Boolean(hash),
  );
}
