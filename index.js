#!/usr/bin/env node

(async function() {

  'use strict';

  const funkyLogger = require('./funky-logger');
  const sts = require('./simple-typescript-starter');
  const parseConfig = require('./config');

  console.log(funkyLogger.color('blue', '\nThank you for using Simple-Typescript-Starter.\n'))

  const config = parseConfig(process.argv);

  switch(config.workflow) {
    case 'version':
      sts.printVersion();
    case 'help':
      sts.printHelp();
    case 'generate':
      await sts.generate(config);
      break;
    case 'migrate':
      await sts.migrate(config);
      break;
    default:
      console.log(funkyLogger.color('red', 'Unknown command: '), funkyLogger.color('red', process.argv[2]));
      console.log(funkyLogger.color('red', 'Run `sts help` to see available options'));
      process.exit(1);
  }  

}());