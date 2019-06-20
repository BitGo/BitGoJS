# BitGo Express Local Signing Server (REST API)


Suitable for developers working in a language without an official BitGo SDK.

BitGo Express runs as a service in your own datacenter, and handles the client-side operations involving your own keys, such as partially signing transactions before submitting to BitGo.
This ensures your keys never leave your network, and are not seen by BitGo. BitGo Express can also proxy the standard BitGo REST APIs, providing a unified interface to BitGo through a single REST API.

# Running BitGo Express

## Docker

For most users, we recommend running BitGo Express as a docker container.

To try it out, run this command:
```bash
$ docker run -it --rm -p 3080:3080 bitgosdk/express:latest
```

You should see this output from the container:
```
BitGo-Express running
Environment: test
Base URI: http://0.0.0.0:3080
```

You can then send a ping request to BitGo Express using curl:
```bash
$ curl localhost:3080/api/v2/ping
{"status":"service is ok!","environment":"BitGo Testnet","configEnv":"testnet","configVersion":79}
```

## From source

For users who are unable to run BitGo Express as a docker container, we recommend building and running from the source code.

### Prerequisites

Please make sure you are running at least Node version 8 (the latest LTS release is recommended) and NPM version 6.
We recommend using `nvm`, the [Node Version Manager](https://github.com/creationix/nvm/blob/master/README.markdown#installation), for setting your Node version.

### Cloning the repository and installing dependencies

```bash
$ git clone https://github.com/bitgo/bitgojs
$ cd bitgojs/modules/express
$ npm ci
```

### Running BitGo Express

From the express module folder (`modules/express`), run this command:

`npm run start [-h] [-v] [-p PORT] [-b BIND] [-e ENV] [-d] [-l LOGFILEPATH] [-k KEYPATH] [-c CRTPATH]`

**Note:** When running against the BitGo production environment, you must run node in a production configuration as well. You can do that by running `export NODE_ENV=production` prior to starting bitgo-express.

## Command line flags

| Flag Short Name | Flag Long Name | Default Value | Description |
| --- | --- | --- | --- |
| -p | --port | 3080 | Port which bitgo express should listen on. |
| -b | --bind | localhost | Interface which bitgo express should listen on. To listen on all interfaces, this should be set to `0.0.0.0`. |
| -e | --env | test | BitGo environment to interact with. |
| -d | --debug | N/A | Enable debug output for bitgo-express. This is equivalent to passing `--debugnamespace bitgo:express`. |
| -D | --debugnamespace | N/A | Enable debug output for a particular debug namespace. |
| -k | --keypath | N/A | Path to SSL .key file (required if running against production environment). |
| -c | --crtpath | N/A | Path to SSL .crt file (required if running against production environment). |
| -u | --customrooturi | N/A | Force a custom BitGo URI. |
| -n | --custombitcoinnetwork | N/A | Force a custom BitGo network |
| -l | --logfile | N/A | Filepath to write access logs. |
| N/A | --disablessl | N/A | Disable requiring SSL when accessing bitgo production environment. **USE AT YOUR OWN RISK, NOT RECOMMENDED**. |
| N/A | --disableproxy | N/A | Disable proxying of routes not explicitly handled by bitgo-express |
| N/A | --disableenvcheck | N/A | Disable checking for correct `NODE_ENV` environment variable when running against BitGo production environment. |

# Release Notes

You can find the complete release notes (since version 4.44.0) [here](https://github.com/BitGo/BitGoJS/blob/master/RELEASE_NOTES.md).
