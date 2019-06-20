# Module Publishing

Modules which are part of this monorepo should be published using `lerna`. `lerna` is a tool which simplifies monorepo operations, including publishing, and automates much of the manual, repetitive work that publishing multiple modules would otherwise require.

## Incrementing module versions and publishing modules for a new RC
**This should be done upon code freeze.**

Starting from the master branch in the root of the repository, run the following commands:

```sh
$ git checkout -b rel/new-release-branch
$ npx lerna version --sign-git-commit --sign-git-tag --preid rc --message “BRE-123: Update SDK modules for sprint ABC” preminor
```

`Prepatch`, and `premajor` should be used instead of `preminor` in the above command when a patch version or major version should be bumped instead of the minor version.

Now, we can publish the newly versioned modules:

```sh
$ lerna publish --dist-tag rc from-git
```

You will be prompted for an OTP code when needed if you have 2FA enabled.

# Docker Container Image publishing

The recommended way to install and run `bitgo-express` is via a docker container, so we should be sure to update it whenever the express module's package-lock.json is updated.

## Building and tagging the BitGo Express docker container image

```bash
$ docker build -t bitgosdk/express:latest -t bitgosdk/express:$(jq -r '.version' < modules/express/package.json) .
```

## Pushing the newly built container image

TODO
