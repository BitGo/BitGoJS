# Module Publishing

Modules which are part of this monorepo should be published using `lerna`. `lerna` is a tool which simplifies monorepo operations, including publishing, and automates much of the manual, repetitive work that publishing multiple modules would otherwise require.

## Incrementing module versions and publishing modules for a new RC
**This should be done upon code freeze.**

Starting from the master branch in the root of the repository, run the following commands:

```sh
$ git checkout -b rel/new-release-branch
$ npx lerna version --sign-git-commit --sign-git-tag --preid rc --message "BRE-123: Update SDK modules for sprint ABC" preminor
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

### Docker
After you've logged in through `docker login`, run:

```bash
$ docker push bitgosdk/express:latest
$ docker push bitgosdk/express:<tag>
```

Or if you are confident enough to push multiple at once, you can add the -a tag [available](https://docs.docker.com/engine/release-notes/#client-9) since `docker@20.10.0`:
```
$ docker push bitgosdk/express -a
```

### Podman
Login through `podman` with:
```bash
$ podman login docker.io -u <username>            # will need to explicitly provide registry for podman@^4.1.1
```

And you can push to the registry desired:
```bash
$ podman push docker.io/bitgosdk/express          # you can verify it by running `podman search bitgo` in case of changes
```
