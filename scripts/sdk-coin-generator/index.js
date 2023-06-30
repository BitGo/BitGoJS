const Generator = require('yeoman-generator');
const fs = require('fs');

const UTXO_DEPENDENCIES = ['abstract-utxo', 'sdk-core', 'utxo-lib'];
const ACCOUNT_DEPENDENCIES = ['abstract-eth', 'sdk-core', 'statics'];
const SIMPLE_DEPENDENCIES = ['sdk-core'];

const DEV_DEPENDENCIES = ['sdk-api', 'sdk-test'];

require('yeoman-generator/lib/actions/install');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts, { customInstallTask: true });
    this.env.options.nodePackageManager = 'npm';
  }

  async prompting() {
    const answers = await this.prompt([
      {
        type: 'input',
        name: 'coin',
        message: 'What is the name of your coin? (e.g. Bitcoin) - Sentence Case',
        validate: function (input) {
          const done = this.async();
          if (!input) {
            done('Please provide the name of the coin.');
          }
          done(null, true);
        },
      },
      {
        type: 'input',
        name: 'symbol',
        message: 'What is the symbol of your coin? (e.g. btc) - Lowercase',
        validate: function (input) {
          const done = this.async();
          if (!input) {
            done('Please provide a symbol.');
          }
          done(null, true);
        },
      },
      {
        type: 'confirm',
        name: 'testnetConfirm',
        message: 'Would you like to add a testnet symbol?',
      },
      {
        type: 'input',
        name: 'testnetSymbol',
        message: 'What is the testnet symbol of your coin? (e.g. tbtc) - Lowercase',
        validate: function (input) {
          const done = this.async();
          if (!input) {
            done('Please provide a testnet symbol.');
          }
          done(null, true);
        },
        when: function (answers) {
          if (answers.testnetConfirm) {
            return true;
          }
        },
      },
      {
        type: 'input',
        name: 'baseFactor',
        message: 'What is the base factor? (e.g. 1e6)',
        validate: function (input) {
          const done = this.async();
          if (!input) {
            done('Please provide a base factor.');
          }
          done(null, true);
        },
      },
      {
        type: 'list',
        name: 'boilerplate',
        message: 'Which boilerplate would you like?',
        choices: [
          { name: 'Simple (default)', value: 'simple' },
          { name: 'Account', value: 'account' },
          { name: 'Utxo', value: 'utxo' },
        ],
      },
    ]);

    answers.coinLowerCase = answers.coin.toLowerCase();
    answers.symbol.toLowerCase();
    if (answers.testnetSymbol) {
      answers.testnetSymbol.toLowerCase();
    } else {
      answers.testnetSymbol = answers.symbol;
    }
    answers.coin = toSentenceCase(answers.coin);
    answers.constructor = toSentenceCase(answers.symbol);
    if (answers.testnetSymbol) {
      answers.testnetConstructor = toSentenceCase(answers.testnetSymbol);
    } else {
      answers.testnetConstructor = toSentenceCase(answers.constructor);
    }
    this.answers = { ...answers };
  }

  paths() {
    const destinationPath = `${this.contextRoot}/modules/sdk-coin-${this.answers.symbol}`;
    const templatePath = `${this.contextRoot}/scripts/sdk-coin-generator/template`;

    this.destinationRoot(destinationPath);
    this.sourceRoot(templatePath);
  }

  async writing() {
    this.fs.copyTpl(this.templatePath('./base'), this.destinationPath(), { ...this.answers });
    this.fs.copyTpl(this.templatePath('./base/.eslintignore'), this.destinationPath('.eslintignore'));
    this.fs.copyTpl(this.templatePath('./base/.gitignore'), this.destinationPath('.gitignore'));
    this.fs.copyTpl(this.templatePath('./base/.mocharc.yml'), this.destinationPath('.mocharc.yml'));
    this.fs.copyTpl(this.templatePath('./base/.npmignore'), this.destinationPath('.npmignore'));
    this.fs.copyTpl(this.templatePath('./base/.prettierignore'), this.destinationPath('.prettierignore'));
    this.fs.copyTpl(this.templatePath('./base/.prettierrc.yml'), this.destinationPath('.prettierrc.yml'));

    let templatePath = './boilerplates/simple';

    switch (this.answers.boilerplate) {
      case 'account':
        templatePath = './boilerplates/account';
        break;
      case 'utxo':
        templatePath = './boilerplates/utxo';
        break;
      default:
        templatePath = './boilerplates/simple';
        break;
    }

    this.fs.copyTpl(this.templatePath(templatePath), this.destinationPath('./src'), { ...this.answers });

    this.fs.copyTpl(
      this.templatePath(`${templatePath}/.mainnet.ts`),
      this.destinationPath(`./src/${this.answers.symbol}.ts`),
      { ...this.answers }
    );

    this.fs.copyTpl(this.templatePath(`${templatePath}/.tsconfig.json`), this.destinationPath(`./tsconfig.json`), {
      ...this.answers,
    });

    if (this.answers.testnetSymbol) {
      this.fs.copyTpl(
        this.templatePath(`${templatePath}/.testnet.ts`),
        this.destinationPath(`./src/${this.answers.testnetSymbol}.ts`),
        { ...this.answers }
      );
    }

    addNewCoinToTsConfig(this.contextRoot, this.answers);
    addNewCoinToBitgo(this.contextRoot, this.answers);
    addNewCoinToBitgoTsConfig(this.contextRoot, this.answers);

    switch (this.answers.boilerplate) {
      case 'utxo': {
        const dependencies = getDependencies(this.contextRoot, UTXO_DEPENDENCIES);
        await this.addDependencies(dependencies);
        break;
      }
      case 'account': {
        const dependencies = getDependencies(this.contextRoot, ACCOUNT_DEPENDENCIES);
        await this.addDependencies(dependencies);
        break;
      }
      default: {
        const dependencies = getDependencies(this.contextRoot, SIMPLE_DEPENDENCIES);
        await this.addDependencies(dependencies);
        break;
      }
    }

    const devDependencies = getDependencies(this.contextRoot, DEV_DEPENDENCIES);
    await this.addDevDependencies(devDependencies);
  }
};

function getDependencies(contextRoot, depArr) {
  const dependencies = {};
  depArr.forEach((dependency) => {
    const file = `${contextRoot}/modules/${dependency}/package.json`;
    const rawData = fs.readFileSync(file);
    const data = JSON.parse(rawData);
    dependencies[data.name] = `^${data.version}`;
  });
  return dependencies;
}

function addNewCoinToTsConfig(contextRoot, answers) {
  const file = `${contextRoot}/tsconfig.packages.json`;

  const rawData = fs.readFileSync(file);
  const data = JSON.parse(rawData);

  data.references.push({ path: `./modules/sdk-coin-${answers.symbol}` });
  data.references = data.references.filter(
    (value, index, self) => index === self.findIndex((t) => t.path === value.path)
  );
  data.references.sort((a, b) => (a.path > b.path ? 1 : -1));

  fs.writeFileSync(file, JSON.stringify(data, null, 2).concat('\n'));
}

function addNewCoinToBitgo(contextRoot, answers) {
  const file = `${contextRoot}/modules/bitgo/package.json`;

  const rawData = fs.readFileSync(file);
  const data = JSON.parse(rawData);

  data.dependencies[`@bitgo/sdk-coin-${answers.symbol}`] = '^1.0.0';

  const depArr = Object.entries(data.dependencies).sort((a, b) => (a[0] > b[0] ? 1 : -1));
  data.dependencies = depArr.reduce((acc, cur) => {
    acc[cur[0]] = cur[1];
    return acc;
  }, {});

  fs.writeFileSync(file, JSON.stringify(data, null, 2).concat('\n'));
}

function addNewCoinToBitgoTsConfig(contextRoot, answers) {
  const file = `${contextRoot}/modules/bitgo/tsconfig.json`;

  const rawData = fs.readFileSync(file);
  const data = JSON.parse(rawData);

  data.references.push({ path: `../sdk-coin-${answers.symbol}` });
  data.references = data.references.filter(
    (value, index, self) => index === self.findIndex((t) => t.path === value.path)
  );
  data.references.sort((a, b) => (a.path > b.path ? 1 : -1));

  fs.writeFileSync(file, JSON.stringify(data, null, 2).concat('\n'));
}

function toSentenceCase(theString) {
  const newString = theString.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, function (c) {
    return c.toUpperCase();
  });
  return newString;
}
