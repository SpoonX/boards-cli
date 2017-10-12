const { Boards }    = require('boards');
const { Homefront } = require('homefront');
const path          = require('path');
const boards        = new Boards({ discovery: false });

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
    if (typeof instruction.definedTask !== 'undefined') {
      if (typeof instruction.definedTask !== 'string') {
        throw new Error(`definedTask must be a string. Got ${typeof instruction.definedTask}.`);
      }

      if (instruction.isolated) {
        parameters = Homefront.merge({}, parameters);
      }

      return this.run(instruction.definedTask, parameters);
    }

    if (typeof instruction.task === 'function') {
      return instruction.task(parameters, boards);
    }

    if (typeof this[instruction.task] !== 'function') {
      throw new Error(`Invalid task "${instruction.task}" supplied`);
    }

    if (typeof instruction.prepare === 'function') {
      // Task-specific prepare, don't modify by reference.
      parameters = instruction.prepare(Homefront.merge({}, parameters));
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
      .replace(/{{upperCased}}/g, parameters.upperCased)
      .replace(/{{name}}/g, parameters.name);
  }
}

module.exports.Runner = Runner;
