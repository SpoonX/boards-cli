const { Boards }    = require('boards');
const fileExists    = require('file-exists');
const procurator    = require('procurator');
const { Homefront } = require('homefront');
const path          = require('path');
const glob          = require('glob');

class Runner {
  constructor(config) {
    this.config     = Homefront.merge({ tasks: {}, appRoot: '.', templateRoot: '.' }, config);
    this.boards     = new Boards({ discoveryConfig: { prefix: 'boards-preset' } });
    this.operations = {};
  }

  composeTask(task, parameters) {
    if (this.config.tasks[task]) {
      parameters._tasks = this.config.tasks;

      return { instructions: this.config.tasks[task] };
    }

    // Preset. Check if exists.
    const parts      = task.split(':');
    const presetName = parts.shift();
    const presets    = this.getPresets();
    const preset     = presets[presetName];
    task             = parts[0];

    if (!preset) {
      throw new Error(`Preset "${presetName}" not found.`);
    }

    if (preset.parameters) {
      Homefront.merge(parameters, Homefront.merge({}, preset.parameters, parameters));
    }

    const tasks = preset.tasks;

    parameters._tasks = tasks;

    if (!tasks[task] && task === 'tasks') {
      return { instructions: presets.default.tasks.tasks, fallbackSourceDirectory: presets.default.templateRoot };
    }

    return { instructions: tasks[task], fallbackSourceDirectory: preset.templateRoot };
  }

  getPresets() {
    if (!this.presets) {
      this.presets = this.boards.getPlugins();
    }

    return this.presets;
  }

  run(task, parameters) {
    parameters = Homefront.merge({ appRoot: this.config.appRoot }, this.config.parameters || {}, parameters);

    return this.apply('default:prepare', parameters).then(() => this.apply(task, parameters));
  }

  apply(task, parameters) {
    let instructions = task;
    let fallbackSourceDirectory;

    if (typeof task === 'string') {
      const composed          = this.composeTask(task, parameters);
      instructions            = composed.instructions;
      fallbackSourceDirectory = composed.fallbackSourceDirectory;

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
        runner = previousTask.then(() => this.runTask(instruction, parameters, fallbackSourceDirectory));
      } else {
        runner = this.runTask(instruction, parameters, fallbackSourceDirectory);
      }

      if (instruction.sync) {
        previousTask = runner;
      }

      return runner;
    }));
  }

  prepareParams(method, params) {
    if (typeof method === 'object') {
      return Homefront.merge(params, method);
    }

    const preparedParams = method(params);

    if (typeof preparedParams === 'object') {
      return preparedParams;
    }

    return params;
  }

  runTask(instruction, parameters, fallbackSourceDirectory) {
    instruction.from = instruction.from || '';

    // Prepare for step. Copy parameters to not affect other tasks.
    if (instruction.prepare) {
      parameters = this.prepareParams(instruction.prepare, Homefront.merge({}, parameters));
    }

    // Allow dynamic tasks to be supplied.
    if (typeof instruction.dynamicTask === 'function') {
      return Promise.resolve(instruction.dynamicTask(parameters)).then(tasks => {
        return this.apply(tasks, parameters);
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

    return this[instruction.task](instruction, parameters, fallbackSourceDirectory);
  }

  modify(instruction, parameters) {
    const fullPath = path.resolve(this.config.appRoot, this.getTarget(instruction.target, parameters));

    return this.perform(fullPath, () => {
      return this.boards.generate('ModificationGenerator', Object.assign({}, parameters, {
        sourceDirectory: this.config.appRoot,
        targetDirectory: this.config.appRoot,
        sourceFile     : this.getTarget(instruction.target, parameters),
        modify         : { patch: instruction.patch }
      }));
    });
  }

  applyGenerate(template, target, sourceDirectory, instruction, parameters) {
    const parsed    = path.parse(this.getTarget(target, parameters));
    const generator = instruction.method === 'copy' ? 'CopyGenerator' : 'TemplateGenerator';

    return this.perform(
      path.resolve(path.join(this.config.appRoot, parsed.dir || '.'), parsed.base),
      () => {
        return this.boards.generate(generator, Object.assign({}, parameters, {
          targetFile     : parsed.base,
          targetDirectory: path.join(this.config.appRoot, parsed.dir || '.'),
          sourceFile     : this.getTarget(template, parameters),
          sourceDirectory
        }))
      }
    );
  }

  perform(target, operation) {
    if (!this.operations[target]) {
      return this.operations[target] = operation();
    }

    return this.operations[target] = this.operations[target].then(operation);
  }

  generate(instruction, parameters, fallbackSourceDirectory = null) {
    if (!instruction.glob) {
      const template          = this.getTarget(instruction.template, parameters);
      const templateDirectory = this.getTemplateDirectory(instruction, parameters, fallbackSourceDirectory);

      return this.applyGenerate(template, instruction.target, templateDirectory, instruction, parameters);
    }

    const glob         = this.getTarget(instruction.glob, parameters);
    const globPromises = [];

    if (this.config.templateRoot) {
      globPromises.push(this.glob(glob, path.join(this.config.templateRoot, instruction.from)));
    } else {
      // Push empty array so we can use array position further down
      globPromises.push(Promise.resolve([]));
    }

    if (fallbackSourceDirectory) {
      globPromises.push(this.glob(glob, path.join(fallbackSourceDirectory, instruction.from)));
    }

    return Promise.all(globPromises)
      .then(globbed => {
        const projectMatches = globbed[0];
        const generates      = [];
        const makeApply      = (match, dir) => {
          const target = path.join(instruction.target, match);

          generates.push(this.applyGenerate(match, target, path.join(dir, instruction.from), instruction, parameters));
        };

        projectMatches.forEach(match => makeApply(match, this.config.templateRoot));

        if (globbed[1]) {
          globbed[1]
            .filter(match => !projectMatches.includes(match))
            .forEach(match => makeApply(match, fallbackSourceDirectory));
        }

        return Promise.all(generates);
      });
  }

  getTemplateDirectory(instruction, parameters, fallbackSourceDirectory = null) {
    if (this.config.templateRoot && fileExists.sync(path.resolve(this.config.templateRoot, instruction.template))) {
      return this.config.templateRoot;
    }

    const fallback = fallbackSourceDirectory;

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
