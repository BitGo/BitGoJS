import { parse } from "@blaze-cardano/data";
import { getInlineDatumFromUtxo, parseOrderOwnerGenericFromDatum } from "./utils.js";
const parseOwnerField = (schema, datum) => {
  return parse(schema, datum).owner;
};

/**
 * Parse an order owner for cancel flows.
 *
 * Behavior:
 * - no version hint: use strict generic owner parsing immediately
 * - with version hint: try the hinted schema first
 * - hinted parse failure: fall back to strict generic owner parsing
 */
export async function parseCancelOwner(utxo, versionHint) {
  const datum = getInlineDatumFromUtxo(utxo);
  if (!versionHint) {
    return parseOrderOwnerGenericFromDatum(datum);
  }
  try {
    switch (versionHint) {
      case "V1_0":
        {
          const {
            OrderDatumV1
          } = await import("../../generated-types/v1_0/index.js");
          return parseOwnerField(OrderDatumV1, datum);
        }
      case "V1_0_Rc1":
        {
          const {
            OrderDatumV1
          } = await import("../../generated-types/v1_0_rc1/index.js");
          return parseOwnerField(OrderDatumV1, datum);
        }
      case "V1_1_Rc1":
        {
          const {
            OrderDatumV1
          } = await import("../../generated-types/v1_1_rc1/index.js");
          return parseOwnerField(OrderDatumV1, datum);
        }
      case "V0_4":
        {
          const {
            OrderDatum
          } = await import("../../generated-types/v0_4/index.js");
          return parseOwnerField(OrderDatum, datum);
        }
      case "V0_3":
        {
          const {
            OrderDatum
          } = await import("../../generated-types/v0_3/index.js");
          return parseOwnerField(OrderDatum, datum);
        }
      default:
        return parseOrderOwnerGenericFromDatum(datum);
    }
  } catch {
    return parseOrderOwnerGenericFromDatum(datum);
  }
}
export const parseOrderOwnerWithHint = parseCancelOwner;
//# sourceMappingURL=cancel.js.map