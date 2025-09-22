import { LernaModule, readModulePackageJson } from './lernaModules';

/**
 * Validates that package json files have the correct scope and preid in their versions
 * and names
 * @param lernaModules
 * @param preid
 * @param scope
 */
export function validateReleaseTransformations(lernaModules: LernaModule[], preid: string, scope: string): void {
  lernaModules
    .filter((m) => !m.private)
    .forEach((m) => {
      const packageJSON = readModulePackageJson(m);
      if (packageJSON.name === 'bitgo' && scope !== '@bitgo') {
        throw new Error(`Module ${packageJSON.name} should have been renamed to ${scope}/bitgo`);
      }
      if (packageJSON.name !== 'bitgo' && !packageJSON.name?.startsWith(scope)) {
        throw new Error(`Module ${packageJSON.name} does not have the correct scope ${scope}`);
      }
      if (preid !== 'latest' && !packageJSON.version?.includes(preid)) {
        throw new Error(
          `Module ${packageJSON.name} does not have the correct preid ${preid} in version ${packageJSON.version}`
        );
      }
    });
  console.log(`Successfully validated module scopes and versions for ${lernaModules.length} modules.`);
}
