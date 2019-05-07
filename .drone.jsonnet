local branches() = {
  branch: [
    "master",
    "rel/*",
    "prod/production",
  ],
};

local BuildInfo(version, limit_branches=false) = {
  name: "build information",
  image: "node:" + version,
  commands: [
    "node --version",
    "npm --version",
    "yarn --version"
  ],
  [if limit_branches then "when"]: branches(),
};

local Install(version, limit_branches=false) = {
  name: "install",
  image: "node:" + version,
  commands: [
    "git fetch origin 'refs/tags/*:refs/tags/*'",
    "yarn install",
  ],
  [if limit_branches then "when"]: branches(),
};

local Command(command, version="lts", limit_branches=false) = {
  name: command,
  image: "node:" + version,
  commands: [
    "yarn run " + command,
  ],
  [if limit_branches then "when"]: branches(),
};

local CommandWithSecrets(command, version) =
  Command(command, version) + {
  environment: {
    BITGOJS_TEST_PASSWORD: { from_secret: "password" },
  },
};

local LernaCommand(command, version="lts", with_secrets=false) = {
  kind: "pipeline",
  name: command,
  steps: [
    BuildInfo(version),
    Install(version),
  ] + (
    if with_secrets then [
      CommandWithSecrets(command, version)
    ] else [
      Command(command, version)
    ]
  )
};

local UploadCoverage(version, tag="untagged", limit_branches=true) = {
  name: "upload coverage",
  image: "node:"  + version,
  environment: {
    CODECOV_TOKEN: { from_secret: "codecov" },
  },
  commands: [
    "npm install -g codecov",
    "yarn run gen-coverage",
    "yarn run coverage -F " + tag,
  ],
  [if limit_branches then "when"]: branches(),
};

local UnitTest(version) = {
  kind: "pipeline",
  name: "unit tests (node:" + version + ")",
  steps: [
    BuildInfo(version),
    Install(version),
    CommandWithSecrets("unit-test", version),
    UploadCoverage(version, "unit"),
  ],
};

local IntegrationTest(version) = {
  kind: "pipeline",
  name: "integration tests (node:" + version + ")",
  steps: [
    BuildInfo(version),
    Install(version),
    CommandWithSecrets("integration-test", version),
    UploadCoverage(version, "unit"),
  ],
  limit_branches: branches(),
};

local MeasureSizeAndTiming(version, limit_branches=false) = {
  kind: "pipeline",
  name: "size and timing (node:" + version + ")",
  steps: [
    {
      name: "slow-deps",
      image: "node:" + version,
      commands: [
        "npm install -g slow-deps",
        "slow-deps"
      ],
      [if limit_branches then "when"]: branches(),
    },
  ],
};

local UnitVersions = ["6", "8", "10", "11"];
local IntegrationVersions = ["lts"];

[
  LernaCommand("audit"),
  LernaCommand("lint"),
  MeasureSizeAndTiming("lts"),
] + [
  UnitTest(version)
  for version in UnitVersions
] + [
  IntegrationTest(version)
  for version in IntegrationVersions
]

