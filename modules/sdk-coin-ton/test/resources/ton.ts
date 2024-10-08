import { Recipient } from '@bitgo/sdk-core';

export const AMOUNT = 123400000;

export const privateKeys = {
  prvKey1: '43e8594854cb53947c4a1a2fab926af11e123f6251dcd5bd0dfb100604186430',
  prvKey2: 'c0c3b9dc09932121ee351b2448c50a3ae2571b12951245c85f3bd95d5e7a06f8',
  prvKey3: '3d6822bf14115f47a5724b68c85160221eacbe664e892a4a9dd3b4dd64016ece',
  prvKey4: 'ba4c313bcf830b825adaa3ae08cfde86e79e15a84e6fdc3b1fe35a6bb82d9f22',
  prvKey5: 'fdb9ea1bb7f0120ce6eb7b047ac6744c4298f277756330e18dbd5419590a1ef2',
};

export const addresses = {
  validAddresses: [
    'UQA0i8-CdGnF_DhUHHf92R1ONH6sIA9vLZ_WLcCIhfBBX1aD',
    'EQBuEuh47sv0NSCjRsQukMu1jKi9QUspsQGeYL4LWtrU81Cb',
  ],
  invalidAddresses: [
    'randomString',
    '0xc4173a804406a365e69dfb297ddfgsdcvf',
    '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
  ],
};

export const sender = {
  address: 'UQAbJug-k-tufWMjEC1RKSM0iiJTDUcYkC7zWANHrkT55Afg',
  publicKey: 'c0c3b9dc09932121ee351b2448c50a3ae2571b12951245c85f3bd95d5e7a06f8',
};

export const recipients: Recipient[] = [
  {
    address: addresses.validAddresses[0],
    amount: AMOUNT.toString(),
  },
];

export const signedSendTransaction = {
  tx: 'te6cckEBAgEAqQAB4YgBJAxo7vqHF++LJ4bC/kJ8A1uVRskrKlrKJZ8rIB0tF+gCadlSX+hPo2mmhZyi0p3zTVUYVRkcmrCm97cSUFSa2vzvCArM3APg+ww92r3IcklNjnzfKOgysJVQXiCvj9SAaU1NGLsotvRwAAAAMAAcAQBmQgAaRefBOjTi/hwqDjv+7I6nGj9WEAe3ls/rFuBEQvggr5zEtAAAAAAAAAAAAAAAAAAAdfZO7w==',
  txBounceable:
    'te6cckEBAgEAqQAB4YgBJAxo7vqHF++LJ4bC/kJ8A1uVRskrKlrKJZ8rIB0tF+gCadlSX+hPo2mmhZyi0p3zTVUYVRkcmrCm97cSUFSa2vzvCArM3APg+ww92r3IcklNjnzfKOgysJVQXiCvj9SAaU1NGLsotvRwAAAAMAAcAQBmYgAaRefBOjTi/hwqDjv+7I6nGj9WEAe3ls/rFuBEQvggr5zEtAAAAAAAAAAAAAAAAAAAYubM0w==',
  txId: 'tuyOkyFUMv_neV_FeNBH24Nd4cML2jUgDP4zjGkuOFI=',
  txIdBounceable: 'tuyOkyFUMv_neV_FeNBH24Nd4cML2jUgDP4zjGkuOFI=',
  signable: 'k4XUmjB65j3klMXCXdh5Vs3bJZzo3NSfnXK8NIYFayI=',
  bounceableSignable: 'k4XUmjB65j3klMXCXdh5Vs3bJZzo3NSfnXK8NIYFayI=',
  recipient: {
    address: 'EQA0i8-CdGnF_DhUHHf92R1ONH6sIA9vLZ_WLcCIhfBBXwtG',
    amount: '10000000',
  },
  recipientBounceable: {
    address: 'UQA0i8-CdGnF_DhUHHf92R1ONH6sIA9vLZ_WLcCIhfBBX1aD',
    amount: '10000000',
  },
};

export const signedTransferTransaction = {
  tx: 'te6cckEBAgEAugAB4YgANk3QfSfW3PrGRiBaolJGaRREphqOMSBd5rAGj1yJ88gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU1NGLsotvRwAAAAMAAcAQCHQgAaRefBOjTi/hwqDjv+7I6nGj9WEAe3ls/rFuBEQvggr5zEtAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAQ7msoAg2I8aq',
  txBounceable:
    'te6cckEBAgEAugAB4YgANk3QfSfW3PrGRiBaolJGaRREphqOMSBd5rAGj1yJ88gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU1NGLsotvRwAAAAMAAcAQCHYgAaRefBOjTi/hwqDjv+7I6nGj9WEAe3ls/rFuBEQvggr5zEtAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAQ7msoAhFP9Yn',
  txId: 'GUD-auBCZ3PJFfAPkSfeqe8rj2OiHMTXudH4IEWdDgo=',
  txIdBounceable: 'GUD-auBCZ3PJFfAPkSfeqe8rj2OiHMTXudH4IEWdDgo=',
  signable: 'cX/GEZo6PX0rrw35kBsOk91u0CyWEzASSjM0yzfAHp4=',
  bounceableSignable: 'cX/GEZo6PX0rrw35kBsOk91u0CyWEzASSjM0yzfAHp4=',
  recipient: {
    address: 'EQA0i8-CdGnF_DhUHHf92R1ONH6sIA9vLZ_WLcCIhfBBXwtG',
    amount: '10000000',
  },
  recipientBounceable: {
    address: 'UQA0i8-CdGnF_DhUHHf92R1ONH6sIA9vLZ_WLcCIhfBBX1aD',
    amount: '10000000',
  },
};
