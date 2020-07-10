#!/usr/bin/env node

(async function() {

  'use strict';

  const funkyLogger = require('./funky-logger');
  const sts = require('./simple-typescript-starter');
  const path = require('path');

  console.log(funkyLogger.color('blue', '\nThank you for using Simple-Typescript-Starter.\n'))

  function printHelp() {
    console.log(`
      /////////////////////////////////////////////////////////////////////////////////////
      //                                                                                 //
      //                  Welcome to Simple-Typescript-Starter Help                      //
      //                                                                                 //
      //  This module currently supports only 2 commands:                                //
      //    1) sts help/--help/-h                                                        //
      //    2) sts generate                                                              //
      //                                                                                 //
      //  1) sts help                                                                    //
      //    "sts help" is used to generate this help message                             //
      //                                                                                 //
      //  2) sts generate                                                                //
      //    "sts generate" is used to generate a new typescript project.                 //
      //                                                                                 //
      //    Usage:                                                                       //
      //          sts generate <project-name> <author>                                   //
      //    where,                                                                       //
      //          <project-name> is the name of the project (cannot contain spaces),     //
      //          <author> is the name of the project creator                            //
      //    default values are my-project and author respectively                        //
      //                                                                                 //
      //    Note: These properties can be modified manually after creating the project   //
      //                                                                                 //
      //                                                                                 //
      /////////////////////////////////////////////////////////////////////////////////////
      `)
  }

  if(['help', '--help', '-h'].includes(process.argv[2])) {
    printHelp();
    process.exit(0);
  } else if(process.argv[2] !== 'generate') {
    console.log(funkyLogger.color('red', 'Unknown command: '), funkyLogger.color('red', process.argv[2]));
    console.log(funkyLogger.color('red', 'Run `sts help` to see available options'));
    process.exit(1);
  }

  if(!process.argv[3]) {
    console.log(funkyLogger.color('yellow', '\nNo project name specified. Using default name `my-project` and author `author`\n'));
  } else if(!process.argv[4]) {
    console.log(funkyLogger.color('yellow', '\nNo author specified. Using default name `author`\n'));
  } else {
    console.log(funkyLogger.color('green', `Generating project "${process.argv[3]}" with author "${process.argv[4]}"\n`));
  }

  const projectName = process.argv[3] || 'my-project';
  const author = process.argv[4] || 'author';

  await sts.extractContents(projectName, author);
  await sts.installNodeModules();
  await sts.runSanityCheck();

  console.log(funkyLogger.color('green', '\nProject set-up completed.'));
  console.log(funkyLogger.color('cyan', '\nProject generated at: '), funkyLogger.color('magenta', path.resolve(process.cwd(), projectName)));
  console.log(funkyLogger.color('green', '\n\nHappy Coding!! ^_^'));

}());