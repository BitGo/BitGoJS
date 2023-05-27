import {
  deserializeNtilde,
  serializeNtilde,
  deserializeNtildeWithProofs,
  serializeNtildeWithProofs,
  deserializePallierChallengeWithProofs,
  serializePallierChallengeWithProofs,
  deserializePallierChallenge,
  serializePallierChallenge,
  deserializePallierChallengeProofs,
  serializePallierChallengeProofs,
} from '../../../../src/tss/ecdsa/types';
import { mockedPallierProofs } from '../../../pallierproof.util';
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

  it('serializePallierChallenge and deserializePallierChallenge are deterministic', function () {
    const pallierChallenges = mockedPallierProofs.map((value) => {
      return {
        p: value.p,
      };
    });
    pallierChallenges.forEach((serializedChallengeBefore) => {
      const deserializedChallenge = deserializePallierChallenge(serializedChallengeBefore);
      const serializedChallengeAfter = serializePallierChallenge(deserializedChallenge);
      serializedChallengeBefore.should.deepEqual(serializedChallengeAfter);
    });
  });

  it('serializePallierChallengeProofs and deserializePallierChallengeProofs are deterministic', function () {
    const pallierChallengeProofs = mockedPallierProofs.map((value) => {
      return {
        sigma: value.sigma,
      };
    });
    pallierChallengeProofs.forEach((serializedPallierChallengeProofBefore) => {
      const deserializedPallierChallengeProof = deserializePallierChallengeProofs(
        serializedPallierChallengeProofBefore
      );
      const serializedPallierChallengeProofAfter = serializePallierChallengeProofs(deserializedPallierChallengeProof);
      serializedPallierChallengeProofBefore.should.deepEqual(serializedPallierChallengeProofAfter);
    });
  });

  it('serializePallierChallengeWithProofs and deserializePallierChallengeWithProofs are deterministic', function () {
    const pallierChallengesWithProofs = mockedPallierProofs.map((value) => {
      return {
        p: value.p,
        sigma: value.sigma,
      };
    });
    pallierChallengesWithProofs.forEach((serializedChallengeWithProofsBefore) => {
      const deserializedChallengeWithProofs = deserializePallierChallengeWithProofs(
        serializedChallengeWithProofsBefore
      );
      const serializedChallengeWithProofsAfter = serializePallierChallengeWithProofs(deserializedChallengeWithProofs);
      serializedChallengeWithProofsBefore.should.deepEqual(serializedChallengeWithProofsAfter);
    });
  });
});
