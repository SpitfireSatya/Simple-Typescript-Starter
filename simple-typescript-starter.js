(function() {

  'use strict';

  const funkyLogger = require('./funky-logger');
  const fs = require('fs');
  const unzipper = require('unzipper');
  const etl = require('etl');
  const path = require('path');
  const util = require('util');
  const rimraf = util.promisify(require('rimraf'));
  const spawn = require('child_process').spawn;

  const pathToArchive = path.resolve(__dirname, 'typescript-starter.zip');
  let projectDir = '';

  function spawnProcess(cmd, args, options) {
    return new Promise((resolve, reject) => {
      const options = { cwd: projectDir, shell: true };

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
    console.log(funkyLogger.color('red', 'Removing project files..'));
    await rimraf(projectDir);
    console.log(funkyLogger.color('red', 'Project clean-up complete'));
  }

  function createIntermediateDirs() {
    return Promise.all([
      fs.promises.mkdir(path.resolve(projectDir, 'scripts')),
      fs.promises.mkdir(path.resolve(projectDir, 'src')),
      fs.promises.mkdir(path.resolve(projectDir, 'reports')),
      fs.promises.mkdir(path.resolve(projectDir, 'documentation'))
    ]);
  }

  async function extractContents(projectName, author) {
    projectDir = path.resolve(process.cwd(), projectName);
    if(fs.existsSync(projectDir)) {
      console.log(funkyLogger.color('red', `\nFolder ${projectName} already exists! \nPlease delete the existing folder or use another name.`));
      process.exit(1);
    }
    await fs.promises.mkdir(projectDir);
    await createIntermediateDirs(projectDir);
    await fs.createReadStream(pathToArchive)
      .pipe(unzipper.Parse())
      .pipe(etl.map(async entry => {
        if(entry.type === 'File') {
          console.log(funkyLogger.color('magenta', 'Writing file: '), funkyLogger.color('cyan', entry.path));
          let content = await entry.buffer();
          content = content.toString().replace(/{projectName}/g, projectName);
          content = content.toString().replace(/{author}/g, author);
          await fs.promises.writeFile(path.resolve(projectDir, entry.path), content);
          console.log(funkyLogger.color('magenta', 'File write complete: '), funkyLogger.color('green', entry.path));
        }
      }))
      .promise()
      .catch(async e => {
        console.log(funkyLogger.color('red', 'Error extracting source: ' + e.message));
        await cleanup();
        process.exit(1);
      });

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
  }

  async function runSanityCheck() {
    console.log(funkyLogger.color('cyan', '\nRunning Sanity checks to ensure set-up was successful...'));
    console.log(funkyLogger.color('cyan', '\nThis may take some time. Please be patient.'));

    await Promise.all([
      spawnProcess('npm', ['run', 'start']),
      spawnProcess('npm', ['run', 'test']),
      spawnProcess('npm', ['run', 'karma']),
      spawnProcess('npm', ['run', 'lint']),
      spawnProcess('npm', ['run', 'jscpd']),
      spawnProcess('npm', ['run', 'docs'])
    ]).catch(async e => {
      console.log(funkyLogger.color('red', 'Error in sanity checks: ' + e.message));
      await cleanup();
      process.exit(1);
    });

    console.log(funkyLogger.color('green', '\nAll Sanity Checks Completed!'));
  }

  module.exports = {
    extractContents,
    installNodeModules,
    runSanityCheck
  };

}());