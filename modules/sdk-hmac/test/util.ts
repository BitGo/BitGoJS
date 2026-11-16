import { expect } from 'chai';
import * as sinon from 'sinon';
import { getRequestTimestampMs } from '../src/util';

// The helper keeps module state, so every test starts well past the previous one (beyond the
// drift cap) and past every fake clock used elsewhere in this suite.
const BASE = 2_000_000_000_000;
const TEST_SPACING_MS = 100_000;

describe('getRequestTimestampMs', function () {
  let clock: sinon.SinonFakeTimers;
  let start = BASE;

  beforeEach(function () {
    start += TEST_SPACING_MS;
    clock = sinon.useFakeTimers(start);
  });

  afterEach(function () {
    clock.restore();
  });

  it('returns the current time when called after the clock has moved on', function () {
    expect(getRequestTimestampMs()).to.equal(start);
    clock.tick(5);
    expect(getRequestTimestampMs()).to.equal(start + 5);
  });

  it('returns strictly increasing timestamps for same-millisecond calls', function () {
    const timestamps = Array.from({ length: 5 }, () => getRequestTimestampMs());
    expect(timestamps).to.deep.equal([start, start + 1, start + 2, start + 3, start + 4]);
  });

  it('resumes tracking the real clock after a burst', function () {
    getRequestTimestampMs();
    getRequestTimestampMs();
    getRequestTimestampMs();
    clock.tick(10);
    expect(getRequestTimestampMs()).to.equal(start + 10);
  });

  it('falls back to the real clock when it steps back by more than the drift cap', function () {
    getRequestTimestampMs();
    clock.setSystemTime(start - 5_000);
    expect(getRequestTimestampMs()).to.equal(start - 5_000);
  });

  it('keeps nudging forward when the clock steps back by less than the drift cap', function () {
    getRequestTimestampMs();
    clock.setSystemTime(start - 500);
    expect(getRequestTimestampMs()).to.equal(start + 1);
  });

  it('never runs further ahead of the clock than the drift cap', function () {
    const timestamps = Array.from({ length: 2_500 }, () => getRequestTimestampMs());
    expect(Math.max(...timestamps)).to.be.at.most(start + 1_000);
  });
});
