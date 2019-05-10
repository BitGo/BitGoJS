# Setting up your development environment

`yarn config set workspaces-experimental true`

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
