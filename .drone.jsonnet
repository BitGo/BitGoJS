local branches() = {
  branch: [
    "master",
    "rel/*",
    "prod/production",
  ],
};

local NodeVersions() = ["6", "8", "10", "11", "lts"];

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
};

local CoreUnit(version) = [
  {
    name: "unit tests node:" + version,
    image: "node:" + version,
    environment: {
      BITGOJS_TEST_PASSWORD: { from_secret: "password" },
    },
    commands: [
      "yarn run lerna-run --scope bitgo --stream unit-test",
    ],
  },
  UploadCoverage(version, "unit tests", "unit", false),
];

local CoreIntegration(version, limit_branches=true) = [
  {
    name: "integration tests node:" + version,
    image: "node:" + version,
    environment: {
      BITGOJS_TEST_PASSWORD: { from_secret: "password" },
    },
    commands: [
      "yarn run lerna-run --scope bitgo --stream integration-test",
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
    },
  ],
};

local Core(version) = {
  kind: "pipeline",
  name: "@bitgo/core node:" + version,
  steps: [
    Install(version),
  ] +
  if version == "lts" then
    CoreIntegration("lts")
  else
    CoreUnit(version),
  [if version == "lts" then "when"]: branches(),
};

[
  AuditAll(),
  LintAll(),
  MeasureSizeAndTiming(),
] + std.flattenArrays([[
    Core(version)
  ] for version in NodeVersions()]
)

