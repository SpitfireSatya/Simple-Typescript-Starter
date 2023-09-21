(function() {

  'use strict';
  const path = require('path');
  const funkyLogger = require('./funky-logger');
  const Help = require('./help');
  const Generate = require('./generate');
  const Migrate = require('./migrate');


  function printHelp() {
    new Help().printHelp();
    process.exit(0);
  }

  function printVersion() {
    new Help().printVersion();
    process.exit(0);
  }

  async function generate(config) {
    const gen = new Generate(config);
    await gen.extractContents();
    await gen.installNodeModules();
    await gen.runSanityCheck();

    console.log(funkyLogger.color('green', '\nProject set-up completed.'));
    console.log(funkyLogger.color('cyan', '\nProject generated at: '), funkyLogger.color('magenta', path.resolve(process.cwd(), config.projectName)));
    console.log(funkyLogger.color('green', '\n\nHappy Coding!! ^_^'));

  }

  async function migrate(config) {
    const mig = new Migrate(config);
    await mig.prepareForBackup();
    await mig.createBackup();
    await mig.prepareForMigration();
    await mig.extractContents();
    await mig.installNodeModules();
    await mig.runSanityCheck();

    console.log(funkyLogger.color('green', '\nProject migration completed.'));
    console.log(funkyLogger.color('cyan', '\nNew commands can be found at: '), funkyLogger.color('magenta', path.resolve(config.projectPath, 'README.new.md')));
    console.log(funkyLogger.color('green', '\n\nHappy Coding!! ^_^'));
  }

  module.exports = {
    printHelp: printHelp,
    printVersion: printVersion,
    generate: generate,
    migrate, migrate
  };

}());