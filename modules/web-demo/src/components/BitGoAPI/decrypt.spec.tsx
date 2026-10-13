/// <reference types="cypress" />
import { BitGoAPI, V1_MAX_ITER } from '@bitgo/sdk-api';

/**
 * WCN-2576: in a real browser bundle, v1 decrypt must route straight to the
 * frozen SJCL decoder without ever attempting the native `node:crypto` path.
 * The `crypto` webpack substitutes for `node:crypto` there (`crypto-browserify`,
 * backed by `browserify-aes`) has no working AES-CCM, so any native attempt
 * would burn a full PBKDF2 run, fail, and then log the fallback warning on the
 * SJCL success. A correct decrypt with no `[bitgo-sdk] v1 native decrypt
 * failed` console.warn therefore proves the browser branch was taken.
 */
describe('BitGoAPI.decrypt v1 browser routing', () => {
  const password = 'myPassword';
  const plaintext = 'Hello, Browser!';

  let sdk: BitGoAPI;
  let v1Ciphertext: string;

  before(async () => {
    // clientConstants={} prevents the constructor's background fetchConstants()
    // network call; decrypt is fully local, so no request is ever needed.
    sdk = new BitGoAPI({ env: 'test', clientConstants: {} });
    v1Ciphertext = await sdk.encrypt({
      password,
      input: plaintext,
      encryptionVersion: 1,
    });
  });

  it('decrypts a v1 envelope via the SJCL decoder without attempting the broken native path', () => {
    const warn = cy.stub(console, 'warn');
    // Sanity: this spec must run in a real browser runtime for it to prove
    // browser dispatch (window implies self, so isBrowserRuntime() is true).
    expect(typeof window).to.not.equal('undefined');

    cy.wrap(sdk.decrypt({ password, input: v1Ciphertext })).should(
      'equal',
      plaintext,
    );
    cy.wrap(warn).should('not.be.called');
  });

  it('decrypts a legacy envelope without a `v` field (a shape only the SJCL decoder accepts)', () => {
    const warn = cy.stub(console, 'warn');
    const envelope = JSON.parse(v1Ciphertext);
    expect(envelope.v).to.equal(1);
    delete envelope.v;

    cy.wrap(sdk.decrypt({ password, input: JSON.stringify(envelope) })).should(
      'equal',
      plaintext,
    );
    cy.wrap(warn).should('not.be.called');
  });

  it('rejects an iter-cap violation before any KDF work runs', () => {
    const warn = cy.stub(console, 'warn');
    const envelope = JSON.parse(v1Ciphertext);
    envelope.iter = V1_MAX_ITER + 1;
    const input = JSON.stringify(envelope);

    // Resolve with the rejection and the elapsed time instead of failing the
    // command chain, so both can be asserted directly.
    type Measured = { error: unknown; elapsedMs: number };
    const start = performance.now();
    const measured: Promise<Measured> = sdk.decrypt({ password, input }).then(
      (): Measured => ({
        error: undefined,
        elapsedMs: performance.now() - start,
      }),
      (error: unknown): Measured => ({
        error,
        elapsedMs: performance.now() - start,
      }),
    );

    cy.wrap(measured).then((result) => {
      const { error, elapsedMs } = result as Measured;
      expect(error, 'iter above the cap must be rejected').to.be.an('error');
      expect((error as Error).message).to.match(/iter/);
      // A PBKDF2 run at iter = V1_MAX_ITER + 1 takes on the order of seconds,
      // while the envelope check is single-digit milliseconds.
      expect(elapsedMs).to.be.lessThan(1000);
      expect(warn).to.not.be.called;
    });
  });

  it('surfaces the SJCL auth failure as `incorrect password`', () => {
    const warn = cy.stub(console, 'warn');
    // Resolve with the rejection instead of failing the command chain, so the
    // mapped message can be asserted directly (Cypress does not bundle
    // chai-as-promised, so `be.rejectedWith` is not available).
    type Outcome = { error: unknown };
    const outcome: Promise<Outcome> = sdk
      .decrypt({ password: 'wrongPassword', input: v1Ciphertext })
      .then(
        (): Outcome => ({ error: undefined }),
        (error: unknown): Outcome => ({ error }),
      );

    cy.wrap(outcome).then((result) => {
      const { error } = result as Outcome;
      expect(error, 'wrong password must be rejected').to.be.an('error');
      expect((error as Error).message).to.equal('incorrect password');
      expect(warn).to.not.be.called;
    });
  });
});
