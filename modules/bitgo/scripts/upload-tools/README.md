# BitGo SDK Upload Tools

`bitgosdk/upload-tools` is a `node:10`-derived docker image which has a few npm packages pre-installed to reduce install times during builds.

Currently, the following binaries are installed via `yarn global add`:
* `codecov`
* `typedoc`

The following libraries are installed via `yarn add`:
* `aws-sdk`
