local branches() = [
  "master",
  "rel/*",
  "prod/production",
];

local BuildInfo(version) = {
  name: "build information",
  image: "node:" + version,
  commands: [
    "node --version",
    "npm --version",
    "yarn --version",
    "git --version",
  ],
};

local Install(version) = {
  name: "install",
  image: "node:" + version,
  commands: [
    "git fetch origin +refs/heads/$DRONE_REPO_BRANCH:$DRONE_REPO_BRANCH || true",
    "yarn install" + (if version == "6" then " --ignore-engines" else ""),
  ],
};

local Command(command, version="lts") = {
  name: command,
  image: "node:" + version,
  commands: [
    "yarn run " + command,
  ],
};

local CommandWithSecrets(command, version) =
  Command(command, version) + {
  environment: {
    BITGOJS_TEST_PASSWORD: { from_secret: "password" },
  },
};

local LernaCommand(command, version="lts", with_secrets=false) = {
  kind: "pipeline",
  name: command + " (node:" + version + ")",
  steps: [
    BuildInfo(version),
    Install(version),
  ] + (
    if with_secrets then [
      CommandWithSecrets(command, version)
    ] else [
      Command(command, version)
    ]
  ),
};

local IncludeBranches(pipeline, included_branches=branches()) = pipeline + {
  trigger: {
    branch: {
      include: included_branches,
    },
  },
};

local ExcludeBranches(pipeline, excluded_branches=branches()) = pipeline + {
  trigger: {
    branch: {
      exclude: excluded_branches
    },
  },
};

local UploadCoverage(version, tag="untagged") = {
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
};

local UnitTest(version) = {
  kind: "pipeline",
  name: "unit tests (node:" + version + ")",
  steps: [
    BuildInfo(version),
    Install(version),
    CommandWithSecrets("unit-test-changed", version),
    UploadCoverage(version, "unit"),
  ],
  trigger: {
    branch: {
      exclude: branches(),
    },
  },
};

local IntegrationTest(version) = {
  kind: "pipeline",
  name: "integration tests (node:" + version + ")",
  steps: [
    BuildInfo(version),
    Install(version),
    CommandWithSecrets("integration-test", version),
    UploadCoverage(version, "integration"),
  ],
};

local MeasureSizeAndTiming(version) = {
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
    },
  ],
};

local UnitVersions = ["6", "8", "10", "11"];
local IntegrationVersions = ["lts"];

[
  ExcludeBranches(LernaCommand("lint-changed")),
  IncludeBranches(LernaCommand("audit")),
  IncludeBranches(LernaCommand("lint")),
  IncludeBranches(MeasureSizeAndTiming("lts")),
] + [
  ExcludeBranches(UnitTest(version))
  for version in UnitVersions
] + [
  IncludeBranches(IntegrationTest(version))
  for version in IntegrationVersions
]
