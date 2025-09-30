import * as t from 'io-ts';

export const ForwarderVersion = t.union([t.literal(0), t.literal(1), t.literal(2), t.literal(3), t.literal(4)]);

export const EIP1559 = t.type({
  maxFeePerGas: t.number,
  maxPriorityFeePerGas: t.number,
});

export const CreateAddressFormat = t.union([t.literal('base58'), t.literal('cashaddr')]);
