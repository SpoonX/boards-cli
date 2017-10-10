const {Boards} = require('boards');
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
    return boards.generate('TemplateGenerator', Object.assign({}, parameters, {
      sourceFile     : instruction.template,
      targetFile     : this.getTarget(instruction.target, parameters),
      sourceDirectory: this.config.templateRoot,
      targetDirectory: `${this.config.appRoot}/redux`
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
