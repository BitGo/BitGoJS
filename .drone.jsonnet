local branches() = {
  branch: [
    "master",
    "rel/*",
    "prod/production",
  ],
};

local UnitVersions() = ["6", "8", "9", "10", "11"];
local IntegrationVersions() = ["lts"];

local BuildInfo(version, limit_branches=false) = {
  name: "build information",
  image: "node:" + version,
  commands: [
    "node --version",
    "npm --version",
  ],
  [if limit_branches then "when"]: branches(),
};

local Install(version, limit_branches=false) = {
  name: "install",
  image: "node:" + version,
  commands: [
    "npm install",
    "lerna bootstrap",
  ],
  [if limit_branches then "when"]: branches(),
};

local UploadCoverage(version, tag="untagged", limit_branches=true) = {
  name: "upload coverage",
  image: "node:"  + version,
  environment: {
    CODECOV_TOKEN: { from_secret: "codecov" },
  },
  commands: [
    "npm install -g codecov",
    "lerna run gen-coverage",
    "lerna run upload-coverage -- -F " + tag,
  ],
  [if limit_branches then "when"]: branches(),
};

local CoreUnit(version) = {
  kind: "pipeline",
  name: "core unit tests (node:" + version + ")",
  steps: [
    BuildInfo(version),
    Install(version),
    {
      name: "unit tests",
      image: "node:" + version,
      environment: {
        BITGOJS_TEST_PASSWORD: { from_secret: "password" },
      },
      commands: [
        "lerna run unit-test",
      ],
    },
    UploadCoverage(version, "unit"),
  ],
};

local CoreIntegration(version, limit_branches=true) = {
  kind: "pipeline",
  name: "core integration tests (node:" + version + ")",
  steps: [
    BuildInfo(version, limit_branches),
    Install(version, limit_branches),
    {
      name: "integration tests",
      image: "node:" + version,
      environment: {
        BITGOJS_TEST_PASSWORD: { from_secret: "password" },
      },
      commands: [
        "lerna run integration-test",
      ],
      [if limit_branches then "when"]: branches(),
    },
    UploadCoverage(version, "integration", limit_branches),
  ],
};

local MeasureSizeAndTiming() = [
  {
    kind: "pipeline",
    name: "core size and timing (node:lts)",
    steps: [
      {
        name: "slow-deps",
        image: "node:lts",
        commands: [
          "npm install -g slow-deps",
          "slow-deps"
        ],
      },
    ],
  },
];

local LintAll() = [
  {
    kind: "pipeline",
    name: "lint",
    steps: [
      BuildInfo("lts"),
      Install("lts"),
      {
        name: "lint all",
        image: "node:lts",
        commands: [
          "lerna run lint"
        ],
      },
    ],
  },
];

local AuditAll() = [
  {
    kind: "pipeline",
    name: "audit all modules",
    image: "node:lts",
    steps: [
      BuildInfo("lts"),
      Install("lts"),
      {
        name: "audit all",
        image: "node:lts",
        commands: [
          "lerna run audit"
        ],
      },
    ],
  },
];

// all tests which should be run for the main bitgo module
local CoreTests() = [
  CoreUnit(version)
  for version in UnitVersions()
] + [
  CoreIntegration(version)
  for version in IntegrationVersions()
];

// common pipelines which run against all modules
AuditAll() +
LintAll() +
MeasureSizeAndTiming() +
// pipelines for core
CoreTests()

