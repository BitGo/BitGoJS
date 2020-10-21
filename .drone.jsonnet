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
    "yarn install" + (if (version == "6" || version == "8") then " --ignore-engines" else ""),
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

local WithExtraAptPackages(step, packages) = step + {
  commands: [
    "apt-get update",
    "apt-get install -y " + std.join(" ", packages),
  ] + super.commands,
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

local LernaPublish(version) =  {
  name: "lerna publish",
  image: "node:" + version,
  environment: {
    NPM_CONFIG_TOKEN: { from_secret: "npm_config_token" },
  },
  commands: [
    "npm config set unsafe-perm true",
    "yarn run internal-publish",
  ],
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
    CODECOV_FLAG: tag,
    reports_s3_akid: { from_secret: "reports_s3_akid" },
    reports_s3_sak: { from_secret: "reports_s3_sak" },
  },
  commands: [
    "yarn run artifacts",
    "yarn run gen-coverage" + (if only_changed then "-changed" else ""),
    "yarn run coverage",
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

local BrowserTestAptPackages = [
  "gconf-service",
  "libasound2",
  "libatk1.0-0",
  "libatk-bridge2.0-0",
  "libc6",
  "libcairo2",
  "libcups2",
  "libdbus-1-3",
  "libexpat1",
  "libfontconfig1",
  "libgcc1",
  "libgconf-2-4",
  "libgdk-pixbuf2.0-0",
  "libglib2.0-0",
  "libgtk-3-0",
  "libnspr4",
  "libpango-1.0-0",
  "libpangocairo-1.0-0",
  "libstdc++6",
  "libx11-6",
  "libx11-xcb1",
  "libxcb1",
  "libxcomposite1",
  "libxcursor1",
  "libxdamage1",
  "libxext6",
  "libxfixes3",
  "libxi6",
  "libxrandr2",
  "libxrender1",
  "libxss1",
  "libxtst6",
  "ca-certificates",
  "fonts-liberation",
  "libappindicator1",
  "libnss3",
  "lsb-release",
  "xdg-utils",
  "wget",
];

local BrowserTest(version) = {
  kind: "pipeline",
  name: "Browser Tests",
  steps: [
    BuildInfo(version),
    Install(version),
    WithExtraAptPackages(CommandWithSecrets("browser-tests", version), BrowserTestAptPackages),
    UploadArtifacts(version, "unit", true),
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
    Command("check-commits", version),
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
  UnitTest(version)
  for version in UnitVersions
# BG-23925 - reenable integration tests when testnet is stable
# ] + [
#  IncludeBranches(IntegrationTest(version))
#  for version in IntegrationVersions
] + [
  IncludeBranches(BrowserTest("10"))
]

