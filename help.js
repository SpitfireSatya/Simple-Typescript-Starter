(function() {

  'use strict';
  const funkyLogger = require('./funky-logger');

  function Help() {

    const helpMessage = `
        /////////////////////////////////////////////////////////////////////////////////////
        //                                                                                 //
        //                  Welcome to Simple-Typescript-Starter Help                      //
        //                                                                                 //
        //  This module currently supports only 2 commands:                                //
        //    1) sts help/--help/-h                                                        //
        //    2) sts generate                                                              //
        //    2) sts migrate                                                               //
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
        //  3) sts migrate                                                                 //
        //    "sts migrate" is used to migrate an existing typescript project to           //
        //     the currently installed STS version.                                        //
        //                                                                                 //
        //    Usage:                                                                       //
        //          sts migrate <project-path>                                             //
        //    where,                                                                       //
        //          <project-path> is the relative path to the project you wish            //
        //          to migrate. The argument is optional                                   //
        //    default value is current working directory                                   //
        //                                                                                 //
        /////////////////////////////////////////////////////////////////////////////////////
        `;

    function printHelp() {
      console.log(helpMessage);
      return this;
    }

    function printVersion() {
      const version = require('./package.json').version;
      console.log(funkyLogger.color('cyan', `Version: ${version}`));
    }

    this.printHelp = printHelp;
    this.printVersion = printVersion;

  }

  module.exports = Help;

}());