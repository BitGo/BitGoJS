# BitGo Express Release Notes

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
