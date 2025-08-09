export const MIDNIGHT_TNC_HASH = '31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b';

/*
 * matches a message that starts with "STAR ", followed by a number,
 * then " to addr" or " to addr_test1", followed by a 50+ character alphanumeric address,
 * and ends with the midnight TnC hash
 */
export const MIDNIGHT_GLACIER_DROP_CLAIM_MESSAGE_TEMPLATE = `STAR \\d+ to addr(?:1|_test1)[a-z0-9]{50,} ${MIDNIGHT_TNC_HASH}`;

export function getMidnightGlacierDropClaimMsg(cardanoDestAddr: string, allocationAmt: number): string {
  return `STAR ${allocationAmt} to ${cardanoDestAddr} ${MIDNIGHT_TNC_HASH}`;
}
