import * as t from 'io-ts';

export const multisigType = t.union([t.literal('onchain'), t.literal('tss'), t.literal('blsdkg')]);

export const walletType = t.union([t.literal('hot'), t.literal('cold'), t.literal('custodial')]);
