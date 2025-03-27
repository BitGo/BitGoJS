import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFileSync } from 'child_process';
import * as tmp from 'tmp';

/**
 * Helper function to execute git commands and return output as string
 * @param args Git command arguments
 * @param cwd Working directory (optional)
 * @returns Command output as string
 */
export function execGitCapture(args: string[], cwd?: string): string {
  return execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024, // Increase buffer size to 100MB
    ...(cwd ? { cwd } : {}),
  });
}

/**
 * Helper function to execute git commands with stdio inherited (for visible output)
 * @param args Git command arguments
 * @param cwd Working directory (optional)
 */
export function execGit(args: string[], cwd?: string): void {
  execFileSync('git', args, {
    stdio: 'inherit',
    ...(cwd ? { cwd } : {}),
  });
}

/**
 * Creates a temporary directory for testing
 * @returns Path to the temporary directory
 */
export function createTempDir(): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bitgo-release-test-'));
  return tempDir;
}

/**
 * Creates a symlink for node_modules in the target directory
 * @param targetDir The directory to create the symlink in
 */
export function symlinkNodeModules(targetDir: string): void {
  // Get the current git repository directory
  const repoDir = execGitCapture(['rev-parse', '--show-toplevel']).trim();

  // Path to the source node_modules directory
  const sourceNodeModules = path.join(repoDir, 'node_modules');

  // Path where the symlink will be created
  const targetNodeModules = path.join(targetDir, 'node_modules');

  // Check if source node_modules exists
  if (fs.existsSync(sourceNodeModules)) {
    // Create symlink
    fs.symlinkSync(sourceNodeModules, targetNodeModules, 'junction');
    console.log(`Symlinked node_modules from ${sourceNodeModules} to ${targetNodeModules}`);
  } else {
    console.warn('Source node_modules directory not found, skipping symlink creation');
  }
}

/**
 * Creates a shallow clone of the git repository at a specific commit
 * or ensures an existing directory is at the right commit
 * @param commitHash The git commit hash to clone or checkout
 * @param tempDir The directory to clone into or update
 */
export function createShallowClone(commitHash: string, tempDir: string): void {
  // Get the current git repository directory
  const repoDir = execGitCapture(['rev-parse', '--show-toplevel']).trim();

  if (fs.existsSync(tempDir)) {
    console.log(`Directory ${tempDir} already exists, ensuring it's at commit ${commitHash}`);

    try {
      // Check if it's a git repository
      execGitCapture(['rev-parse', '--git-dir'], tempDir);

      // Fetch from the original repository to ensure we have the commit
      execGit(['fetch', repoDir], tempDir);

      // Force checkout to the specific commit
      execGit(['checkout', '-f', commitHash], tempDir);

      // Clean the working directory to remove any untracked files
      execGit(['clean', '-fdx'], tempDir);

      console.log(`Successfully updated existing directory to commit ${commitHash}`);
    } catch (error) {
      console.error(`Error updating existing directory: ${error}`);
      console.log('Removing directory and cloning fresh...');

      // If there was an error, remove the directory and clone fresh
      fs.rmSync(tempDir, { recursive: true, force: true });

      // Clone the repository
      execGit(['clone', '--local', repoDir, tempDir]);
      execGit(['checkout', commitHash], tempDir);
    }
  } else {
    // Directory doesn't exist, clone the repository
    console.log(`Cloning repository to ${tempDir} at commit ${commitHash}`);
    execGit(['clone', '--local', repoDir, tempDir]);
    execGit(['checkout', commitHash], tempDir);
  }

  // Create symlink for node_modules
  symlinkNodeModules(tempDir);
}

/**
 * Applies the prepare-release script on the cloned repository
 * @param clonedRepoDir The directory of the cloned repository
 * @param preid Optional prerelease identifier
 * @param scope Optional scope to use
 * @param distTagsCachePath Optional path to cache dist tags
 * @returns The stdout from the prepare-release script
 */
export function applyPrepareReleaseScript(
  clonedRepoDir: string,
  preid: string,
  scope = '@bitgo-beta',
  distTagsCachePath?: string
): string {
  const args: string[] = [];
  args.push(preid);
  args.push(`scope=${scope}`);

  // Get the current git repository directory
  const currentRepoDir = execGitCapture(['rev-parse', '--show-toplevel']).trim();

  // Use the script from the current repo, not the cloned one
  const scriptPath = path.join(currentRepoDir, 'scripts', 'prepare-release.ts');

  // Create environment with the cache path if provided
  const env: Record<string, string> = {
    ...process.env,
    // Set the root directory to the cloned repo directory
    BITGO_PREPARE_RELEASE_ROOT_DIR: clonedRepoDir,
  };

  if (distTagsCachePath) {
    env.BITGO_PREPARE_RELEASE_CACHE_DIST_TAGS = distTagsCachePath;
  }

  // Execute the prepare-release script with the repoDir as cwd
  return execFileSync('npx', ['ts-node', '--transpile-only', scriptPath, ...args], {
    encoding: 'utf8',
    stdio: 'inherit',
    cwd: clonedRepoDir,
    env, // Pass the environment variables
  });
}

/**
 * Generates a git diff of the changes made by the prepare-release script
 * @param repoDir The directory of the cloned repository
 * @param pathFilter Optional path to filter the diff
 * @returns The git diff as a string
 */
export function generateGitDiff(repoDir: string, pathFilter?: string): string {
  // Add all changes to git staging
  execGit(['add', '.'], repoDir);

  // Generate the diff, optionally filtering by path
  const diffArgs = ['diff', '--cached'];
  if (pathFilter) {
    diffArgs.push('--', pathFilter);
  }
  return execGitCapture(diffArgs, repoDir);
}

/**
 * Asserts that the generated diff matches the reference diff
 * @param generatedDiff The generated git diff
 * @param referenceDiffPath The path to the reference diff file
 * @throws AssertionError if the diffs don't match
 */
export function assertEqualDiffs(generatedDiff: string, referenceDiffPath: string): void {
  if (!fs.existsSync(referenceDiffPath)) {
    throw new Error(`Reference diff file does not exist: ${referenceDiffPath}`);
  }

  // Write the generated diff to a temporary file
  const tempFile = tmp.fileSync({ prefix: 'generated-diff-', postfix: '.diff' });
  fs.writeFileSync(tempFile.name, generatedDiff);

  try {
    // Run the diff command to compare the two files
    // The diff command returns exit code 0 if files are identical, 1 if different, >1 if error
    execFileSync('diff', ['-u', tempFile.name, referenceDiffPath], {
      stdio: 'inherit', // Show the diff output to the console
    });

    // If we get here, the diff command returned 0, meaning files are identical
    console.log('Generated diff matches reference diff');
  } catch (error) {
    // If diff command returns exit code 1, files are different
    if (error.status === 1) {
      throw new Error('Generated diff does not match reference diff');
    } else {
      // For other exit codes, there was an error running diff
      throw new Error(`Error comparing diffs: ${error.message}`);
    }
  } finally {
    // Clean up the temporary file
    try {
      tempFile.removeCallback();
    } catch (e) {
      console.warn(`Failed to remove temporary diff file: ${tempFile.name}`);
    }
  }
}

/**
 * Creates a reference diff file
 * @param diff The diff to save as reference
 * @param referenceDiffPath The path to save the reference diff to
 */
export function createReferenceDiff(diff: string, referenceDiffPath: string): void {
  const dirPath = path.dirname(referenceDiffPath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(referenceDiffPath, diff, { encoding: 'utf8' });
}

/**
 * Sets up a test environment, applies the prepare-release script, and compares or creates a reference diff
 * @param commitHash The git commit hash to test
 * @param referenceDiffPath The path to the reference diff file
 * @param options Optional configuration options
 * @returns Object with test results and cleanup function
 */
export function runTestAndCompare(
  commitHash: string,
  referenceDiffPath: string,
  options: {
    preid: string;
    scope?: string;
    tempDir?: string;
    pathFilter?: string;
    distTagsCachePath?: string;
  }
): void {
  // Use provided tempDir or create a new one
  const tempDir = options?.tempDir || createTempDir();
  // Get preid and scope from options with defaults
  const preid = options?.preid;
  const scope = options?.scope || '@bitgo-beta';
  // Get path filter
  const pathFilter = options?.pathFilter;
  // Get dist tags cache path
  const distTagsCachePath = options?.distTagsCachePath;

  // Clone the repository at the specific commit
  createShallowClone(commitHash, tempDir);

  // Apply the prepare-release script
  applyPrepareReleaseScript(tempDir, preid, scope, distTagsCachePath);

  // Generate a git diff, optionally filtered by path
  const generatedDiff = generateGitDiff(tempDir, pathFilter);

  // Check if reference diff exists
  const referenceExists = fs.existsSync(referenceDiffPath);

  // If reference doesn't exist, create it
  if (!referenceExists) {
    createReferenceDiff(generatedDiff, referenceDiffPath);
  }

  // Assert that the diffs match
  assertEqualDiffs(generatedDiff, referenceDiffPath);
}
