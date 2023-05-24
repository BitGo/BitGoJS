import React, { useState } from 'react';
import { EcdsaTypes, EcdsaRangeProof } from '@bitgo/sdk-lib-mpc';
import ReactJson from 'react-json-view';

const EcdsaChallenge = () => {
  const [challenge, setChallenge] = useState<
    EcdsaTypes.SerializedNtildeWithProofs | undefined
  >(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  const [totalTime, setTotalTime] = useState<number | undefined>(undefined);

  const generateChallenge = async () => {
    setLoading(true);
    const start = new Date().getTime() / 1000;
    const challenge = await EcdsaRangeProof.generateNtilde(3072);
    const end = new Date().getTime() / 1000;
    setChallenge(EcdsaTypes.serializeNtildeWithProofs(challenge));
    setTotalTime(end - start);
    setLoading(false);
  };

  return (
    <React.Fragment>
      <h3>Challenge</h3>
      <br />
      {challenge ? (
        <div>
          <ReactJson
            src={challenge}
            displayDataTypes={true}
            enableClipboard={true}
          />
          <h4>Time to generate (s)</h4>
          <h5>{totalTime}</h5>
        </div>
      ) : null}
      {loading ? <h4> Loading... </h4> : null}
      <button onClick={generateChallenge}>Generate Challenge</button>
    </React.Fragment>
  );
};

export default EcdsaChallenge;
