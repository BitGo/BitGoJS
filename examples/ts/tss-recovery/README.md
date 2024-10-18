# Verifying user and backup key signing on a TSS Keycard Examples

## Prerequisites

Install yarn and nvm.

## Running the Examples

Navigate into `examples/ts/tss-recovery` and run `yarn install`.

```
$ cd examples/ts/tss-recovery
$ nvm use
$ yarn install
```

Use `npx ts-node` to run the desired example:

```
$ npx ts-node eddsa-recovery.ts
```

or, 

```
$ yarn test:ecdsa
```

```
$ yarn test:eddsa
```

**Note**: Complete the required TODO's for each script, i.e. replace the content of backupKey.txt and userKey.txt with the appropriate keys from your keycard and fill in the commonkeychain + wallet passphrase in the script you want to run.
