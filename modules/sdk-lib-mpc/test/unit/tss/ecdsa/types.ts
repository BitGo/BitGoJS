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
import { ntildeProofs } from '../../../rangeproof.util';
describe('Ecdsa', function () {
  const rangeProofChallenges = [
    {
      ntilde:
        'c220e85cff8eaa0f0ba284356a523cc45c1458001b2aa28569434fd9628258457581ff957c722941b2362c06e1bf2a5940c3c6b9c236d3fb915a9a3bbc487d26dde7fb3ff236a06613afaa0b98cd37315b283fd0961121475db1351bed3735a656a4ea1a943498c074e93914f82ad8f0fea3f6b7741684e603e63e36e2f74525b68a6da048d01d524e1a7ede388562d60d5cace84f9351262716b7c383c7d0e2eef3a98effd46e5779425b9f0021791b5da226f66976fcdc023b6401b1184a78e8c1c4089c3ae4b15655b6997e5533495e6cf1bc6706050f2608f6aa8fdecca708a662a341258f7f5f27d262591b98dc03d36593d59acdcc16a873b8c357a87bf16571b32e31d540dc8ce1d7dd2b0cd9217bf478fa96e828ff71bc521cc1f7d23d1f80143a4eca097410d6aaac5b8318b12c7cde902216b8ac17c24eafe23ff5d48d3e9f6d5c6738cbad6e1e48a0890f2d5220ca58a25010f4fe7f9b8f6e83e5c794f8a0481f93b2ab1b61488cb5cfa7a5a42bb512afcbdc1cfe43808fe76969',
      h1: 'a595033c3961d9cc92a6df228351820a383effed9a6737f406cd799b2532b2ada3d1f9c8f805572248d0bace02edb714dd2cb77f193705c9a99930967e56e80170100d2e7287603a8df9fd4105029058209b91a1779d7c4bc8272a78ac63f974770060aacf0eace313ff5af18dfd59efac172b8d26e958800646b98a98fba594cc0b16089239206319ad2c15602d0dd14108d3a476d07ca2cf4c0ec9d30a5df1b7bc0f27d229168863b5e274455e3131e5a79b85c3eadfb5f036cb460e195dee16978f694fd23bb676ff757f07060cfef649584994b1f5e52c4b26b4244e3cd65e87301d05e50318a770cacedd62801b22268ac9458827ba35ba7f483ab2ddb35a3b03d2ee132ba5f44e93c521a9550f020bfdde450960abe1392c45db9c50f1696d312126a47c5f278be691c5edeca346deb3152c74d4a40a9049cb40984745d8966117e7bd6b9db09faad6945903ec74a0c4009a42bde1b777794e3cb493ce054898cd6e3f3ff8392d8f82575648e9e4bec166e7d18cc6783bc7562b53e6d0',
      h2: '179c11307bfe2c84493bb6fa1ec72854e890608ba0e49fb8a370f6f0f5227c790778bf41dae8763a0937ed622aaa798d1a4870bec50395cc1538b8530dd4ca8299cca5ed0c45c92b5e00a197ac56b2920cb4078cb9ceeadf753805b77e1350c7a863af261c9032fe1a910053a27c44867585c29445aa767333c4b812f33310071ff095f9f842f4e0dff5c8b6003dd3703f76957c4e0134b40f5f86d1d384ec21a786a13217822606bfb7c109f6da0242291cfa62758b53eeed56c4b3837c8145edc03e0aa5c7c662247072350ef4d2888b5048c8a982796bb581f21abb59b0ac93cf1224b93f4d07e61df300ebcb0647161c5908968bcdb0c63b9c4ea566b4a87730685a7b3aad1a28f35011ad352eb59e54e5c4162e55be1c1791e55ea86a205898906f15dcb681d843838dbfe482c84a61a3ce789fbf0145c9bd4651fbc8a5826ebe8b0a00d2a4e4f428178000ed93dfefaa9b6a5c6324edad5e18f403fbd3dcbb169e588cd4f7df91f196fa71b9900841ff7a73778c8000900c2a2a0e583b',
    },
    {
      ntilde:
        'c3bf9480cc8856b1e75dfd9844ead84ba409a310d8fee6a6e4b605f9e1c20934b1267ed80e5831de1ff830d9be116b47f73571ca72fd570b695c8efaa16814633f4caf4210e39fd16d34cd489711edf424cce66b5ea0eb926313232b65b37916e43aea41c10814b20997e225a67f3c7104457032427502b71db229b52a5de6ad1ae61cce71a37ff50e9e068aa92c75da8dd56901d349bc50c62484df077e133a2e3e07f51c4410dd88b22f6b084a4001e29c09454ac9606623a369d0399930ec3f2aed7233582ef0171579c146bd6d694bd56ad6cd226f038f2e4c18188b5eef16cc4f3562771c75195fefb2dfb7b5e8f31d2228a5bbde2914b104c0c79c288750a62a36e3f1f9849f4effba6f86d0034c1b175172bff2a7524241dc2b27bd230d7be556712b3cb005f3095c15bfda2bea51959eb78d55822ba765656021b30926fbe5e1c1a3978bd3d146c2b9e8cb27e7d922d52cfdd6296fcd440ee302e3e1a95d005c2c5086b258eefce0a0fd6b8becc36cec8d91600d77b54ef5ef57fbf5',
      h1: '307e213241bcd49c7998da5189949c129ca96749023c559a42a96b6f7f208ddd889ba7bb3c188a55641c2dad5c8a1f5a2de65e30704791df6e07388240e621c7dcf5f4bd8bb92e2a25917230d63ca9ce78fe4ee0fa5ac2de7c5d6d020edbf7f3fbdf43f6515fcfc3f2e3aebc346def803f4192182d286a970c3453b866179dc920ce5a90d8def2007b915077e20cde3c3d1380e65753af72755b2334eb66cabb6fadb3d41da23ac6d07570b109ef31f92bd76d55faa6d321ea9b1b24dcb8bdd1cfa9a42156779b3cbaa690b62cbd897a6851d04e7fa5444fabb0e0cc0812fa104ca4b76b62bc7816d8a9f71c3fb471e742287a98692cf604e1e81d5db00f840d6e1da133600ed1088285f1449b3d47000cc319ea129a0436c8f22b59105df505297bf110502c83d062bff1efd2d5e3e1b8c2b0b692d7ff487741f27354f66fcd0f90d24cac0671d528b2561ce72e2aedc357c1e6900588704fcb2b863387115c151ccf30c062d5dc541291b57c170aa256a7dc73825127b74f0a078600428efc',
      h2: '287a26bf9efefd5558ef324952207aa070428d77b6da47cff4c91444fefe35e33bd9ba47dfcb1e9bfda0cd0456bf72e1dcff367769879f7c3a8c98511a54375a3b09c0359d6c9954a23b7107ce15729b48cfbf6b40012ea2cceacca7c50ee8db3fa109e8989ed485abaa029fda1471e9f4fe8d617afbfd4f0f0b3efe19e21f112815e79d251fdbd5ce99b16c8f106a7a869bcc4da3489c1785b82b5bae9084e3efa87bc7ab372ae1f2c548e17a3b1f202c014e6cbfd523602711ad9c592d2b30b0659516c045b23c8fff81109898b8ef1ab6a1954c040f43bd0eb85fc5750ef8c74c908b87394a50ab92a2d5ac6156f18dce249df7775a0e390a66f3ae56a1a2c2a3b3cffbe9c42a56bf7185d827bddf9679ba0ecc00724409906f30b08c05e02311b0d5cf4b7d287afb835e177f2f65fd0c782739f1312795850c6b5c9f723e68f0e9039c07e0c11c5fb23553f1373f9036da1f57cb10473a561aff9fa5200644c478ea132b077e4042a3adaf47b5cd9abff167e786e5e7492e895afca6c0f9',
    },
  ];

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
