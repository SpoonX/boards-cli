#!/usr/bin/env node

const ezon        = require('ezon');
const fileExists  = require('file-exists');
const {Runner}    = require('./lib/Runner');
const task        = process.argv[2];
const name        = process.argv[3];
const pascalCased = name && name[0].toUpperCase() + name.substr(1);
const upperCased  = name && name.replace(/([A-Z])/g, c => `_${c}`).toUpperCase();
const boardsFile  = process.cwd() + '/boards.js';
const config      = fileExists.sync(boardsFile) ? require(boardsFile) : {};

let runner = new Runner(config);

runner.run(task, Object.assign(process.argv[4] ? ezon(process.argv[4]) : {}, {name, pascalCased, upperCased}))
  .then(() => console.log('Task completed.'))
  .catch(error => console.log('Task failed.', error));
