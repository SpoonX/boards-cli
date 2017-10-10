const {Boards} = require('boards');
const path     = require('path');
const boards   = new Boards({discovery: false});

class Runner {
  constructor(config) {
    this.boards = new Boards({discovery: false});
    this.config = config;
  }

  run(task, parameters) {
    let instructions = this.config.tasks[task];

    if (!instructions) {
      throw new Error(`Instructions for task "${task}" not found.`);
    }

    if (!Array.isArray(instructions)) {
      instructions = [instructions];
    }

    return Promise.all(instructions.map(instruction => this.runTask(instruction, parameters)));
  }

  runTask(instruction, parameters) {
    if (typeof this[instruction.task] !== 'function') {
      throw new Error(`Invalid task "${instruction.task}" supplied`);
    }

    this[instruction.task](instruction, parameters);
  }

  modify(instruction, parameters) {
    return this.boards.generate('ModificationGenerator', Object.assign({}, parameters, {
      sourceDirectory: this.config.appRoot,
      targetDirectory: this.config.appRoot,
      sourceFile     : this.getTarget(instruction.target, parameters),
      modify         : {patch: instruction.patch}
    }));
  }

  generate(instruction, parameters) {
    const parsed = path.parse(this.getTarget(instruction.target, parameters));

    return boards.generate('TemplateGenerator', Object.assign({}, parameters, {
      sourceFile     : instruction.template,
      targetFile     : parsed.base,
      sourceDirectory: this.config.templateRoot,
      targetDirectory: path.join(this.config.appRoot, parsed.dir)
    }));
  }

  getTarget(target, parameters) {
    if (typeof target === 'function') {
      return target(parameters);
    }

    return target
      .replace(/{{pascalCased}}/g, parameters.pascalCased)
      .replace(/{{name}}/g, parameters.name);
  }
}

module.exports.Runner = Runner;
