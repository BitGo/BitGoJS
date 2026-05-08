const { execSync, execFileSync } = require("child_process");
const fs = require("fs");
const tmp = require("tmp");

const ref = process.argv[2] || "HEAD";

const newTags = execFileSync("git", ["tag", "--points-at", ref])
  .toString()
  .trim()
  .split("\n")
  .filter(Boolean);

const summary = newTags.map((tag) => {
  const atIndex = tag.lastIndexOf("@");
  const packageName = tag.slice(0, atIndex);
  const currentVersion = tag.slice(atIndex + 1);

  const previousTags = execSync(
    `git tag --sort=-version:refname -l "${packageName}@*"`
  )
    .toString()
    .trim()
    .split("\n")
    .filter(Boolean);

  const previousTag = previousTags.find((t) => t !== tag);
  const previousVersion = previousTag
    ? previousTag.slice(previousTag.lastIndexOf("@") + 1)
    : null;

  return { package: packageName, previousVersion, currentVersion };
});

const jsonContent = JSON.stringify(summary, null, 2);
const textContent = summary
  .map((entry) => {
    const prev = entry.previousVersion || "new";
    return `${entry.package}: ${prev} -> ${entry.currentVersion}`;
  })
  .join("\n");

console.log(textContent);

const jsonTmp = tmp.fileSync({ prefix: "version-bump-summary-", postfix: ".json" });
fs.writeFileSync(jsonTmp.name, jsonContent + "\n");

const txtTmp = tmp.fileSync({ prefix: "version-bump-summary-", postfix: ".txt" });
fs.writeFileSync(txtTmp.name, textContent + "\n");

const ghOutput = process.env.GITHUB_OUTPUT;
if (ghOutput) {
  fs.appendFileSync(ghOutput, `json-file=${jsonTmp.name}\n`);
  fs.appendFileSync(ghOutput, `text-file=${txtTmp.name}\n`);
}
