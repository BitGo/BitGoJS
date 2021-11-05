local branches() = {
  branch: [
    "master",
  ],
};

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
  ],
  [if limit_branches then "when"]: branches(),
};

local UnitTest(version) = {
  kind: "pipeline",
  name: "unit tests (node:" + version + ")",
  steps: [
    BuildInfo(version),
    Install(version),
    {
      name: "unit tests",
      image: "node:" + version,
      commands: [
        "npm run test",
      ],
    },
  ],
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

[
  {
    kind: "pipeline",
    name: "audit",
    steps: [
      BuildInfo("lts"),
      Install("lts"),
      {
        name: "audit",
        image: "node:lts",
        commands: [
          "npm audit",
        ],
      },
    ],
  },
  {
    kind: "pipeline",
    name: "lint",
    steps: [
      BuildInfo("lts"),
      Install("lts"),
      {
        name: "lint",
        image: "node:lts",
        commands: [
          "npm run lint",
        ],
      },
    ],
  },
  UnitTest("12"),
  UnitTest("14"),
  UnitTest("16"),
  MeasureSizeAndTiming("lts"),
]

