export function setDependencyVersion(
  packageJson: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  },
  dependencyName: string,
  version: string
): void {
  if (packageJson.dependencies && packageJson.dependencies[dependencyName]) {
    packageJson.dependencies[dependencyName] = version;
  }
  if (packageJson.devDependencies && packageJson.devDependencies[dependencyName]) {
    packageJson.devDependencies[dependencyName] = version;
  }
  // FIXME: also update the peerDependencies, buildDependencies, etc.
}
