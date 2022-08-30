import { bech32 } from 'bech32';

export function encodeLnurl(url: string) {
  return bech32.encode('lnurl', bech32.toWords(Buffer.from(url)));
}

export function decodeLnurl(lnurl: string) {
  const splittedLnurl = lnurl.split(':');

  let parsedLnurl: string;
  if (splittedLnurl.length === 2) {
    if (splittedLnurl[0] !== 'lightning') {
      throw new Error('invalid lnurl');
    }
    parsedLnurl = splittedLnurl[1];
  } else {
    parsedLnurl = splittedLnurl[0];
  }
  const { prefix, words } = bech32.decode(parsedLnurl, 2000);

  if (prefix !== 'lnurl') {
    throw new Error('invalid lnurl');
  }

  return Buffer.from(bech32.fromWords(words)).toString();
}
