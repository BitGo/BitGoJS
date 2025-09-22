import { DistTags, getDistTagsForModules } from './distTags';
import { LernaModule, readModulePackageJson, setDependencyVersion, writeModulePackageJson } from './lernaModules';
import assert from 'node:assert';
import { inc, lt } from 'semver';
import simpleGit from 'simple-git';

/**
 * increment the version based on the preid.
 *
 * @param {String} preid - The prerelease identifier
 * @param {LernaModule[]} lernaModules - The modules to update
 * @param {String[]} uninitializedModules
 */
export async function incrementVersions(
  preid: string,
  lernaModules: LernaModule[],
  uninitializedModules: string[]
): Promise<void> {
  const distTags = await getDistTagsForModules(lernaModules, uninitializedModules, preid);
  console.log(`incrementing version for ${lernaModules.length} modules...`);
  for (const m of lernaModules) {
    try {
      // Dist tags are mapped to the renamed module (i.e. after changing scope)
      // so we need to fetch the name from the package.json
      const json = readModulePackageJson(m);
      await incrementVersionsForModuleLocation(preid, m, json, distTags.get(json.name), lernaModules);
    } catch (e) {
      // it's not necessarily a blocking error.
      // If we fail to increment the version, NPM will block a publishing if the version already exists
      // so we can just warn and move on
      console.warn(`Couldn't set next version for ${m.name} at ${m.location}`, e);
    }
  }
}

/**
 * Increment the version for a single module based on the preid.
 *
 * @param {String} preid - The prerelease identifier
 * @param {LernaModule} lernaModule - The module to update
 * @param packageJson
 * @param {DistTags|undefined} tags - The dist tags for the module
 * @param {LernaModule[]} allModules - All modules for dependency updates
 * @returns {String|undefined} - The new version if set, undefined otherwise
 */
async function incrementVersionsForModuleLocation(
  preid: string,
  lernaModule: LernaModule,
  packageJson: {
    name: string;
    version: string;
  },
  tags: DistTags | undefined,
  allModules: LernaModule[]
): Promise<string | undefined> {
  let prevTag: string | undefined = undefined;
  if (tags) {
    // FIXME: for the @bitgo-beta scope, the "latest" should technically be fetched from the @bitgo scope
    // as we never update the "latest" preid distag in the @bitgo-beta scope.
    // In the future we should consider using the beta preid in the @bitgo scope and use @bitgo-beta only
    // to test releases
    const latestWithoutDist = tags?.latest?.split('-')[0] ?? '0.0.0';
    if (tags[preid]) {
      if (preid === 'latest') {
        prevTag = latestWithoutDist;
      } else {
        const version = tags[preid].split('-');
        // If there has been a new latest release in this scope, use that as the base version
        prevTag = lt(version[0], latestWithoutDist) ? `${latestWithoutDist}-${preid}` : tags[preid];
      }
    } else {
      prevTag = preid !== 'latest' ? `${tags.latest}-${preid}` : 'v0.0.0';
    }
  }
  if (!prevTag) {
    console.warn(`No previous tag found for ${packageJson.name}, skipping version increment`);
    return undefined;
  }

  let next: string | null = null;
  if (preid === 'latest') {
    const incrementType = await getIncrementType(lernaModule);
    next = inc(prevTag, incrementType);
  } else {
    // FIXME: have beta and alpha releases use conventional commit to determine increment type
    next = inc(prevTag, 'prerelease', undefined, preid);
  }

  assert(typeof next === 'string', `Failed to increment version for ${packageJson.name} prevTag=${prevTag}`);
  console.log(`${packageJson.name.padEnd(50)}${prevTag.padEnd(22)}-> ${next.padEnd(22)}`);
  packageJson.version = next;
  writeModulePackageJson(lernaModule, packageJson);

  // since we're manually setting new versions, we must also reconcile all other lerna packages to use the 'next' version for this module
  allModules.forEach((otherModule) => {
    // skip it for the current version
    if (otherModule.location === lernaModule.location) {
      return;
    }

    // Use readModulePackageJson here instead of direct readFileSync
    const otherJson = readModulePackageJson(otherModule);

    // Check if this module depends on the one we're updating
    const otherJsonString = JSON.stringify(otherJson);
    if (otherJsonString.includes(packageJson.name)) {
      setDependencyVersion(otherJson, packageJson.name, next);
      writeModulePackageJson(otherModule, otherJson);
    }
  });

  return next;
}

/**
 * Get the increment type (major, minor, patch) based on conventional commits since the last tag for the module.
 * If no last git tag is found, then default to 'patch'.
 * @param lernaModule - original lerna module before modifications
 */
async function getIncrementType(lernaModule: LernaModule): Promise<'major' | 'minor' | 'patch'> {
  const git = simpleGit();
  const tags = await git.tags();
  const lastTag = tags.all.filter((tag) => tag.includes(lernaModule.name)).pop();
  if (!lastTag) return 'patch';

  // Dynamic import for ESM module
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const { CommitParser } = await import('conventional-commits-parser');
  const parser = new CommitParser();
  const gitLogSeparator = '---END---';
  const rawLog = await git.raw([
    'log',
    `${lastTag}..HEAD`,
    `--pretty=%B${gitLogSeparator}`,
    '--',
    lernaModule.location,
  ]);
  const commitMessages = rawLog
    .split(gitLogSeparator)
    .map((msg) => msg.trim())
    .filter((msg) => msg.length > 0);

  let increment: 'patch' | 'minor' | 'major' = 'patch';
  for (const commit of commitMessages) {
    const parsed = parser.parse(commit.trim());
    if (parsed.notes && parsed.notes.some((note: { title?: string }) => note.title === 'BREAKING CHANGE')) {
      increment = 'major';
      break;
    } else if (parsed.footer && parsed.footer.includes('BREAKING CHANGE:')) {
      increment = 'major';
      break;
    } else if (parsed.header && parsed.header.includes('!')) {
      increment = 'major';
      break;
    } else if (parsed.type === 'feat') {
      increment = 'minor';
    }
  }
  if (increment === 'major') {
    console.warn(`Breaking change for module ${lernaModule.name}, incrementing major version`);
  }
  return increment;
}
