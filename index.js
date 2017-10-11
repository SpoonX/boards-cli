#!/usr/bin/env node

const ezon        = require('ezon');
const {Runner}    = require('./lib/Runner');
const config      = require(process.cwd() + '/boards.js');
const task        = process.argv[2];
const name        = process.argv[3];
const pascalCased = name[0].toUpperCase() + name.substr(1);
const upperCased  = name.replace(/([A-Z])/g, c => `_${c}`).toUpperCase();

let runner = new Runner(config);

runner.run(task, Object.assign(process.argv[4] ? ezon(process.argv[4]) : {}, {name, pascalCased, upperCased}))
  .then(() => console.log('Task completed.'))
  .catch(error => console.log('Task failed.', error));
