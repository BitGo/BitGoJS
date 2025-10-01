import * as t from 'io-ts';

export const ShareState = t.union([
  t.literal('pendingapproval'),
  t.literal('active'),
  t.literal('accepted'),
  t.literal('canceled'),
  t.literal('rejected'),
]);

export const ShareWalletKeychain = t.partial({
  pub: t.string,
  encryptedPrv: t.string,
  fromPubKey: t.string,
  toPubKey: t.string,
  path: t.string,
});
