/**
 * @hidden
 */

/**
 */
import { isUndefined } from 'lodash';
import { Keychain } from '../keychains';
/**
 * Return the list of questions that will appear on the second page of the keycard
 * @param coin name of the coin
 */
const generateQuestions = (coin: string) => {
  return [
    {
      q: 'What is the KeyCard?',
      a:
        [
          `The KeyCard contains important information which can be used to recover the ${coin} `,
          'from your wallet in several situations. Each BitGo wallet' +
          ' has its own, unique KeyCard. ',
          'If you have created multiple wallets, you should retain the KeyCard for each of them.'
        ]
    },
    {
      q: 'What should I do with it?',
      a:
        [
          'You should print the KeyCard and/or save the PDF to an offline storage device. The print-out ',
          'or USB stick should be kept in a safe place, such as a bank vault or home safe. It\'s a good idea ',
          'to keep a second copy in a different location.',
          '',
          'Important: If you haven\'t provided an external backup key, then the original PDF should be ',
          'deleted from any machine where the wallet will be regularly accessed to prevent malware from ',
          'capturing both the KeyCard and your wallet passcode.'
        ]
    },
    {
      q: 'What should I do if I lose it?',
      a:
        [
          `If you have lost or damaged all copies of your KeyCard, your ${coin} is still safe, but this `,
          'wallet should be considered at risk for loss. As soon as is convenient, you should use BitGo ',
          'to empty the wallet into a new wallet',
          ', and discontinue use of the old wallet.'
        ]
    },
    {
      q: 'What if someone sees my KeyCard?',
      a:
        [
          'Don\'t panic! All sensitive information on the KeyCard is encrypted with your passcode, or with a',
          'key which only BitGo has. But, in general, you should make best efforts to keep your ',
          'KeyCard private. If your KeyCard does get exposed or copied in a way that makes you ',
          'uncomfortable, the best course of action is to empty the corresponding wallet into another ',
          'wallet and discontinue use of the old wallet.'
        ]
    },
    {
      q: 'What if I forget or lose my wallet password?',
      a:
        [
          'BitGo can use the information in QR Code D to help you recover access to your wallet. ',
          'Without the KeyCard, BitGo is not able to recover funds from a wallet with a lost password.'
        ]
    },
    {
      q: 'What if BitGo becomes inaccessible for an extended period?',
      a:
        [
          'Your KeyCard and wallet passcode can be used together with BitGo’s published open ',
          `source tools at https://github.com/bitgo to recover your ${coin}. Note: You should never enter `,
          'information from your KeyCard into tools other than the tools BitGo has published, or your ',
          'funds may be at risk for theft.'
        ]
    },
    {
      q: 'Should I write my wallet password on my KeyCard?',
      a:
        [
          'No! BitGo’s multi-signature approach to security depends on there not being a single point ',
          'of attack. But if your wallet password is on your KeyCard, then anyone who gains access to ',
          `your KeyCard will be able to steal your ${coin}. We recommend keeping your wallet password `,
          'safe in a secure password manager such as LastPass, 1Password or KeePass.'
        ]
    }
  ];
};

interface GetKeyDataOptions {
  encrypt: (params: {input: string, password: string}) => string,
  userKeychain: Keychain;
  bitgoKeychain: Keychain;
  backupKeychain: Keychain;
  coinShortName: string;
  passphrase?: string;
  passcodeEncryptionCode?: string;
  walletKeyID?: string;
  backupKeyID?: string
}

/**
 * Collect all data which will go onto the keycard
 * @param options
 */
function getKeyData(options: GetKeyDataOptions): any {
  const {
    encrypt,
    userKeychain,
    bitgoKeychain,
    backupKeychain,
    coinShortName,
    passphrase,
    passcodeEncryptionCode,
    walletKeyID,
    backupKeyID,
  } = options;

  // When using just 'generateWallet', we get back an unencrypted prv for the backup keychain
  // If the user passes in their passphrase, we can encrypt it
  if (backupKeychain.prv && passphrase) {
    backupKeychain.encryptedPrv = encrypt({
      input: backupKeychain.prv,
      password: passphrase
    });
  }

  // If we have the passcode encryption code, create a box D with the encryptedWalletPasscode
  let encryptedWalletPasscode;
  if (passphrase && passcodeEncryptionCode) {
    encryptedWalletPasscode = encrypt({
      input: passphrase,
      password: passcodeEncryptionCode,
    });
  }

  // PDF QR Code data
  const qrData: any = {
    user: {
      title: 'A: User Key',
      desc: 'This is your private key, encrypted with your passcode.',
      data: userKeychain.encryptedPrv,
    },
    backup: {
      title: 'B: Backup Key',
      desc: 'This is your backup private key, encrypted with your passcode.',
      data: backupKeychain.encryptedPrv,
    },
    bitgo: {
      title: 'C: BitGo Public Key',
      desc: 'This is the public part of the key that BitGo will use to ' +
        'co-sign transactions\r\nwith you on your wallet.',
      data: bitgoKeychain.pub,
    },
    passcode: {
      title: 'D: Encrypted Wallet Password',
      desc: 'This is the wallet  password, encrypted client-side ' +
        'with a key held by\r\nBitGo.',
      data: encryptedWalletPasscode,
    },
  };

  if (walletKeyID) {
    qrData.user.keyID = walletKeyID;
  }

  if (backupKeyID) {
    qrData.backup.keyID = backupKeyID;
  }

  if (isUndefined(userKeychain.encryptedPrv)) {
    // User provided their own key - this is a cold wallet
    qrData.user.title = 'A: Provided User Key';
    qrData.user.desc = 'This is the public key you provided for your wallet.';
    qrData.user.data = userKeychain.pub;

    // The user provided their own public key, we can remove box D
    delete qrData.passcode;
  } else if (isUndefined(encryptedWalletPasscode)) {
    delete qrData.passcode;
  }

  if (!isUndefined(backupKeychain.provider)) {
    const backupKeyProviderName = backupKeychain.provider;
    // Backup key held with KRS
    qrData.backup = {
      title: 'B: Backup Key',
      desc:
        `This is the public key held at ${backupKeyProviderName}` +
        `, an ${coinShortName} recovery service. If you lose\r\nyour key, ${backupKeyProviderName}` +
        ' will be able to sign transactions to recover funds.',
      data: backupKeychain.pub,
    };
  } else if (isUndefined(backupKeychain.encryptedPrv)) {
    // User supplied the xpub
    qrData.backup = {
      title: 'B: Backup Key',
      desc: 'This is the public portion of your backup key, which you provided.',
      data: backupKeychain.pub,
    };
  }


  return qrData;
}

interface DrawKeycardOptions extends GetKeyDataOptions {
  jsPDF: any;
  QRCode: any;
  coinShortName: string;
  activationCode: string;
  walletLabel: string;
  coinName: string;
}

/**
 * Draw a keycard into a new pdf document object
 * @param options
 */
export function drawKeycard(options: DrawKeycardOptions): any {
  const {
    jsPDF,
    QRCode,
    coinShortName,
    activationCode,
    walletLabel,
    coinName,
  } = options;

  const margin = 30;

  const font = {
    header: 24,
    subheader: 15,
    body: 12
  };

  const color = {
    black: '#000000',
    darkgray: '#4c4c4c',
    gray: '#9b9b9b',
    red: '#e21e1e'
  };

  // document details
  const width = 8.5 * 72;
  let y = 0;

  // Helpers for data formatting / positioning on the paper
  const left = (x) => margin + x;
  const moveDown = (yDelta) => { y += yDelta; };

  const doc = new jsPDF('portrait', 'pt', 'letter');
  doc.setFont('helvetica');

  // PDF Header Area - includes the logo and company name
  // This is data for the BitGo logo in the top left of the PDF
  moveDown(30);

  // We don't currently add an image, since that path is dependent on BitGo frontend
  // doc.addImage(coinUtility.getSelectedCoinObj().keyCardImage, left(0), y + 10);

  // Activation Code
  moveDown(8);
  doc.setFontSize(font.body).setTextColor(color.gray);
  doc.text('Activation Code', left(460), y);

  doc.setFontSize(font.header).setTextColor(color.black);
  moveDown(25);
  doc.text('Your BitGo KeyCard', left(150), y);
  doc.setFontSize(font.header).setTextColor(color.gray);
  doc.text(activationCode.toString(), left(460), y);

  // Subheader
  // titles
  moveDown(margin);
  doc.setFontSize(font.body).setTextColor(color.gray);
  doc.text(`Created on ${new Date().toDateString()} by ${window.location.hostname} for wallet named ${walletLabel}`, left(0), y);
  // copy
  moveDown(25);
  doc.setFontSize(font.subheader).setTextColor(color.black);
  doc.text(walletLabel, left(0), y);
  // Red Bar
  moveDown(20);
  doc.setFillColor(255, 230, 230);
  doc.rect(left(0), y, width - 2 * margin, 32, 'F');

  // warning message
  moveDown(20);
  doc.setFontSize(font.body).setTextColor(color.red);
  doc.text('Print this document, or keep it securely offline. See second page for FAQ.', left(75), y);

  const {
    encrypt,
    passphrase,
    passcodeEncryptionCode,
    walletKeyID,
    backupKeyID,
    userKeychain,
    bitgoKeychain,
    backupKeychain,
  } = options;

  // Get the data for the first page (qr codes)
  const keyData = getKeyData({
    encrypt,
    coinShortName,
    passphrase,
    passcodeEncryptionCode,
    walletKeyID,
    backupKeyID,
    userKeychain,
    bitgoKeychain,
    backupKeychain,
  });

  // Generate the first page's data for the backup PDF
  moveDown(35);
  const qrSize = 130;

  // Draw each Box with QR code and description
  Object.keys(keyData).forEach(function(keyType) {
    const key = keyData[keyType];
    const topY = y;

    // Don't indent if we're not producing QR codes
    const textLeft = !!QRCode ? left(qrSize + 15) : left(15);

    // Draw a QR code if library is available
    if (QRCode) {
      const dataURL = new QRCode({ value: key.data, size: qrSize }).toDataURL('image/jpeg');
      doc.addImage(dataURL, left(0), y, qrSize, qrSize);
    }

    doc.setFontSize(font.subheader).setTextColor(color.black);
    moveDown(10);
    doc.text(key.title, textLeft, y);
    moveDown(15);
    doc.setFontSize(font.body).setTextColor(color.darkgray);
    doc.text(key.desc, textLeft, y);
    moveDown(30);
    doc.setFontSize(font.body - 2);
    doc.text('Data:', textLeft, y);
    moveDown(15);
    const innerWidth = 72 * 8.5 - textLeft - 30;
    doc.setFont('courier').setFontSize(9).setTextColor(color.black);
    const lines = doc.splitTextToSize(key.data, innerWidth);
    doc.text(lines, textLeft, y);

    // Add key ID (derivation string) if it exists
    if (key.keyID) {
      const text = 'Key Id: ' + key.keyID;
      // Gray bar
      moveDown(45);
      doc.setFillColor(247, 249, 249); // Gray background
      doc.setDrawColor(0, 0, 0); // Border
      doc.rect(textLeft, y, width, 15, 'FD');

      doc.text(text, textLeft + 5, y + 10);
    }

    doc.setFont('helvetica');
    // Move down the size of the QR code minus accumulated height on the right side, plus buffer
    moveDown(qrSize - (y - topY) + 15);
  });

  // Add a new page (Q + A page)
  doc.addPage();

  // 2nd page title
  y = 0;
  moveDown(55);
  doc.setFontSize(font.header).setTextColor(color.black);
  doc.text('BitGo KeyCard FAQ', left(0), y);

  const questions = generateQuestions(coinName);

  // Draw the Q + A data on the second page
  moveDown(30);
  questions.forEach(function(q) {
    doc.setFontSize(font.subheader).setTextColor(color.black);
    doc.text(q.q, left(0), y);
    moveDown(20);
    doc.setFontSize(font.body).setTextColor(color.darkgray);
    q.a.forEach(function(line) {
      doc.text(line, left(0), y);
      moveDown(font.body + 3);
    });
    moveDown(22);
  });

  return doc;
}
