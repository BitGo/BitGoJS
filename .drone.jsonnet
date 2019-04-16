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
  ],
  [if limit_branches then "when"]: branches(),
};

local Install(version, limit_branches=false) = {
  name: "install",
  image: "node:" + version,
  commands: [
    "npm install --unsafe-perm",
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
    "node_modules/.bin/nyc report --reporter=text-lcov > coverage.lcov",
    "codecov -f coverage.lcov -t \"$CODECOV_TOKEN\" -F " + tag,
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
      environment: {
        BITGOJS_TEST_PASSWORD: { from_secret: "password" },
      },
      commands: [
        "npm run test-node",
      ],
    },
    UploadCoverage(version, "unit"),
  ],
};

local IntegrationTest(version, limit_branches=true) = {
  kind: "pipeline",
  name: "integration tests (node:" + version + ")",
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
        "npx nyc -- node_modules/.bin/mocha -r ts-node/register --timeout 20000 --reporter list --exit 'test/v2/integration/**/*.ts'",
      ],
      [if limit_branches then "when"]: branches(),
    },
    UploadCoverage(version, "integration", limit_branches),
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
          "npx eslint 'src/**/*.ts'",
          "npx eslint 'test/**/*.ts' || true"
        ],
      },
    ],
  },
  UnitTest("6"),
  UnitTest("8"),
  UnitTest("9"),
  UnitTest("10"),
  UnitTest("11"),
  IntegrationTest("10"),
  MeasureSizeAndTiming("lts"),
]

