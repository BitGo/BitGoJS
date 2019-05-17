# Installing

```bash
$ yarn install
```

# Running tests

Modules typically provide both unit and integration tests.

The rule of thumb for whether a test is a unit test or an integration test is whether or not the test makes a real network request to another system. If it does, it's probably an integration test, otherwise it's a unit test.

You can run unit tests for each individual module:
```bash
$ yarn run unit-test --scope bitgo
```

You can also run unit tests for all modules in parallel:
```bash
$ yarn run unit-test
```

Or just the modules which have changed since master:
```bash
$ yarn run unit-test-changed
```

**Note:** Each module's output will be prefixed with it's name, but it may be difficult to unmangle the test output.


# Working with modules

## Module Configuration
Each module should have the following file structure:
```
- modules/
  - mymodule/
    - src/
      - index.ts
    - test/
      - unit/
        - test-feature.ts
      - integration/
        - test-feature.ts
    - package.json
    - README.md
```

## `package.json`

* ### `name`
For a binary application module named "fooapp", this should be set to `@bitgo/fooapp`.

For a generic library module named "bar", this should be set to `@bitgo/sdk-lib-bar`.

For a coin library module which supports a coin with ticker "BAZ", this should be set to `@bitgo/sdk-coin-baz`.

* ### `scripts`

| Name | Description | Required? |
| --- | --- | --- |
| `unit-test` | Run module unit tests | Yes |
| `integration-test` | Run module integration tests. These are run when a PR is targeted to merge against master. | Yes |
| `build` | Compile typescript sources | Yes |
| `clean` | Clean up generated build files | No |
| `audit` | Run a vulnerability against the module dependencies | Yes | 
| `gen-coverage` | Generate a code coverage report | No |
| `upload-coverage` | Upload a code coverage report | No |

Additional scripts should be placed in `scripts/` and should be plain javascript.

* ### `repository`

This shall always be set for all modules to:
```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/BitGo/BitGoJS.git"
  }
}
```

* ### `license`

License shall be `Apache-2.0`.

* ### `engines`

Engines should be set to the following:
```json
{
  "engines": {
    "node": ">=6.12.3 <13.0.0",
    "npm": ">=3.10.10"
  }
}
```

* ### 

## `tsconfig.json`

There are a few things each module's `tsconfig.json` must do:
* Extend the root tsconfig.json
* Set the `outDir` and `rootDir` compiler options
* Set the `include` property to the correct module source directories (`package.json` should also be included if it is read at runtime)

Here is a template to help get started:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "."
  },
  "include": [
    "src/**/*",
    "test/**/*",
    "package.json"
  ]
}
```
