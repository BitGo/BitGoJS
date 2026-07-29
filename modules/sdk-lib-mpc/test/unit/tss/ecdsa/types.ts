import {
  deserializeNtilde,
  serializeNtilde,
  deserializeNtildeWithProofs,
  serializeNtildeWithProofs,
  deserializePaillierChallengeWithProofs,
  serializePaillierChallengeWithProofs,
  deserializePaillierChallenge,
  serializePaillierChallenge,
  deserializePaillierChallengeProofs,
  serializePaillierChallengeProofs,
} from '../../../../src/tss/ecdsa/types';
import { mockedPaillierProofs } from '../../../paillierproof.util';
import { ntildeProofs, rangeProofChallenges } from '../../../rangeproof.util';

describe('Ecdsa', function () {
  it('serializeNtilde and deserializeNtilde are deterministic', function () {
    rangeProofChallenges.forEach((serializeChallengeBefore) => {
      const deserializeChallenge = deserializeNtilde(serializeChallengeBefore);
      const serializeChallengeAfter = serializeNtilde(deserializeChallenge);
      serializeChallengeBefore.should.deepEqual(serializeChallengeAfter);
    });
  });

  it('serializeNtildeWithProofs and deserializeNtildeWithProofs are deterministic', function () {
    const testData = rangeProofChallenges.map((challenge, i) => {
      return {
        ...challenge,
        ...ntildeProofs[i],
      };
    });
    testData.forEach((serializedChallengeWithProofsBefore) => {
      const deserializedChallengeWithProofs = deserializeNtildeWithProofs(serializedChallengeWithProofsBefore);
      const serializedChallengeWithProofsAfter = serializeNtildeWithProofs(deserializedChallengeWithProofs);
      serializedChallengeWithProofsBefore.should.deepEqual(serializedChallengeWithProofsAfter);
    });
  });

  it('serializePaillierChallenge and deserializePaillierChallenge are deterministic', function () {
    const paillierChallenges = mockedPaillierProofs.map((value) => {
      return {
        p: value.p,
      };
    });
    paillierChallenges.forEach((serializedChallengeBefore) => {
      const deserializedChallenge = deserializePaillierChallenge(serializedChallengeBefore);
      const serializedChallengeAfter = serializePaillierChallenge(deserializedChallenge);
      serializedChallengeBefore.should.deepEqual(serializedChallengeAfter);
    });
  });

  it('serializePaillierChallengeProofs and deserializePaillierChallengeProofs are deterministic', function () {
    const paillierChallengeProofs = mockedPaillierProofs.map((value) => {
      return {
        sigma: value.sigma,
      };
    });
    paillierChallengeProofs.forEach((serializedPaillierChallengeProofBefore) => {
      const deserializedPaillierChallengeProof = deserializePaillierChallengeProofs(
        serializedPaillierChallengeProofBefore
      );
      const serializedPaillierChallengeProofAfter = serializePaillierChallengeProofs(
        deserializedPaillierChallengeProof
      );
      serializedPaillierChallengeProofBefore.should.deepEqual(serializedPaillierChallengeProofAfter);
    });
  });

  it('serializePaillierChallengeWithProofs and deserializePaillierChallengeWithProofs are deterministic', function () {
    const paillierChallengesWithProofs = mockedPaillierProofs.map((value) => {
      return {
        p: value.p,
        sigma: value.sigma,
      };
    });
    paillierChallengesWithProofs.forEach((serializedChallengeWithProofsBefore) => {
      const deserializedChallengeWithProofs = deserializePaillierChallengeWithProofs(
        serializedChallengeWithProofsBefore
      );
      const serializedChallengeWithProofsAfter = serializePaillierChallengeWithProofs(deserializedChallengeWithProofs);
      serializedChallengeWithProofsBefore.should.deepEqual(serializedChallengeWithProofsAfter);
    });
  });
});
