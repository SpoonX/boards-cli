const {Boards}    = require('boards');
const procurator  = require('procurator');
const {Homefront} = require('homefront');
const fileExists  = require('file-exists');
const path        = require('path');

class Runner {
  constructor(config) {
    this.config = Homefront.merge({tasks: {}}, config);
    this.boards = new Boards({discoveryConfig: {prefix: 'boards-preset'}});
  }

  composeTask(task) {
    if (this.config.tasks[task]) {
      return this.config.tasks[task];
    }

    // Preset. Check if exists.
    const parts      = task.split(':');
    const presetName = parts.shift();
    const presets    = this.boards.getPlugins();
    const preset     = presets[presetName];
    task             = parts[0];

    if (!preset) {
      throw new Error(`Preset "${presetName}" not found.`);
    }

    const presetTask = preset.tasks[task];

    presetTask.fallbackSourceDirectory = preset.templateRoot;

    return presetTask;
  }

  run(task, parameters) {
    let instructions = task;

    parameters = Homefront.merge({}, this.config.parameters || {}, parameters);

    if (typeof task === 'string') {
      instructions = this.composeTask(task);

      if (!instructions) {
        return Promise.reject(new Error(`Instructions for task "${task}" not found.`));
      }
    }

    if (!instructions) {
      return Promise.reject(new Error(`Invalid instructions provided.`));
    }

    if (!Array.isArray(instructions)) {
      instructions = [instructions];
    }

    let previousTask = null;

    return Promise.all(instructions.map(instruction => {
      let runner;

      if (previousTask) {
        runner       = previousTask.then(() => this.runTask(instruction, parameters));
        previousTask = null;
      } else {
        runner = this.runTask(instruction, parameters);
      }

      if (instruction.sync) {
        previousTask = runner;
      }

      return runner;
    }));
  }

  prepareParams(method, params) {
    const preparedParams = method(params);

    if (typeof preparedParams === 'object') {
      return preparedParams;
    }

    return params;
  }

  runTask(instruction, parameters) {
    // Prepare for step. Copy parameters to not affect other tasks.
    if (typeof instruction.prepare === 'function') {
      parameters = this.prepareParams(instruction.prepare, Homefront.merge({}, parameters));
    }

    // Allow dynamic tasks to be supplied.
    if (typeof instruction.dynamicTask === 'function') {
      return Promise.resolve(instruction.dynamicTask(parameters)).then(tasks => {
        this.run(tasks, parameters);
      });
    }

    if (typeof instruction.definedTask !== 'undefined') {
      if (typeof instruction.definedTask !== 'string') {
        throw new Error(`definedTask must be a string. Got ${typeof instruction.definedTask}.`);
      }

      if (instruction.isolated && typeof instruction.prepare !== 'function') {
        parameters = Homefront.merge({}, parameters);
      }

      return this.run(instruction.definedTask, parameters);
    }

    if (typeof instruction.task === 'function') {
      return instruction.task(parameters, this.boards);
    }

    if (typeof this[instruction.task] !== 'function') {
      throw new Error(`Invalid task "${instruction.task}" supplied`);
    }

    return this[instruction.task](instruction, parameters);
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
    const parsed          = path.parse(this.getTarget(instruction.target, parameters));
    const sourceDirectory = this.getTemplateDirectory(instruction);

    return boards.generate('TemplateGenerator', Object.assign({}, parameters, {
      targetFile     : parsed.base,
      targetDirectory: path.join(this.config.appRoot, parsed.dir),
      sourceFile     : instruction.template,
      sourceDirectory
    }));
  }

  getTemplateDirectory(instruction) {
    if (fileExists.sync(path.resolve(this.config.templateRoot, instruction.template))) {
      return this.config.templateRoot;
    }

    const fallback = instruction.fallbackSourceDirectory;

    if (!fallback) {
      throw new Error(`Template "${instruction.template}" not found.`);
    }

    if (!fileExists.sync(path.resolve(fallback, instruction.template))) {
      throw new Error(`Preset template "${instruction.template}" not found.`);
    }

    return fallback;
  }

  getTarget(target, parameters) {
    if (typeof target === 'function') {
      return target(parameters);
    }

    return procurator.sync(target, parameters);
  }
}

module.exports.Runner = Runner;
