# BitGo Express Local Signing Server (REST API)


Suitable for developers working in a language without an official BitGo SDK.

BitGo Express runs as a service in your own datacenter, and handles the client-side operations involving your own keys, such as partially signing transactions before submitting to BitGo.
This ensures your keys never leave your network, and are not seen by BitGo. BitGo Express can also proxy the standard BitGo REST APIs, providing a unified interface to BitGo through a single REST API.

# Documentation

Comprehensive documentation on the APIs provided by BitGo Express can be found at our [Platform API Reference](https://www.bitgo.com/api/v2/#tag/Express).

# Running BitGo Express

## Docker

For most users, we recommend running BitGo Express as a docker container, since this is the most secure way to run BitGo Express.

To try it out, run this command:
```bash
$ docker run -it -p 3080:3080 bitgosdk/express:latest
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

You can also give command line arguments to BitGo Express at the end of the docker run command:
```bash
$ docker run -it -p 4000:4000 bitgosdk/express:latest --port 4000 
```

BitGo Express will start up on the specified port, 4000:
```
BitGo-Express running
Environment: test
Base URI: http://0.0.0.0:4000
```

### Docker in production

When running BitGo Express in production, we strongly recommended using HTTPS to secure your connections.

If you have your own certificate, you can use it.

Or, to generate a self-signed certificate, first make a directory and navigate into it:
```bash
$ mkdir certs
$ cd certs
```
Then do the following and fill out the information that it prompts you for:
```bash
$ openssl req -newkey rsa:2048 -nodes -keyout cert.key -x509 -days 3650 -out cert.crt
```
This will output a key file ```cert.key``` and certificate file ```cert.crt```

Finally you can run your docker container like this (note, replace ```/path/to``` with the full path to your ```certs``` folder):
```bash
$ docker run -it --volume /path/to/certs:/private -p 4000:4000 bitgosdk/express:latest -p 4000 -k /private/cert.key -c /private/cert.crt -e prod
```

BitGo Express should start on the specified port, 4000:
```
BitGo-Express running
Environment: prod
Base URI: https://0.0.0.0:4000
```

### Building the docker container

If you'd like to build the BitGo Express docker container yourself from the source code, first check out the latest release branch **rel/latest**, then run `docker build` from the project root. Here's the commands:
```bash
$ git clone -b rel/latest https://github.com/bitgo/bitgojs
$ cd bitgojs
$ docker build -t bitgo-express:latest .
$ docker run -it bitgo-express:latest
```

## From source

For users who are unable to run BitGo Express as a docker container, we recommend building and running from the source code.

### Prerequisites

Please make sure you are running at least Node version 8 (the latest LTS release is recommended) and NPM version 6.
We recommend using `nvm`, the [Node Version Manager](https://github.com/creationix/nvm/blob/master/README.markdown#installation), for setting your Node version.

### Cloning the repository and installing dependencies

First, clone the latest release branch **rel/latest**, then run `npm ci` in the `modules/express` directory.
```bash
$ git clone -b rel/latest https://github.com/bitgo/bitgojs
$ cd bitgojs/modules/express
$ npm ci
```

**Note:** We do not recommend installing BitGo Express as `root`, but if you need to do so, you must run `npm ci --unsafe-perm` for the last step instead of `npm ci`.

### Running BitGo Express

From the express module folder (`modules/express`), run this command:

```bash
$ npm run start
```

You should see BitGo Express start up in the default test environment:
```
BitGo-Express running
Environment: test
Base URI: http://localhost:3080
```

You can also pass startup arguments to BitGo Express, but you must remember to put an extra `--` to separate the arguments:
```
$ npm run start -- --port 4000
```

BitGo Express will start up on the custom port:
```
BitGo-Express running
Environment: test
Base URI: http://localhost:4000
```

### Running in production

When running BitGo Express against the BitGo production environment using real funds, you should make sure the `NODE_ENV` environment variable is set to `production`. This will turn off some debugging information which could leak information about the system which is running BitGo Express. If an unsafe configuration is detected, BitGo Express will emit a warning upon startup. In a future version of BitGo Express, this will turn into a hard error and BitGo Express will fail to start up.

Additionally, when running against the production env and listening on external interfaces, BitGo Express must be run with TLS enabled by setting the `keyPath` and `crtPath` configuration options, otherwise BitGo Express will error upon startup with the following message: 

```
Fatal error: Must enable TLS when running against prod and listening on external interfaces!
Error: Must enable TLS when running against prod and listening on external interfaces!
```

We strongly recommend always enabling TLS when running against the BitGo production environment. However, if you must opt out of this requirement, you may do so by setting the `disableSSL` configuration option. **Use at your own risk, as this may allow a man-in-the-middle to access sensitive information as it is sent over the wire in cleartext.**

### BitGo Express Proxy Support

BitGo Express can also make requests to BitGo via a proxy. This can be done by setting the `BITGO_USE_PROXY` environment variable to the URI where your proxy is listening.

For example, to instruct BitGo Express to use a SOCKS proxy which is listening at 192.0.2.1 on port 12000, you should start BitGo Express with the following command:

```shell
docker run -e BITGO_USE_PROXY="socks://192.0.2.1:12000" -p 3080:3080 bitgosdk/express:latest
```

BitGo Express currently supports the following proxy protocols:

* HTTP
* HTTPS
* SOCKSv4
* SOCKSv5
* PAC

## Configuration Values

BitGo Express is able to take configuration options from either command line arguments, or via environment variables.

| Flag Short Name | Flag Long Name         | Environment Variable                     | Default Value | Description                                                                                                             |
| --------------- | ---------------------- | ---------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| -p              | --port                 | `BITGO_PORT`                             | 3080          | Port which bitgo express should listen on.                                                                              |
| -b              | --bind                 | `BITGO_BIND`                             | localhost     | Interface which bitgo express should listen on. To listen on all interfaces, this should be set to `0.0.0.0`.           |
| -e              | --env                  | `BITGO_ENV`                              | test          | BitGo environment to interact with.                                                                                     |
| -t              | --timeout              | `BITGO_TIMEOUT`                          | 305000        | Number of milliseconds to wait before requests made by `bitgo-express` time out.
| -d              | --debug                | N/A, use `BITGO_DEBUG_NAMESPACE` instead | N/A           | Enable debug output for bitgo-express. This is equivalent to passing `--debugnamespace bitgo:express`.                  |
| -D              | --debugnamespace       | `BITGO_DEBUG_NAMESPACE`                  | N/A           | Enable debug output for a particular debug namespace. Multiple debug namespaces can be given as a comma separated list. See the [`bitgo` package README](https://github.com/BitGo/BitGoJS/blob/master/modules/core/README.md#available-debug-namespaces) for a complete list of recognized options, in addition to those listed in the table below. |
| -k              | --keypath              | `BITGO_KEYPATH`                          | N/A           | Path to SSL .key file (required if running against production environment).                                             |
| -c              | --crtpath              | `BITGO_CRTPATH`                          | N/A           | Path to SSL .crt file (required if running against production environment).                                             |
| -u              | --customrooturi        | `BITGO_CUSTOM_ROOT_URI`                  | N/A           | Force a custom BitGo URI.                                                                                               |
| -n              | --custombitcoinnetwork | `BITGO_CUSTOM_BITCOIN_NETWORK`           | N/A           | Force a custom BitGo network                                                                                            |
| -l              | --logfile              | `BITGO_LOGFILE`                          | N/A           | Filepath to write access logs.                                                                                          |
| N/A             | --disablessl           | `BITGO_DISABLE_SSL` <sup>0</sup>         | N/A           | Disable requiring SSL when accessing bitgo production environment. **USE AT YOUR OWN RISK, NOT RECOMMENDED**.           |
| N/A             | --disableproxy         | `BITGO_DISABLE_PROXY` <sup>0</sup>       | N/A           | Disable proxying of routes not explicitly handled by bitgo-express                                                      |
| N/A             | --disableenvcheck      | `BITGO_DISABLE_ENV_CHECK` <sup>0</sup>   | N/A           | Disable checking for correct `NODE_ENV` environment variable when running against BitGo production environment.         |

\[0]: BitGo will also check the additional environment variables for some options for backwards compatibility, but these environment variables should be considered deprecated:
* Disable SSL
  * `DISABLESSL`
  * `DISABLE_SSL`
  * `BITGO_DISABLESSL`
* Disable Proxy
  * `DISABLE_PROXY`
* Disable Environment Check
  * `DISABLE_ENV_CHECK`
  
## Enabling Additional Debug Output

In addition to the debug namespaces defined in the [`bitgo` package README](https://github.com/BitGo/BitGoJS/blob/master/modules/core/README.md#available-debug-namespaces) there is a special BitGo Express specific debug namespaces which can be enabled:

| Namespace | Description |
| --- | --- |
| `bitgo:express` | Additional debug information specific to BitGo Express operations. |

### Example

To enable the `bitgo:v2:utxo` and `bitgo:express` debug namespaces, start BitGo Express with `--debug-namespace bitgo:v2:utxo,bitgo:express`.

Wildcards using `*` are also supported. For example, all bitgo debug namespaces can be enabled with `--debug-namespace bitgo:*`, but beware, this can be very noisy.

# Release Notes

You can find the complete release notes (since version 4.44.0) [here](https://github.com/BitGo/BitGoJS/blob/master/RELEASE_NOTES.md).
