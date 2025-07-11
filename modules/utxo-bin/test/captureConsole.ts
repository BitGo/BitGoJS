import * as util from 'node:util';

export async function captureConsole<T>(
  func: () => Promise<T>
): Promise<{ stdout: string; stderr: string; result: T }> {
  process.env.NO_COLOR = '1'; // Disable colors in console output for easier testing
  const oldConsoleLog = console.log;
  const oldConsoleError = console.error;

  const stdoutData: string[] = [];
  const stderrData: string[] = [];

  console.log = (...args: any[]) => {
    stdoutData.push(util.format(...args));
  };

  console.error = (...args: any[]) => {
    stderrData.push(util.format(...args));
  };

  let result: T;
  try {
    result = await func();
  } finally {
    console.log = oldConsoleLog;
    console.error = oldConsoleError;
  }

  const join = (data: string[]) => (data.length > 0 ? data.join('\n') + '\n' : '');

  return {
    stdout: join(stdoutData),
    stderr: join(stderrData),
    result,
  };
}
