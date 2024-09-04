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

parser.addArgument(['-i', '--ipc'], {
  help: 'Bind to specified IPC path instead of TCP',
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

parser.addArgument(['-u', '--customrooturi'], {
  help: 'Force custom root BitGo URI (e.g. https://test.bitgo.com)',
});

parser.addArgument(['-n', '--custombitcoinnetwork'], {
  help: 'Force custom bitcoin network (e.g. testnet)',
});

parser.addArgument(['-l', '--logfile'], {
  help: 'Filepath to write the access log',
});

parser.addArgument(['--disablessl'], {
  action: 'storeConst',
  constant: true,
  help: 'Allow running against production in non-SSL mode (at your own risk!)',
});

parser.addArgument(['--disableproxy'], {
  action: 'storeConst',
  constant: true,
  help: 'disable the proxy, not routing any non-express routes',
});

parser.addArgument(['--disableenvcheck'], {
  action: 'storeConst',
  constant: true,
  help: 'disable checking for proper NODE_ENV when running in prod environment',
});

parser.addArgument(['-t', '--timeout'], {
  help: 'Proxy server timeout in milliseconds',
});

parser.addArgument(['--authversion'], {
  help: 'BitGo authentication scheme version to use (default 2). See BitGo documentation for more details on auth versions.',
});

parser.addArgument(['--externalSignerUrl'], {
  help: 'URL which specifies the external signing API.',
});

parser.addArgument(['--signerMode'], {
  action: 'storeConst',
  constant: true,
  help: 'Flag setting the BitGo SDK instance to either "generator" or "signer" mode, which enables use of the external signing API.',
});

parser.addArgument(['--signerFileSystemPath'], {
  help: 'Local path specifying where an Express signer machine keeps encrypted user private keys.',
});

parser.addArgument(['--lightningSignerFileSystemPath'], {
  help: 'Local path specifying where an Express machine keeps lightning signer urls.',
});
export const args = () => parser.parseArgs();
