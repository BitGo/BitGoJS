import { rangeProof } from '@bitgo/sdk-core';
// const rangeProof = require('bitgo/sdk-core');
// importScripts('./crap.js');
addEventListener('message', async (event) => {
  console.log(event);
  const nTilde = await rangeProof.generateNTilde(3072);
  console.log(nTilde);

  postMessage(nTilde);
});
