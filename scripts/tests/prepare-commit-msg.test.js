const assert = require('assert');
const { extractTicket } = require('../prepare-commit-msg');

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

  it('returns null for empty branch', () => {
    assert.strictEqual(extractTicket(''), null);
  });
});
