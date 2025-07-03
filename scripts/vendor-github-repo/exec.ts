import { ChildProcess } from 'child_process';

/**
 * Executes a child process and waits for it to finish.
 * Pipes the process's stdout and stderr to the parent process's stdout and stderr.
 */
export async function wait(p: ChildProcess): Promise<void> {
  p.stderr?.pipe(process.stderr);
  p.stdout?.pipe(process.stdout);
  return new Promise((resolve, reject) => {
    p.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
}
