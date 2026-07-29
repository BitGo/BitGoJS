/**
 * @prettier
 */
import { StringDecoder } from 'string_decoder';

/**
 * Custom utf8 TextDecoder that uses StringDecoder under the hood.
 * This should only be used with utf8 and does NOT support TextDecoder options, like streaming.
 */
export class StringTextDecoder extends TextDecoder {
  public decode(input?: Buffer, options?: TextDecodeOptions): string {
    // Note: streaming is not necessary for deserializing EOS transactions.
    const decoder = new StringDecoder('utf8');

    if (input) {
      const decoded = decoder.end(Buffer.from(input));
      return decoded;
    }

    return '';
  }
}
