import * as process from 'process';
import * as fs from 'fs';

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

export const readStringOptions = {
  path: { type: 'string', nargs: 1, default: '' },
  stdin: { type: 'boolean', default: false },
  data: {
    type: 'string',
    description: 'hex or base64',
    alias: 'hex',
  },
  clipboard: { type: 'boolean', default: false },
} as const;

export type ReadStringOptions = {
  clipboard?: boolean;
  path?: string;
  data?: string;
  stdin: boolean;
};

/**
 * Reads from stdin until Ctrl-D is pressed.
 */
export async function readStdin(): Promise<string> {
  /*
   * High-performance implementation of reading from stdin.
   * Standard readline is extremely slow for long lines.
   */
  return new Promise((resolve, reject) => {
    // Using readline is not an option because it is extremely slow for long lines.
    // By enabling raw mode, we can read more than 4096 bytes, but it requires manual Ctrl-C/Ctrl-D handling
    if (!process.stdin.setRawMode) {
      throw new Error('stdin is not a tty');
    }
    process.stdin.setRawMode(true);
    const buf: Buffer[] = [];

    process.stdin.on('data', (chunk) => {
      if (chunk[0] === 0x03) {
        // Ctrl-C
        process.exit(130);
      }
      if (chunk[0] === 0x04) {
        // Ctrl-D
        process.stdin.emit('end');
        return;
      }
      buf.push(chunk);
      process.stdout.write(chunk);
    });

    process.stdin.on('end', () => {
      resolve(Buffer.concat(buf).toString('utf8'));
    });

    process.stdin.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * @param argv
 * @param input - optional input data. If set, this function just ensures that nothing else is set.
 * @return string from specified source
 */
export async function argToString(argv: ReadStringOptions, input?: string): Promise<string | undefined> {
  if (argv.stdin || argv.path === '-') {
    if (input) {
      throw new Error(`conflicting arguments`);
    }
    console.log('Reading from stdin. Please paste hex-encoded transaction data.');
    console.log('After inserting data, press Ctrl-D to finish. Press Ctrl-C to cancel.');
    if (process.stdin.isTTY) {
      input = await readStdin();
    } else {
      input = await fs.promises.readFile('/dev/stdin', 'utf8');
    }
  }

  if (argv.clipboard) {
    if (input) {
      throw new Error(`conflicting arguments`);
    }
    const { default: clipboardy } = await import('clipboardy');
    input = await clipboardy.read();
  }

  if (argv.path) {
    if (input) {
      throw new Error(`conflicting arguments`);
    }
    input = (await fs.promises.readFile(argv.path, 'utf8')).toString();
  }

  if (argv.data) {
    if (input) {
      throw new Error(`conflicting arguments`);
    }
    input = argv.data;
  }

  return input;
}
