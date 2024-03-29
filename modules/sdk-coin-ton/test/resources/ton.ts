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
    'EQA0i8-CdGnF_DhUHHf92R1ONH6sIA9vLZ_WLcCIhfBBXwtG',
    'EQBuEuh47sv0NSCjRsQukMu1jKi9QUspsQGeYL4LWtrU81Cb',
  ],
  invalidAddresses: [
    'randomString',
    '0xc4173a804406a365e69dfb297ddfgsdcvf',
    '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
  ],
};

export const sender = {
  address: 'EQC7YVwYHggAw51s8wxryeS8gNdcsMro-u24sE727ymJySAJ',
  publicKey: 'c0c3b9dc09932121ee351b2448c50a3ae2571b12951245c85f3bd95d5e7a06f8',
};

export const recipients: Recipient[] = [
  {
    address: addresses.validAddresses[0],
    amount: AMOUNT.toString(),
  },
];

export const signedTransaction = {
  tx: 'te6cckEBAgEAsQAB4YgAQmy8N765HIcsCkExBYpKsfl7LUuXYW7MvV53d6EqWoADFgjyqp/3qccthFjfvskQ1XUeecHe8JVQ9DFGSmpwRovdPiRamZZ3PR2isMd1i5k+MdQCc9TCP/E5+rfkvMbYQU1NGLsruXHwAAAAgAAcAQB2QgB9Jzc15Nkj1GPyoSR0hIg9lzcoUjVC0MYRF1GRn2tVHpzEtAAAAAAAAAAAAAAAAAAAAAAAAHRlc3SUlVNc',
  txId: '9gEyvIsHrA79g8pmEP1EBtO8GlpZ98QnUveSYmEx6fc=',
  signable: 'q28coBQ7sbBBAR/hG4eUdDayLDsPC9FKQtA/lSYYaSQ=',
  recipient: {
    address: 'EQD6Tm5rybJHqMflQkjpCRB7Lm5QpGqFoYwiLqMjPtaqPSdZ',
    amount: '10000000',
  },
};
