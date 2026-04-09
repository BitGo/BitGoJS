/**
 * Recover XRP from a multi-sig wallet at BitGo.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo, Coin } from 'bitgo';
const bitgo = new BitGo({ env: 'prod' });

const coin = 'xrp';
const basecoin = bitgo.coin(coin) as Coin.Xrp;

async function main() {
  const response = await basecoin.recover({
    // BOX A
    userKey:
      '{"iv":"UgFBAnCOYhGpySRGlaLSrA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"vMawLQuCAZI=","ct":"RTAgWQSJOroRfWF9GT8mxsTeFwXPBYuRf9k7UeDAHSao5EZH0E5EUo0dKm2gyogpc64HYfQhmkiQgKElDYq2/EdH+PXkSZxAzWrfFNVkgmM6CyWN1IMR8vvjLnBjNSlpYHQOLR733szlP5OFntf01soVsUZHb5A="}',

    // BOX B
    backupKey:
      '{"iv":"SS/5vfzJx8Nr+YIUVENZ4Q==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"8VP7bl5uSVM=","ct":"vITKMhfemxW6lrai1TXHpGFJhyksHXBIhZ5x3bQwDGeURyLrOiVRfvIuAk5vptSQOSwU8gmfMHOSweRMjEFkw8j0RwuYp79vrDY4pu47oo/iR6uiiZ1grCLjd27hO68SULPWXrMvzLvRb8ELh9EvuoByWnujyvM="}',

    // BOX C
    rootAddress: 'rB651yVavQSCEd6xi9pzg8QkHkPrR8gR4i',

    walletPassphrase: 'supersecretpassword',

    // Ripple address to send the recovered funds to
    recoveryDestination: 'rnxYEEB1A3PBik4sTfboxYib6Hv6kKNXQR?dt=3',
  });

  console.log(JSON.stringify(response, null, 4));

  const submittedTx = await bitgo.post(basecoin.getRippledUrl()).send({
    method: 'submit',
    params: [
      {
        tx_blob: typeof response === 'string' ? response : response.txHex,
      },
    ],
  });

  console.log(JSON.stringify(submittedTx, null, 4));
}

main().catch((e) => console.error(e));
