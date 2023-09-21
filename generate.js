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

  function Generate(config) {

    const self = this;

    self.pathToArchive = config.pathToArchive;
    self.projectPath = config.projectPath;
    self.projectName = config.projectName;
    self.author = config.author;

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
        console.log(funkyLogger.color('red', 'Removing project files..'));
        await rimraf(self.projectPath);
        console.log(funkyLogger.color('red', 'Project clean-up complete'));
      } catch (e) {
        console.log(funkyLogger.color('red', 'Error removing project: ', e));
      }
    }

    function createIntermediateDirs() {
      return Promise.all([
        fs.promises.mkdir(path.resolve(self.projectPath, 'scripts')),
        fs.promises.mkdir(path.resolve(self.projectPath, 'src')),
        fs.promises.mkdir(path.resolve(self.projectPath, 'reports')),
        fs.promises.mkdir(path.resolve(self.projectPath, 'documentation'))
      ]);
    }

    async function extractContents() {
      self.projectPath = path.resolve(process.cwd(), self.projectName);
      if (fs.existsSync(self.projectPath)) {
        console.log(funkyLogger.color('red', `\nFolder ${self.projectName} already exists! \nPlease delete the existing folder or use another name.`));
        process.exit(1);
      }
      await fs.promises.mkdir(self.projectPath);
      await createIntermediateDirs(self.projectPath);
      await fs.createReadStream(self.pathToArchive)
        .pipe(unzipper.Parse())
        .pipe(etl.map(async entry => {
          if (entry.type === 'File') {
            console.log(funkyLogger.color('magenta', 'Writing file: '), funkyLogger.color('cyan', entry.path));
            let content = await entry.buffer();
            content = content.toString().replace(/{projectName}/g, self.projectName);
            content = content.toString().replace(/{author}/g, self.author);
            await fs.promises.writeFile(path.resolve(self.projectPath, entry.path), content);
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

    this.extractContents = extractContents;
    this.installNodeModules = installNodeModules;
    this.runSanityCheck = runSanityCheck;

  }

  module.exports = Generate;

}());