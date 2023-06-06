/*
 * Contains a high-performance implementation of reading from stdin.
 * Standard readline is extremely slow for long lines.
 */

/**
 * Reads from stdin until Ctrl-D is pressed.
 */
export async function readStdin(): Promise<string> {
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
