# BitGo Express Release Notes

## 8.0.0

There are no breaking changes in this version, and the major version is being bumped in order to keep versions in sync with the main `bitgo` package.

### Other Changes
* Update to `bitgo@8.0.0`

## 7.1.1

### Other Changes
* Update to `bitgo@7.1.1`

## 7.1.0

### Other Changes
* Clarify documentation for running BitGo Express in README
* Add missing dependencies to package.json
* Update to `bitgo@7.1.0`
* Copy some test utilities out of core module, so we don't have to do a cross-module include from core for these.

## 7.0.0

### Breaking Changes
* The way to provide command line options to BitGo Express in docker has been simplified, but users who give options this way will need to make a modification to how they start BitGo Express.

As an example, we'll set the `--debug` command line option. Before version 7 you would need to start it like this:
```bash
$ docker run -it bitgosdk/express:6.0.0 /var/bitgo-express/bin/bitgo-express --debug
```

In version 7 and later, that should be changed to
```
$ docker run -it bitgosdk/express:7.0.0 --debug
```

### New Features
* Allow all configuration options to be given by either environment variable or command line flag. Command line flags have the highest priority, followed by environment variables. If neither of these are set for a given option, an appropriate default will be used instead. Please see the [Configuration Values](https://github.com/BitGo/BitGoJS/tree/master/modules/express#configuration-values) section in the README for more information.

### Bug Fixes
* Add missing dependencies to package.json.

### Other Changes
* Improve documentation for running BitGo Express in Docker
* Simplify BitGo Express initialization script
* Update package-lock.json
* Update to BitGoJS@7.0.0

## 6.2.0

### Other Changes
* Upgrade to BitGoJS@6.2.0

## 6.1.0

### New Features
* Include BitGoJS version number in Express user agent, since in the future these may not always be the same.

### Other Changes
* Upgrade to BitGoJS@6.1.0

## 6.0.0

BitGo Express has been separated from the core `bitgo` Javascript library, and is now its own module in the BitGoJS monorepo. It's been split from the core Javascript library because it's an application which should be distributed differently than a library. By packaging and distributing separately, we have much better control over the tree of dependencies which BitGo Express needs to operate.

The recommended install instructions are now to install via the official bitgo-express Docker image `bitgosdk/express:latest`. If you aren't able to run bitgo-express via Docker, you can also install and run `bitgo-express` from the source code.

See the [`bitgo-express` README](https://github.com/BitGo/BitGoJS/tree/master/modules/express#running-bitgo-express) for more information on how to install and run BitGo Express.
