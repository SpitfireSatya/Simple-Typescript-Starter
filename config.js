const funkyLogger = require('./funky-logger');

(function() {

  'use strict';
  const path = require('path');

  function Config() {
    this.workflow = 'unknown';
    this.projectName = 'my-project';
    this.author = 'author';
    this.projectPath = path.resolve('./');
    this.force = false;
    this.pathToArchive = path.resolve(__dirname, 'typescript-starter.zip');
  }

  function parseConfig(args) {

    const config = new Config();

    if(args.includes('-f')) {
      config.force = true;
      args.splice(args.indexOf('-f'), 1);
      console.log(funkyLogger.color('red', 'Force flag detected\n'));
    }

    if(args.includes('--force')) {
      config.force = true;
      args.splice(args.indexOf('--force'), 1);
      console.log(funkyLogger.color('red', 'Force flag detected\n'));
    }

    if(['version', '--version', '-v'].includes(args[2])) {
      config.workflow = 'version';
    } 
    
    if(['help', '--help', '-h'].includes(args[2])) {
      config.workflow = 'help';
    } 
    
    if(args[2] === 'generate') {
      
      config.workflow = 'generate';

      if(!args[3]) {
        console.log(funkyLogger.color('yellow', '\nNo project name specified. Using default name `my-project` and author `author`\n'));
      } else if(!args[4]) {
        console.log(funkyLogger.color('yellow', '\nNo author specified. Using default name `author`\n'));
      } else {
        console.log(funkyLogger.color('green', `Generating project "${args[3]}" with author "${args[4]}"\n`));
      }
    
      config.projectName = args[3] || 'my-project';
      config.author = args[4] || 'author';
    }

    if(args[2] === 'migrate') {
      
      config.workflow = 'migrate';

      if(!args[3]) {
        console.log(funkyLogger.color('yellow', `\nNo project path specified. Assuming default relative path ${process.cwd()}\n`));
      }

      config.projectPath = args[3] || process.cwd();

    }

    return config;

  }

  module.exports = parseConfig;

}());