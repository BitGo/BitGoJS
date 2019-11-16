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

local GenerateDocs(version) = {
  name: "generate docs",
  image: "bitgosdk/upload-tools:latest",
  commands: [
    "yarn run gen-docs",
  ],
  when: {
    status: ["success"],
    event: ["tag"],
  }
};

local UploadDocs(version) = {
  name: "upload docs",
  image: "bitgosdk/upload-tools:latest",
  environment: {
    reports_s3_akid: { from_secret: "reports_s3_akid" },
    reports_s3_sak: { from_secret: "reports_s3_sak" },
  },
  commands: [
    "yarn run upload-docs",
  ],
  when: {
    status: ["success"],
    event: ["tag"],
  }
};

local UploadArtifacts(version, tag="untagged", only_changed=false) = {
  name: "upload artifacts",
  image: "bitgosdk/upload-tools:latest",
  environment: {
    CODECOV_TOKEN: { from_secret: "codecov" },
    reports_s3_akid: { from_secret: "reports_s3_akid" },
    reports_s3_sak: { from_secret: "reports_s3_sak" },
  },
  commands: [
    "yarn run artifacts",
    "yarn run gen-coverage" + (if only_changed then "-changed" else ""),
    "yarn run coverage -F " + tag,
  ],
  when: {
    status: ["success", "failure"]
  }
};

local UnitTest(version) = {
  kind: "pipeline",
  name: "unit tests (node:" + version + ")",
  steps: [
    BuildInfo(version),
    Install(version),
    CommandWithSecrets("unit-test-changed", version),
    UploadArtifacts(version, "unit", true),
  ],
};

local IntegrationTest(version) = {
  kind: "pipeline",
  name: "integration tests (node:" + version + ")",
  steps: [
    BuildInfo(version),
    Install(version),
    CommandWithSecrets("integration-test", version),
    UploadArtifacts(version, "integration"),
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

local CheckPreconditions(version) = {
  kind: "pipeline",
  name: "check preconditions (node:" + version + ")",
  steps: [
    BuildInfo(version),
    Install(version),
    Command("audit", version),
    Command("lint", version),
    Command("check-fmt", version),
    GenerateDocs(version),
    UploadDocs(version),
  ]
};

local UnitVersions = ["8", "10"];
local IntegrationVersions = ["10"];

[
  CheckPreconditions("10"),
  IncludeBranches(MeasureSizeAndTiming("10")),
] + [
  ExcludeBranches(UnitTest(version))
  for version in UnitVersions
] + [
  IncludeBranches(IntegrationTest(version))
  for version in IntegrationVersions
]
