local branches() = {
  branch: [
    "master",
    "rel/*",
    "prod/production",
  ],
};

local UnitVersions() = ["6", "8", "10", "11", "12"];
local IntegrationVersions() = ["lts"];

local Install(version, limit_branches=false) = {
  name: "install node:" + version,
  image: "node:" + version,
  commands: [
    "node --version",
    "npm --version",
    "yarn --version",
    "yarn install",
    "yarn run bootstrap",
  ],
  [if limit_branches then "when"]: branches(),
  depends_on: [ "clone" ],
};

local UploadCoverage(version, depend, tag="untagged", limit_branches=true) = {
  name: "upload coverage node:" + version,
  image: "node:"  + version,
  environment: {
    CODECOV_TOKEN: { from_secret: "codecov" },
  },
  commands: [
    "npm install -g codecov",
    "yarn run gen-coverage",
    "yarn run upload-coverage -- -F " + tag,
  ],
  [if limit_branches then "when"]: branches(),
  depends_on: [ depend + " node:" + version ]
};

local CoreUnit(version) = [
  Install(version),
  {
    name: "unit tests node:" + version,
    image: "node:" + version,
    environment: {
      BITGOJS_TEST_PASSWORD: { from_secret: "password" },
    },
    commands: [
      "lerna run unit-test",
    ],
    depends_on: [ "install node:" + version ]
  },
  UploadCoverage(version, "unit tests", "unit", false),
];

local CoreIntegration(version, limit_branches=true) = [
  Install(version, limit_branches),
  {
    name: "integration tests node:" + version,
    image: "node:" + version,
    environment: {
      BITGOJS_TEST_PASSWORD: { from_secret: "password" },
    },
    commands: [
      "lerna run integration-test",
    ],
    [if limit_branches then "when"]: branches(),
  },
  UploadCoverage(version, "integration tests", "integration", limit_branches),
];

local MeasureSizeAndTiming() = {
  kind: "pipeline",
  name: "size and timing",
  steps: [
    {
      name: "slow-deps",
      image: "node:lts",
      commands: [
        "yarn global add slow-deps",
        "slow-deps"
      ],
    },
  ],
};

local LintAll() = {
  kind: "pipeline",
  name: "lint modules",
  steps: [
    Install("lts"),
    {
      name: "lint all",
      image: "node:lts",
      commands: [
        "yarn run lint"
      ],
      depends_on: [ "install node:lts" ],
    },
  ],
};

local AuditAll() = {
  kind: "pipeline",
  name: "audit modules",
  steps: [
    Install("lts"),
    {
      name: "audit all",
      image: "node:lts",
      commands: [
        "yarn run audit"
      ],
      depends_on: [ "install node:lts" ],
    },
  ],
};

// all tests which should be run for the main bitgo module
local Core() = {
  kind: "pipeline",
  name: "SDK Core",
  steps: std.flattenArrays([
    CoreUnit(version)
    for version in UnitVersions()
  ]),
    //CoreIntegration(version)
    //for version in IntegrationVersions()
};

// common pipelines which run against all modules
[
  // common pipelines for all modules
  AuditAll(),
  LintAll(),
  MeasureSizeAndTiming(),

  // module specific pipelines (one per module)
  Core()
]

