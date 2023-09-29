import * as assert from 'assert';
import { IDrawKeyCard } from './drawKeycard';
import { GenerateKeycardParams } from '.';

export function generateParamsForKeyCreation({
  curve,
  bitgoKeychain,
  walletLabel,
  keyCardImage,
}: GenerateKeycardParams): IDrawKeyCard {
  assert(curve, 'curve is required');
  assert(bitgoKeychain, 'bitgoKeychain is required');
  assert(bitgoKeychain.id, 'bitgoKeychain.id is required');
  assert(bitgoKeychain.commonKeychain, 'bitgoKeychain.commonKeychain is required');
  return {
    walletLabel,
    keyCardImage,
    curve,
    qrData: {
      user: {
        title: 'A: Common Keychain',
        data: bitgoKeychain.commonKeychain,
        description: 'This is the common pub which is the equivalent of xpub (public key)\r\nof the key generated',
      },
      bitgo: {
        title: 'B: BitGo Key ID',
        data: bitgoKeychain.id,
        description:
          'This is the identifier assigned to the key generated using which BitGo\r\ncan lookup BitGo key share.',
      },
    },
    questions: [
      {
        question: 'What is the KeyCard?',
        answer: [
          'This key card contains information about the key id for the generated key.\r\nThis id can later be used to derive wallets.',
        ],
      },
      {
        question: 'What should I do with it?',
        answer: [
          'Store this keycard for later use. The key ID is important to communicate with BitGo\r\nto derive wallets from the key.',
        ],
      },
    ],
  };
}
