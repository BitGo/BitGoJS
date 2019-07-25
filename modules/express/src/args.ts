import { ArgumentParser } from 'argparse';

const { version: expressVersion } = require('../package.json');
const { version: bitgoVersion } = require('bitgo/package.json');

const parser = new ArgumentParser({
  version: `${expressVersion}, bitgo@${bitgoVersion}`,
  addHelp: true,
  description: 'BitGo-Express',
});

parser.addArgument(['-p', '--port'], {
  type: 'int',
  help: 'Port to listen on',
});

parser.addArgument(['-b', '--bind'], {
  help: 'Bind to given address to listen for connections (default: localhost)',
});

parser.addArgument(['-e', '--env'], {
  help: 'BitGo environment to proxy against (prod, test)',
});

parser.addArgument(['-d', '--debug'], {
  action: 'appendConst',
  dest: 'debugnamespace',
  constant: 'bitgo:express',
  help: 'Enable basic debug logging for incoming requests',
});

parser.addArgument(['-D', '--debugnamespace'], {
  action: 'append',
  help: 'Enable a specific debugging namespace for more fine-grained debug output. May be given more than once.',
});

parser.addArgument(['-k', '--keypath'], {
  help: 'Path to the SSL Key file (required if running production)',
});

parser.addArgument(['-c', '--crtpath'], {
  help: 'Path to the SSL Crt file (required if running production)',
});

parser.addArgument( ['-u', '--customrooturi'], {
  help: 'Force custom root BitGo URI (e.g. https://test.bitgo.com)',
});

parser.addArgument(['-n', '--custombitcoinnetwork'], {
  help: 'Force custom bitcoin network (e.g. testnet)',
});

parser.addArgument(['-l', '--logfile'], {
  help: 'Filepath to write the access log',
});

parser.addArgument(['--disablessl'], {
  action: 'storeTrue',
  help: 'Allow running against production in non-SSL mode (at your own risk!)',
});

parser.addArgument(['--disableproxy'], {
  action: 'storeTrue',
  help: 'disable the proxy, not routing any non-express routes',
});

parser.addArgument(['--disableenvcheck'], {
  action: 'storeTrue',
  defaultValue: true, // BG-9584: temporarily disable env check while we give users time to react to change in runtime behavior
  help: 'disable checking for proper NODE_ENV when running in prod environment',
});

parser.addArgument(['-t', '--timeout'], {
  help: 'Proxy server timeout in milliseconds',
});

export const args = () => parser.parseArgs();
