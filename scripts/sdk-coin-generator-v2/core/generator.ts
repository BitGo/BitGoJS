import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as p from '@clack/prompts';
import type { CoinConfig, TemplateData, PluginContext } from './types';
import { PluginRegistry } from '../plugins';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

/**
 * Core generator class that orchestrates module generation using plugins
 */
export class Generator {
  private registry: PluginRegistry;
  private contextRoot: string;

  constructor(registry: PluginRegistry, contextRoot?: string) {
    this.registry = registry;
    this.contextRoot = contextRoot || path.join(__dirname, '..', '..', '..');
  }

  /**
   * Generate a new SDK coin module
   */
  async generate(config: CoinConfig): Promise<void> {
    // Get the plugin for this chain type
    const plugin = this.registry.getRequired(config.chainType);

    // Validate configuration with core validation
    this.validateConfig(config);

    // Validate with plugin-specific validation
    const pluginValidation = plugin.validate(config);
    if (!pluginValidation.valid) {
      throw new Error(`Configuration validation failed: ${pluginValidation.errors?.join(', ')}`);
    }

    // Show warnings if any
    if (pluginValidation.warnings && pluginValidation.warnings.length > 0) {
      pluginValidation.warnings.forEach((warning) => p.log.warn(warning));
    }

    // Get template directory from plugin
    const templateDir = plugin.getTemplateDir();
    const templateRoot = path.join(__dirname, '..', 'templates', templateDir);
    const destRoot = path.join(this.contextRoot, 'modules', `sdk-coin-${config.symbol}`);

    const context: PluginContext = {
      contextRoot: this.contextRoot,
      templateRoot,
      destRoot,
    };

    // Prepare template data
    const data = this.prepareTemplateData(config);

    const s = p.spinner();
    s.start('Generating module files...');

    // Create directory structure
    await this.createDirectoryStructure(destRoot);

    let fileCount = 0;
    const files: string[] = [];

    // Generate package.json
    await this.generatePackageJson(config, plugin, destRoot);
    fileCount++;
    files.push('package.json');

    // Copy template files
    const copiedFiles = await this.copyTemplateFiles(templateRoot, destRoot, data, config);
    fileCount += copiedFiles.length;
    files.push(...copiedFiles);

    // Generate token class if requested
    if (config.withTokenSupport) {
      const tokenFile = await this.generateTokenClass(templateRoot, destRoot, data, config);
      if (tokenFile) {
        fileCount++;
        files.push(tokenFile);
      }
    }

    // Call plugin's post-generation hook if available
    if (plugin.postGenerate) {
      await plugin.postGenerate(context, config);
    }

    s.stop('Module files generated');

    // Display success message
    this.displaySuccessMessage(config, fileCount, files);
  }

  /**
   * Validate core configuration
   */
  private validateConfig(config: CoinConfig): void {
    // Prevent path traversal attacks
    if (config.symbol.includes('..') || config.symbol.includes('/') || config.symbol.includes('\\')) {
      throw new Error('Symbol cannot contain path traversal characters');
    }
    if (config.testnetSymbol.includes('..') || config.testnetSymbol.includes('/') || config.testnetSymbol.includes('\\')) {
      throw new Error('Testnet symbol cannot contain path traversal characters');
    }

    // Validate symbol format (already validated in prompts, but double-check for security)
    if (!/^[a-z][a-z0-9]*$/.test(config.symbol)) {
      throw new Error('Symbol must be lowercase alphanumeric and start with a letter');
    }
    if (!/^[a-z][a-z0-9]*$/.test(config.testnetSymbol)) {
      throw new Error('Testnet symbol must be lowercase alphanumeric and start with a letter');
    }

    // Check if module already exists
    const destRoot = path.join(this.contextRoot, 'modules', `sdk-coin-${config.symbol}`);
    if (fs.existsSync(destRoot)) {
      throw new Error(`Module sdk-coin-${config.symbol} already exists!`);
    }

    // Validate chain type exists
    if (!this.registry.has(config.chainType)) {
      throw new Error(
        `Unknown chain type: ${config.chainType}. Available types: ${this.registry.getPluginIds().join(', ')}`
      );
    }
  }

  /**
   * Prepare template data from config
   */
  private prepareTemplateData(config: CoinConfig): TemplateData {
    return {
      coin: config.coinName,
      coinLowerCase: config.coinName.toLowerCase(),
      symbol: config.symbol,
      testnetSymbol: config.testnetSymbol,
      constructor: this.toPascalCase(config.symbol),
      testnetConstructor: this.toPascalCase(config.testnetSymbol),
      baseFactor: config.baseFactor,
      keyCurve: config.keyCurve,
      supportsTss: config.supportsTss,
      mpcAlgorithm: config.mpcAlgorithm || 'eddsa',
      withTokenSupport: config.withTokenSupport,
    };
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Render a template with data
   */
  private renderTemplate(template: string, data: TemplateData): string {
    let rendered = template;

    Object.entries(data).forEach(([key, value]) => {
      // Escape regex special characters to prevent RegExp injection
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`<%=\\s*${escapedKey}\\s*%>`, 'g');
      rendered = rendered.replace(regex, String(value));
    });

    return rendered;
  }

  /**
   * Create directory structure
   */
  private async createDirectoryStructure(destRoot: string): Promise<void> {
    await mkdir(destRoot, { recursive: true });
    await mkdir(path.join(destRoot, 'src', 'lib'), { recursive: true });
    await mkdir(path.join(destRoot, 'test', 'unit'), { recursive: true });
    await mkdir(path.join(destRoot, 'test', 'integration'), { recursive: true });
  }

  /**
   * Generate package.json
   */
  private async generatePackageJson(
    config: CoinConfig,
    plugin: ReturnType<PluginRegistry['getRequired']>,
    destRoot: string
  ): Promise<string> {
    const { dependencies, devDependencies } = await plugin.getDependencies(config, this.contextRoot);

    const packageJson = {
      name: `@bitgo/sdk-coin-${config.symbol}`,
      version: '1.0.0',
      description: `BitGo SDK coin library for ${config.coinName}`,
      main: './dist/src/index.js',
      types: './dist/src/index.d.ts',
      scripts: {
        build: 'yarn tsc --build --incremental --verbose .',
        fmt: 'prettier --write .',
        'check-fmt': "prettier --check '**/*.{ts,js,json}'",
        clean: 'rm -r ./dist',
        lint: 'eslint --quiet .',
        prepare: 'npm run build',
        test: 'npm run coverage',
        coverage: 'nyc -- npm run unit-test',
        'unit-test': 'mocha',
      },
      author: 'BitGo SDK Team <sdkteam@bitgo.com>',
      license: 'MIT',
      engines: {
        node: '>=20 <23',
      },
      repository: {
        type: 'git',
        url: 'https://github.com/BitGo/BitGoJS.git',
        directory: `modules/sdk-coin-${config.symbol}`,
      },
      'lint-staged': {
        '*.{js,ts}': ['yarn prettier --write', 'yarn eslint --fix'],
      },
      publishConfig: {
        access: 'public',
      },
      nyc: {
        extension: ['.ts'],
      },
      dependencies,
      devDependencies,
      files: ['dist'],
    };

    const packagePath = path.join(destRoot, 'package.json');
    await writeFile(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
    return packagePath;
  }

  /**
   * Copy template files
   *
   * Template files with EJS tags use .ejs extension (e.g., coin.ts.ejs)
   * to prevent CodeQL, ESLint, and Prettier from analyzing them as TypeScript.
   * The generated files will have the proper extension (e.g., .ts, .md).
   */
  private async copyTemplateFiles(
    templateRoot: string,
    destRoot: string,
    data: TemplateData,
    config: CoinConfig
  ): Promise<string[]> {
    const files: string[] = [];

    const templateFiles = [
      { src: '.tsconfig.json', dest: 'tsconfig.json' },
      { src: 'README.md.ejs', dest: 'README.md' },
      { src: '.eslintignore', dest: '.eslintignore' },
      { src: '.gitignore', dest: '.gitignore' },
      { src: '.mocharc.yml', dest: '.mocharc.yml' },
      { src: '.npmignore', dest: '.npmignore' },
      { src: '.prettierignore', dest: '.prettierignore' },
      { src: '.prettierrc.yml', dest: '.prettierrc.yml' },
      { src: 'src/index.ts.ejs', dest: 'src/index.ts' },
      { src: 'src/coin.ts.ejs', dest: `src/${config.symbol}.ts` },
      { src: 'src/testnet.ts.ejs', dest: `src/${config.testnetSymbol}.ts` },
      { src: 'src/register.ts.ejs', dest: 'src/register.ts' },
      { src: 'src/lib/index.ts', dest: 'src/lib/index.ts' },
      { src: 'src/lib/keyPair.ts.ejs', dest: 'src/lib/keyPair.ts' },
      { src: 'src/lib/utils.ts.ejs', dest: 'src/lib/utils.ts' },
      { src: 'src/lib/constants.ts.ejs', dest: 'src/lib/constants.ts' },
      { src: 'src/lib/iface.ts.ejs', dest: 'src/lib/iface.ts' },
      { src: 'test/unit/index.ts.ejs', dest: 'test/unit/index.ts' },
      { src: 'test/unit/keyPair.ts.ejs', dest: 'test/unit/keyPair.ts' },
      { src: 'test/unit/utils.ts.ejs', dest: 'test/unit/utils.ts' },
      { src: 'test/integration/index.ts.ejs', dest: 'test/integration/index.ts' },
    ];

    for (const file of templateFiles) {
      const templatePath = path.join(templateRoot, file.src);
      const destPath = path.join(destRoot, file.dest);

      if (fs.existsSync(templatePath)) {
        await this.copyTemplate(templatePath, destPath, data);
        files.push(file.dest);
      }
    }

    return files;
  }

  /**
   * Copy a single template file
   */
  private async copyTemplate(templatePath: string, destPath: string, data: TemplateData): Promise<void> {
    const template = await readFile(templatePath, 'utf-8');
    const rendered = this.renderTemplate(template, data);
    await writeFile(destPath, rendered, 'utf-8');
  }

  /**
   * Generate token class if requested
   */
  private async generateTokenClass(
    templateRoot: string,
    destRoot: string,
    data: TemplateData,
    config: CoinConfig
  ): Promise<string | null> {
    // Try .ejs extension first, then fallback to .ts for backward compatibility
    let tokenTemplatePath = path.join(templateRoot, 'src/token.ts.ejs');
    if (!fs.existsSync(tokenTemplatePath)) {
      tokenTemplatePath = path.join(templateRoot, 'src/token.ts');
    }

    const tokenDestPath = path.join(destRoot, 'src', `${config.symbol}Token.ts`);

    if (fs.existsSync(tokenTemplatePath)) {
      await this.copyTemplate(tokenTemplatePath, tokenDestPath, data);
      return `src/${config.symbol}Token.ts`;
    }

    return null;
  }

  /**
   * Display success message
   */
  private displaySuccessMessage(config: CoinConfig, fileCount: number, files: string[]): void {
    p.note(
      `📁 Location: modules/sdk-coin-${config.symbol}\n\n` +
        `Generated ${fileCount} files:\n` +
        files
          .slice(0, 10)
          .map((f) => `  • ${f}`)
          .join('\n') +
        (files.length > 10 ? `\n  ... and ${files.length - 10} more` : ''),
      '✅ Module created successfully'
    );

    const nextSteps = [
      'Review generated files',
      'Add coin to statics configuration',
      'Register coin in BitGo module',
      'Update root tsconfig.packages.json',
      `cd modules/sdk-coin-${config.symbol} && yarn install && yarn build`,
      'Run tests: yarn test',
    ];

    p.note(
      nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n'),
      '📋 Next steps'
    );
  }
}
