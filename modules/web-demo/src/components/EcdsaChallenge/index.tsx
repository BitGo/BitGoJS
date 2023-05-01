/* eslint-disable no-console */
import React, { useState } from 'react';
import { ECDSA, bigIntToBufferBE } from '@bitgo/sdk-core';

const EcdsaChallenge = () => {
  const [challenge, setChallenge] = useState<ECDSA.NTilde | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState<boolean>(false);

  // const [totalTime, setTotalTime] = useState<number | undefined>(undefined);

  const worker = React.useMemo(
    () =>
      new Worker(new URL('@src/x.worker.js', import.meta.url), {
        type: 'module',
      }),
    [],
  );
  React.useEffect(() => {
    if (worker) {
      worker.onmessage = (event: MessageEvent<ECDSA.NTilde>) => {
        console.log(event);
        setChallenge(event.data);
        setLoading(false);
      };
      worker.onerror = (event: unknown) => {
        console.log(event);
        setLoading(false);
      };
    }

    return () => worker.terminate();
  });

  const generateChallenge = async () => {
    setLoading(true);
    // const start = new Date().getTime() / 1000;
    // const challenge = await rangeProof.generateNTilde(3072);
    // worker.postMessage('hello world');
    // const end = new Date().getTime() / 1000;
    setChallenge(challenge);
    // setTotalTime(end - start);
    // setLoading(false);
  };

  return (
    <React.Fragment>
      <h3>Challenge</h3>
      <br />
      {challenge ? (
        <div>
          <h4> ntilde </h4>
          <h5>{bigIntToBufferBE(challenge.ntilde).toString('hex')}</h5>
          <h4> h1 </h4>
          <h5>{bigIntToBufferBE(challenge.h1).toString('hex')}</h5>
          <h4> h2 </h4>
          <h5>{bigIntToBufferBE(challenge.h2).toString('hex')}</h5>
          {/* {totalTime ? (
            <div>
              <h4>Time to generate (s)</h4>
              <h5>{totalTime}</h5>
            </div>
          ) : null} */}
          <h5></h5>
        </div>
      ) : null}
      {loading ? <h4> Loading... </h4> : null}
      <button onClick={generateChallenge}>Generate Challenge</button>
    </React.Fragment>
  );
};

export default EcdsaChallenge;
