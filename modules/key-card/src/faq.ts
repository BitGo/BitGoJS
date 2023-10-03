import { FAQ } from './types';

export function generateFaq(coinName: string): FAQ[] {
  const sectionACoinSpecific = `The KeyCard contains important information which can be used to recover the ${coinName} `;
  const sectionBCoinSpecific = `If you have lost or damaged all copies of your KeyCard, your ${coinName} is still safe, but this `;
  const sectionCCoinSpecific = `source tools at https://github.com/bitgo to recover your ${coinName}. Note: You should never enter `;
  const sectionDCoinSpecific = `your KeyCard will be able to steal your ${coinName}. We recommend keeping your wallet password `;

  return [
    {
      question: 'What is the KeyCard?',
      answer: [
        sectionACoinSpecific,
        'from your wallet in several situations. Each BitGo wallet has its own, unique KeyCard. ',
        'If you have created multiple wallets, you should retain the KeyCard for each of them.',
      ],
    },
    {
      question: 'What should I do with it?',
      answer: [
        'You should print the KeyCard and/or save the PDF to an offline storage device. The print-out ',
        "or USB stick should be kept in a safe place, such as a bank vault or home safe. It's a good idea ",
        'to keep a second copy in a different location.',
        '',
        "Important: If you haven't provided an external backup key, then the original PDF should be ",
        'deleted from any machine where the wallet will be regularly accessed to prevent malware from ',
        'capturing both the KeyCard and your wallet passcode.',
      ],
    },
    {
      question: 'What should I do if I lose it?',
      answer: [
        sectionBCoinSpecific,
        'Wallet should be considered at risk for loss. As soon as is convenient, you should use BitGo ',
        'to empty the wallet into a new wallet and discontinue use of the old wallet.',
      ],
    },
    {
      question: 'What if someone sees my KeyCard?',
      answer: [
        "Don't panic! All sensitive information on the KeyCard is encrypted with your passcode, or with a",
        'key which only BitGo has. But, in general, you should make best efforts to keep your ',
        'KeyCard private. If your KeyCard does get exposed or copied in a way that makes you ',
        'uncomfortable, the best course of action is to empty the corresponding wallet into another ',
        'wallet and discontinue use of the old wallet.',
      ],
    },
    {
      question: 'What if I forget or lose my wallet password?',
      answer: [
        'BitGo can use the information in QR Code D to help you recover access to your wallet. ',
        'Without the KeyCard, BitGo is not able to recover funds from a wallet with a lost password.',
      ],
    },
    {
      question: 'What if BitGo becomes inaccessible for an extended period?',
      answer: [
        "Your KeyCard and wallet passcode can be used together with BitGo's published open ",
        sectionCCoinSpecific,
        'information from your KeyCard into tools other than the tools BitGo has published, or your ',
        'funds may be at risk for theft.',
      ],
    },
    {
      question: 'Should I write my wallet password on my KeyCard?',
      answer: [
        "No! BitGo's signature scheme approach to security depends on there not being a single point ",
        'of attack. But if your wallet password is on your KeyCard, then anyone who gains access to ',
        sectionDCoinSpecific,
        'safe in a secure password manager such as LastPass, 1Password or KeePass.',
      ],
    },
  ];
}
