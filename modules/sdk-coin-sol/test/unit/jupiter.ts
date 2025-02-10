import should from 'should';

import { KeyPair, Utils } from '../../src';
import * as testData from '../resources/sol';
import { getBuilderFactory } from './getBuilderFactory';
import * as bs58 from 'bs58';

describe('Sol Swap Transaction', () => {
  const walletKeyPair = new KeyPair(testData.authAccount);
  const wallet = walletKeyPair.getKeys();

  it('build and sign transaction from raw jupiter transaction', async function () {
    const SAMPLE_RAW_JUPITER_TX =
      'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAoUReV5vPklPPaLR9/x+zo6XCwhusWyPAmuEqbgVWvwi0EB8thTZxQc6G+XIkv1WwFqEfrKucNfrvRiPSUmF7w+CRXjppFBdIkJGZlev1WA6J+evE+LfsuI8EnhSg6vPYSqPBKOgOid54jFto5SmS1txaspJT4S90Eo57bUXvU9aYh9lRFYu7UK2t1dlLG2u3HRzFixk2K96e2fyKZfVxPXuZ3Gw+NukCm63qu23ldNwnOk+NoogYyudEIf5KUi5u/drMiiV0RfFB+VfaldrwpO3zG8gyYVyMpydSsLcN86cxa9cEoGPWf44rTdirCfU9AUYPsCuKpDkkpjxCmta2Zzgc4Vki0OYsblBV+NudgTmRYkE8QGXGRix9VwmxVcZqVY8+zw+5Cldc9+z7dLMWK60LWmz0vutgNIu9IDEjT5BNoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAABHnVW/IxwG7udMVuzmgVB/2xst6j9I5RArHNola8E48EednHzBA13nIR+Z60jAnXCyvfW9+eLla4ofu1ouozJwVKU1qZKSEGTSTocWDaOHx8NbXdvJK7geQfqEBBBUSNBpuIV/6rgYT7aH9jRhjANdrEOdwa6ztVmKDwAAAAAAEG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqQ4DaF+OkJBT5FgSHGb1p2rtx3BqoRyC+KqVKo8reHmpjJclj04kifG7PRApFI4NgwtaE5na/xCEBI572Nvp+Fm0P/on9df2SnTAmx8pWHneSwmrNt/J3VFLMhqns4zl6NAJo4cXiuKmPNS8wk1f+08HRiuSDmhwOLPfPIaHg6cECAsABQLAXBUACwAJA2LWAgAAAAAAEgYABgAPChABAQoCAAYMAgAAAICWmAAAAAAAEAEGARESBgADAA0KEAEBDBkQAAYDDA0MEwwREBAOAAcNDwMJBggBBAUCJeUXy5d6460qAQAAAC8AAGQAAYCWmAAAAAAAnusiAAAAAAAyAAAQAwYAAAEJ';

    const factory = getBuilderFactory('tsol');
    const txBuilder = factory.getJupiterBuilder();
    txBuilder.from(SAMPLE_RAW_JUPITER_TX);

    const txUnsigned = await txBuilder.build();
    txBuilder.sign({ key: wallet.prv });
    const tx = await txBuilder.build();
    const rawTx = tx.toBroadcastFormat();
    should.equal(Utils.isValidRawTransaction(rawTx), true);

    const tx2 = await factory.from(txUnsigned.toBroadcastFormat()).build();
    const signed = tx.signature[0];
    should.equal(tx2.toBroadcastFormat(), txUnsigned.toBroadcastFormat());
    should.equal(tx2.signablePayload.toString('hex'), txUnsigned.signablePayload.toString('hex'));

    const txBuilder2 = factory.getJupiterBuilder();
    txBuilder2.from(SAMPLE_RAW_JUPITER_TX);
    await txBuilder2.addSignature({ pub: wallet.pub }, Buffer.from(bs58.decode(signed)));

    const signedTx = await txBuilder2.build();
    should.equal(signedTx.type, tx.type);

    const rawSignedTx = signedTx.toBroadcastFormat();
    should.equal(rawSignedTx, rawTx);
  });
});
