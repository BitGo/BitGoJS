const assert = require('assert');
const { extractTicket, appendTicketFooter } = require('../prepare-commit-msg');

describe('extractTicket', () => {
  it('extracts uppercase ticket from uppercase branch', () => {
    assert.strictEqual(extractTicket('WEB-000-my-feature'), 'WEB-000');
  });

  it('extracts and uppercases ticket from lowercase branch', () => {
    assert.strictEqual(extractTicket('web-000-my-feature'), 'WEB-000');
  });

  it('extracts WP ticket', () => {
    assert.strictEqual(extractTicket('WP-1234-some-work'), 'WP-1234');
  });

  it('returns null for branches without a known prefix', () => {
    assert.strictEqual(extractTicket('release-2-hotfix'), null);
    assert.strictEqual(extractTicket('main'), null);
    assert.strictEqual(extractTicket('feature-no-ticket'), null);
  });

  it('is anchored at branch start (ignores prefixes mid-name)', () => {
    assert.strictEqual(extractTicket('feature/WEB-000-x'), null);
  });

  it('returns null for prefix without digits (WEB-foo)', () => {
    assert.strictEqual(extractTicket('WEB-foo'), null);
  });

  it('returns null for empty branch', () => {
    assert.strictEqual(extractTicket(''), null);
  });
});

describe('appendTicketFooter', () => {
  it('appends a TICKET footer when none is present', () => {
    assert.strictEqual(appendTicketFooter('feat: add thing', 'WEB-000'), 'feat: add thing\nTICKET: WEB-000\n');
  });

  it('returns null when ticket is null (branch had no match)', () => {
    assert.strictEqual(appendTicketFooter('feat: add thing', null), null);
  });

  it('returns null when a TICKET footer already exists', () => {
    assert.strictEqual(appendTicketFooter('feat: add thing\n\nTICKET: WEB-000', 'WEB-000'), null);
  });

  it('returns null when an ISSUE footer already exists (any case)', () => {
    assert.strictEqual(appendTicketFooter('feat: add thing\n\nissue: WEB-111', 'WEB-000'), null);
  });

  it('is not stateful across repeated calls (global-regex lastIndex safe)', () => {
    // Guards against RegExp.lastIndex leaking between .test() invocations.
    assert.strictEqual(appendTicketFooter('feat: a', 'WEB-000'), 'feat: a\nTICKET: WEB-000\n');
    assert.strictEqual(appendTicketFooter('feat: b', 'WEB-000'), 'feat: b\nTICKET: WEB-000\n');
  });
});
