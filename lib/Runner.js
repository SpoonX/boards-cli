const { Boards }    = require('boards');
const fileExists    = require('file-exists');
const procurator    = require('procurator');
const { Homefront } = require('homefront');
const path          = require('path');
const glob          = require('glob');

class Runner {
  constructor(config) {
    this.config = Homefront.merge({ tasks: {}, appRoot: '.', templateRoot: '.' }, config);
    this.boards = new Boards({ discoveryConfig: { prefix: 'boards-preset' } });
  }

  composeTask(task, parameters) {
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

    parameters.fallbackSourceDirectory = preset.templateRoot;

    return preset.tasks[task];
  }

  run(task, parameters) {
    parameters = Homefront.merge({}, this.config.parameters || {}, parameters);

    return this.apply('default:prepare', parameters).then(() => {
      return this.apply(task, parameters)
    });
  }

  apply(task, parameters) {
    let instructions = task;

    if (typeof task === 'string') {
      instructions = this.composeTask(task, parameters);

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
    instruction.from = instruction.from || '';

    // Prepare for step. Copy parameters to not affect other tasks.
    if (typeof instruction.prepare === 'function') {
      parameters = this.prepareParams(instruction.prepare, Homefront.merge({}, parameters));
    }

    // Allow dynamic tasks to be supplied.
    if (typeof instruction.dynamicTask === 'function') {
      return Promise.resolve(instruction.dynamicTask(parameters)).then(tasks => {
        this.apply(tasks, parameters);
      });
    }

    if (typeof instruction.definedTask !== 'undefined') {
      if (typeof instruction.definedTask !== 'string') {
        throw new Error(`definedTask must be a string. Got ${typeof instruction.definedTask}.`);
      }

      if (instruction.isolated && typeof instruction.prepare !== 'function') {
        parameters = Homefront.merge({}, parameters);
      }

      return this.apply(instruction.definedTask, parameters);
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
      modify         : { patch: instruction.patch }
    }));
  }

  applyGenerate(template, target, sourceDirectory, instruction, parameters) {
    const parsed = path.parse(this.getTarget(target, parameters));

    return this.boards.generate('TemplateGenerator', Object.assign({}, parameters, {
      targetFile     : parsed.base,
      targetDirectory: path.join(this.config.appRoot, parsed.dir || '.'),
      sourceFile     : template,
      sourceDirectory
    }));
  }

  generate(instruction, parameters) {
    if (!instruction.glob) {
      const template = this.getTarget(instruction.template, parameters);

      return this.applyGenerate(template, instruction.target, this.getTemplateDirectory(instruction, parameters), instruction, parameters);
    }

    const glob         = this.getTarget(instruction.glob, parameters);
    const globPromises = [];

    if (this.config.templateRoot) {
      globPromises.push(this.glob(glob, path.join(this.config.templateRoot, instruction.from)));
    } else {
      // Push empty array so we can use array position further down
      globPromises.push(Promise.resolve([]));
    }

    if (parameters.fallbackSourceDirectory) {
      globPromises.push(this.glob(glob, path.join(parameters.fallbackSourceDirectory, instruction.from)));
    }

    return Promise.all(globPromises)
      .then(globbed => {
        const projectMatches = globbed[0];
        const generates      = [];
        const makeApply      = (match, dir) => {
          const target = path.join(instruction.target, match);

          generates.push(this.applyGenerate(target, target, path.join(dir, instruction.from), instruction, parameters));
        };

        projectMatches.forEach(match => makeApply(match, this.config.templateRoot));

        if (globbed[1]) {
          globbed[1]
            .filter(match => !projectMatches.includes(match))
            .forEach(match => makeApply(match, parameters.fallbackSourceDirectory));
        }

        return Promise.all(generates);
      });
  }

  getTemplateDirectory(instruction, parameters) {
    if (fileExists.sync(path.resolve(this.config.templateRoot, instruction.template))) {
      return this.config.templateRoot;
    }

    const fallback = parameters.fallbackSourceDirectory;

    if (!fallback) {
      throw new Error(`Template "${instruction.template}" not found.`);
    }

    if (!fileExists.sync(path.resolve(fallback, instruction.template))) {
      throw new Error(`Preset template "${instruction.template}" not found.`);
    }

    return fallback;
  }

  glob(pattern, cwd) {
    return new Promise((resolve, reject) => {
      glob(pattern, { nodir: true, cwd }, (error, results) => {
        if (error) {
          return reject(error);
        }

        return resolve(results);
      });
    });
  }

  getTarget(target, parameters) {
    if (typeof target === 'function') {
      return target(parameters);
    }

    return procurator.sync(target, parameters);
  }
}

module.exports.Runner = Runner;
