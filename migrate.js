(function () {

  'use strict';

  const funkyLogger = require('./funky-logger');
  const fs = require('fs');
  const unzipper = require('unzipper');
  const etl = require('etl');
  const path = require('path');
  const util = require('util');
  const rimraf = util.promisify(require('rimraf'));
  const spawn = require('child_process').spawn;
  const zipAFolder = require('zip-a-folder');

  function Migrate(config) {

    const self = this;

    self.pathToArchive = config.pathToArchive;
    self.projectPath = config.projectPath;
    self.packageJSON = null;
    const time = new Date().getTime();
    self.tempBackupPath = path.resolve(self.projectPath, '..', `sts_backup_${time}.zip`);
    self.backupPath = path.resolve(self.projectPath, `sts_backup_${time}.zip`);

    if (fs.existsSync(path.resolve(self.projectPath, 'package.json'))) {
      self.packageJSON = JSON.parse(fs.readFileSync(path.resolve(self.projectPath, 'package.json'), 'utf8'));
    } else {
      console.log(funkyLogger.color('red', 'Missing "package.json". Migration expects an existing npm project, Use `sts generate` if creating a new project'));
      process.exit(1);
    }

    self.projectName = self.packageJSON.name;
    self.projectAuthor = self.packageJSON.author;

    if (!(fs.existsSync(path.resolve(self.projectPath, 'src')) && fs.existsSync(path.resolve(self.projectPath, 'src', 'index.ts')))) {
      console.log(funkyLogger.color('red', 'Missing "src/index.ts". STS assumes "src/index.ts" as the entry point for the app. Migration failed.'));
    }

    function spawnProcess(cmd, args) {
      return new Promise((resolve, reject) => {
        const options = { cwd: self.projectPath, shell: true };

        const child = spawn(cmd, args, options);

        child.stdout.on('data', (data) => {
          console.log(data.toString());
        });

        child.stderr.on('data', (data) => {
          console.error(data.toString());
        });

        child.on('close', (code) => {
          code === 0 ? resolve() : reject();
        });

      });
    }

    async function cleanup() {
      try {
        fs.copyFileSync(self.backupPath, self.tempBackupPath);
        console.log(funkyLogger.color('red', 'Removing migration files..'));
        await rimraf(self.projectPath);
        console.log(funkyLogger.color('red', 'Migration files removed. Restoring backup'));

        await fs.promises.mkdir(self.projectPath);
        await createIntermediateDirs();
        await fs.createReadStream(self.tempBackupPath)
          .pipe(unzipper.Parse())
          .pipe(etl.map(async entry => {
            if (entry.type === 'File') {
              console.log(funkyLogger.color('magenta', 'Writing file: '), funkyLogger.color('cyan', entry.path));
              const filePath = path.resolve(self.projectPath, entry.path)
              let content = await entry.buffer();
              await fs.promises.writeFile(filePath, content);
              console.log(funkyLogger.color('magenta', 'File write complete: '), funkyLogger.color('green', entry.path));
            }
          }))
          .promise()
          .catch(async e => {
            console.log(funkyLogger.color('red', 'Error restoring backup: ' + e.message));
            process.exit(1);
          });
        await fs.rm(self.tempBackupPath, { recursive: true, force: true });
      } catch (e) {
        console.log(funkyLogger.color('red', 'Error in cleanup: ', e));
      }
    }

    function createIntermediateDirs() {
      return Promise.all([
        fs.promises.mkdir(path.resolve(self.projectPath, 'scripts')),
        fs.promises.mkdir(path.resolve(self.projectPath, 'reports')),
        fs.promises.mkdir(path.resolve(self.projectPath, 'documentation'))
      ]);
    }

    async function prepareForBackup() {
      try {
        const nodeModulesPath = path.resolve(self.projectPath, 'node_modules');
        if (fs.existsSync(nodeModulesPath))
          console.log(funkyLogger.color('cyan', 'Removing node_modules'));
        await rimraf(nodeModulesPath);
        console.log(funkyLogger.color('green', 'node_modules removed successfully'));
      } catch (e) {
        console.log(funkyLogger.color('red', 'Error removing node_modules', e));
      }
    }

    async function createBackup() {
      await zipAFolder.zip(self.projectPath, self.tempBackupPath);
      fs.copyFileSync(self.tempBackupPath, self.backupPath);
      fs.rmSync(self.tempBackupPath, { recursive: true, force: true });
      console.log(funkyLogger.color('green', 'New backup created'));
    }

    function prepareForMigration() {
      const fileList = fs.readdirSync(self.projectPath);
      return Promise.all(fileList
        .filter(fileName => fileName !== `sts_backup_${time}.zip`)
        .filter(fileName =>
          (fs.statSync(path.resolve(self.projectPath, fileName)).isDirectory() && ['scripts', 'reports', 'documentation'].includes(fileName)) ||
          (!fs.statSync(path.resolve(self.projectPath, fileName)).isDirectory() && !['.gitignore', 'README.md'].includes(fileName)))
        .map(fileName => fs.promises.rm(path.resolve(self.projectPath, fileName), { recursive: true, force: true })));
    }

    async function extractContents() {
      await createIntermediateDirs();
      await fs.createReadStream(self.pathToArchive)
        .pipe(unzipper.Parse())
        .pipe(etl.map(async entry => {
          if (entry.type === 'File') {
            console.log(funkyLogger.color('magenta', 'Writing file: '), funkyLogger.color('cyan', entry.path));

            let filePath = path.resolve(self.projectPath, entry.path)
            let content = (await entry.buffer()).toString();

            // main, entry, scripts, devDependencies
            if (entry.path === 'package.json') {
              const stsPackageJSON = JSON.parse(content);
              self.packageJSON.main = stsPackageJSON.main;
              self.packageJSON.entry = stsPackageJSON.entry;
              self.packageJSON.scripts = stsPackageJSON.scripts;
              self.packageJSON.devDependencies = Object.assign(self.packageJSON.devDependencies, stsPackageJSON.devDependencies);
              if(self.packageJSON.devDependencies && self.packageJSON.devDependencies.npm) {
                delete self.packageJSON.devDependencies.npm
              }
              if(self.packageJSON.dependencies && self.packageJSON.dependencies.npm) {
                delete self.packageJSON.dependencies.npm
              }
              content = JSON.stringify(self.packageJSON);
            }

            if (['.gitignore'].includes(entry.path)) {
              if (fs.existsSync(filePath)) {
                const ignoredPaths = new Set();
                fs.readFileSync(filePath, 'utf8').split('\n').forEach(line => ignoredPaths.add(line));
                content.split('\n').forEach(line => ignoredPaths.add(line));
                content = Array.from(ignoredPaths.values()).join('\n');
                fs.rmSync(filePath, { recursive: true, force: true });
              }
            }

            if (entry.path === 'README.md') {
              filePath = filePath.replace('README.md', 'README.new.md');
            }

            content = content.toString().replace(/{projectName}/g, self.projectName);
            content = content.toString().replace(/{author}/g, self.projectAuthor);

            await fs.promises.writeFile(filePath, content, 'utf8');
            console.log(funkyLogger.color('magenta', 'File write complete: '), funkyLogger.color('green', entry.path));
          }
        }))
        .promise()
        .catch(async e => {
          console.log(funkyLogger.color('red', 'Error extracting source: ' + e.message));
          await cleanup();
          process.exit(1);
        });

      return self;
    }

    async function installNodeModules() {

      console.log(funkyLogger.color('cyan', '\nInstalling node modules...'));
      console.log(funkyLogger.color('cyan', '\nThis may take some time. Please be patient.'));
      await spawnProcess('npm', ['install'])
        .catch(async e => {
          console.log(funkyLogger.color('red', 'Error installing node modules: ' + e.message));
          await cleanup();
          process.exit(1);
        });
      console.log(funkyLogger.color('green', '\nNode Modules Installed!'));

      return self;
    }

    async function runSanityCheck() {
      console.log(funkyLogger.color('cyan', '\nRunning Sanity checks to ensure set-up was successful...'));
      console.log(funkyLogger.color('cyan', '\nThis may take some time. Please be patient.'));

      await Promise.all([
        spawnProcess('npm', ['run', 'build:debug']),
        spawnProcess('npm', ['run', 'build:analysis']),
        spawnProcess('npm', ['run', 'start']),
        spawnProcess('npm', ['run', 'test']),
        spawnProcess('npm', ['run', 'lint']),
        spawnProcess('npm', ['run', 'lint:fix']),
        spawnProcess('npm', ['run', 'jscpd']),
        spawnProcess('npm', ['run', 'docs']),
        spawnProcess('npm', ['run', 'zip'])
      ]).catch(async e => {
        console.log(funkyLogger.color('red', 'Error in sanity checks: ' + e));
        await cleanup();
        process.exit(1);
      });

      console.log(funkyLogger.color('green', '\nAll Sanity Checks Completed!'));

      return self;
    }

    this.prepareForBackup = prepareForBackup;
    this.createBackup = createBackup;
    this.prepareForMigration = prepareForMigration;
    this.extractContents = extractContents;
    this.installNodeModules = installNodeModules;
    this.runSanityCheck = runSanityCheck;

  }

  module.exports = Migrate;

}());