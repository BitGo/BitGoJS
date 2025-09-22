import { payments, ECPair } from '@bitgo-beta/utxo-lib';

import { addBip322Input, createBaseToSignPsbt, buildToSpendTransaction } from '../../src/bip322';

export const BIP322_WIF_FIXTURE = 'L3VFeEujGtevx9w18HD1fhRbCH67Az2dpCymeRE1SoPK6XQtaN2k';
export const BIP322_PRV_FIXTURE = ECPair.fromWIF(BIP322_WIF_FIXTURE);
export const BIP322_PAYMENT_P2WPKH_FIXTURE = payments.p2wpkh({
  address: 'bc1q9vza2e8x573nczrlzms0wvx3gsqjx7vavgkx0l',
});

export const BIP322_FIXTURE_HELLO_WORLD_TOSPEND_TX = buildToSpendTransaction(
  BIP322_PAYMENT_P2WPKH_FIXTURE.output as Buffer,
  Buffer.from('Hello World')
);

export const BIP322_FIXTURE_HELLO_WORLD_TOSIGN_PSBT = createBaseToSignPsbt();
addBip322Input(BIP322_FIXTURE_HELLO_WORLD_TOSIGN_PSBT, 'Hello World', {
  scriptPubKey: BIP322_PAYMENT_P2WPKH_FIXTURE.output as Buffer,
});
