import should from 'should';
import { AuthorizeInstructionView, summarizeStakingAuthorize } from '../../src/lib/stakingAuthorizeSummary';

describe('summarizeStakingAuthorize', () => {
  const stakingAddress = 'stake-account';
  const walletRoot = 'wallet-root';

  const view = (
    authorizeType: AuthorizeInstructionView['authorizeType'],
    newAuthorizeAddress: string,
    custodianAddress?: string
  ): AuthorizeInstructionView => ({
    stakingAddress,
    oldAuthorizeAddress: walletRoot,
    newAuthorizeAddress,
    authorizeType,
    custodianAddress,
  });

  it('returns undefined when there are no authorize instructions', () => {
    should.not.exist(summarizeStakingAuthorize([]));
  });

  it('reports a Withdrawer change', () => {
    const summary = summarizeStakingAuthorize([view('Withdrawer', 'new-withdrawer', 'custodian')]);
    summary!.newWithdrawAddress.should.equal('new-withdrawer');
    summary!.oldWithdrawAddress.should.equal(walletRoot);
    summary!.custodianAddress!.should.equal('custodian');
  });

  it('leaves withdraw fields empty for a staker-only transaction', () => {
    const summary = summarizeStakingAuthorize([view('Staker', 'new-staker')]);
    summary!.newWithdrawAddress.should.equal('');
    summary!.oldWithdrawAddress.should.equal('');
    summary!.newStakingAuthorityAddress!.should.equal('new-staker');
  });

  // A Staker change may legally carry a custodian, so it must never be mistaken for a Withdrawer
  // change regardless of where it sits in the transaction.
  for (const [name, instructions] of [
    ['staker decoy last', [view('Withdrawer', 'attacker', 'c'), view('Staker', 'expected', 'c')]],
    ['staker decoy first', [view('Staker', 'expected', 'c'), view('Withdrawer', 'attacker', 'c')]],
  ] as [string, AuthorizeInstructionView[]][]) {
    it(`prefers the real Withdrawer change over a custodian-bearing Staker change (${name})`, () => {
      summarizeStakingAuthorize(instructions)!.newWithdrawAddress.should.equal('attacker');
    });
  }

  // Solana executes instructions in order, so the last change of a given type is the one that
  // determines the final on-chain authority.
  it('takes the last Withdrawer change when several are present', () => {
    const summary = summarizeStakingAuthorize([view('Withdrawer', 'first'), view('Withdrawer', 'last')]);
    summary!.newWithdrawAddress.should.equal('last');
  });

  it('takes the last Staker change when several are present', () => {
    const summary = summarizeStakingAuthorize([view('Staker', 'first'), view('Staker', 'last')]);
    summary!.newStakingAuthorityAddress!.should.equal('last');
  });

  // An undecodable authority type must not be reported as a withdraw-authority change.
  it('leaves withdraw fields empty when the authority type is unknown', () => {
    const summary = summarizeStakingAuthorize([view(undefined, 'unknown', 'custodian')]);
    summary!.newWithdrawAddress.should.equal('');
    summary!.oldWithdrawAddress.should.equal('');
    should.not.exist(summary!.newStakingAuthorityAddress);
  });
});
