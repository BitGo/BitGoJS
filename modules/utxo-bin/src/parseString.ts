type Format = 'hex' | 'base64';
export function stringToBuffer(data: string, format: Format | Format[]): Buffer {
  if (typeof format !== 'string') {
    for (const f of format) {
      try {
        return stringToBuffer(data, f);
      } catch (err) {
        // ignore, try next
      }
    }
    throw new Error(`could not parse data, formats: ${format}`);
  }

  // strip all whitespace
  data = data.replace(/\s*/g, '');

  if (format === 'hex') {
    data = data.toLowerCase();
  }

  const buf = Buffer.from(data, format);
  // make sure there were no decoding errors
  if (buf.toString(format) !== data) {
    throw new Error(`invalid ${format}`);
  }
  return buf;
}
