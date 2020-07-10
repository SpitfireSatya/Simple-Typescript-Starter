
# Simple Typescript Starter

Package for generating a typescript scaffold with a bunch of reporters configured.  
  
This generates a customized Typescript 3.9 project which includes the following features:
* Webpack bunding
* Webpack bundle analyzer
* Unit test with Mocha/Chai/Sinon
* Coverage report with nyc
* TSLint Html Report
* Code Duplicity Html Report (with git integration)
* Documentation with Typedoc

## Installation

Install Simple-Typescript-Starter globally using the command:
```bash
npm install -g simple-typescript-starter
```

## Usage

Run the module from the command line to generate a new project as follows:
```bash
sts generate <project-name> <author>
```
and you're done!!  
  
*Note:* <project-name> cannot contain spaces and should be lower case.  
*Note:* <author> cannot contain spaces.  
  
To view the help and all available options, run:
```bash
sts help
```

## About Generated Project 

Refer to README.md of generated project for details of usage of various scripts.  
  
A general idea of the setup:  
 - All scripts for various tasks are located in the "scripts" directory.
 - All scripts are configured to be executed through npm.
 - All source code will be located in the "src" directory.
 - Entry point of the project is set to "src/index.ts".
 - Build artifacts will be generated in the "dist" directory.
 - documentation will be generated in the "documentation" folder.
 - Coverage, lint, jscpd, and bundle analysis reports are generated in the "reports" directory.
 - gitignore is set to ignore node_modules, dist, documentation, and reports from commits.

## Feature Requests and Issues

Feel free to report any issues you may find or any feature requests or suggestions you may have on github.