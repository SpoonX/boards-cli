# Boards-cli

[![npm version](https://badge.fury.io/js/boards-cli.svg)](https://badge.fury.io/js/boards-cli)
[![Gitter chat](https://badges.gitter.im/SpoonX/Dev.svg)](https://gitter.im/SpoonX/Dev)

_An opinionated, no-nonsense boilerplate tool based on [Boards](https://www.npmjs.com/package/boards) and [Procurator](https://www.npmjs.com/package/procurator)._

Simply tell me where you keep your templates, pass instructions through a tiny config file and I'll take care of the rest.

Use me to:

- Generate boilerplate files (using a _really_ simple [templating language](https://www.npmjs.com/package/procurator)) _(now supports glob!)_.
- Alter existing files (like adding routes, or exports).
- That's it. I don't do a lot (unless you teach me how), but I'm very good at what I do.

## Getting started

Getting started with Boards-cli is only a few steps.

### Installation

First, install the boards cli. `npm i -g boards-cli`

### Setting up

1. Create a new directory called `templates` (you can change this later) in the root of your project.
2. Create a template (`echo "Created {{name}}, hello {{who}}\!" > templates/hello.hbs`)
3. Create a file in your project's root called `boards.js` with the following contents _(change to fit your project)_:

  ```js
    module.exports = {
      // Where will you kep your boilerplate templates?
      templateRoot: __dirname + '/templates',

      // Where is your application's source located?
      appRoot: __dirname + '/src',

      tasks: {
        hello: [{task: 'generate', template: 'hello.hbs', target: '{{pascalCased}}.js'}]
      }
    };
  ```

4. Now you can run `boards hello someName who:you`.
5. All done! You just generated a new file in src/SomeName.js

**Note:** You can also run `boards hello someName --who=you` as the ezon format is optional.

## The command

Running a command is simple, and allows for flexibility in terms of parameters.

> `boards <task> <name> [parameters]`

* The name of the **task** _(property `hello` in your config's tasks)_ is the first argument. This is defined by you in the config. Use this to specify which task to run.
* The **name** argument is second, and specifies the name of the _thing_ you want to generate. This is one of the default parameters available in your templates, and target name.
* The **parameters** is the third and last argument. This will be passed in to the templates and can be used in the target name. The format used here is [ezon](https://www.npmjs.com/package/ezon) or [Minimist-style](https://www.npmjs.com/package/minimist) parameters. If your first argument is ezon, they can also be combined.

Some examples:

* `boards redux user`
* `boards class test 'className:TestClass,location:my/path'`

## Presets

Boards-cli now also supports presets! Install them in your project, or globally. It doesn't matter, because we use [Plugin Discover](https://github.com/spoonX/plugin-discovery) so we'll find your preset.

[Click here](https://github.com/search?utf8=%E2%9C%93&q=boards-preset-&type=Repositories) to find out if there's already a preset for your favorite stack.

Boards-CLI uses the [default presets](https://github.com/spoonX/boards-preset-default#tasks) as a dependency, so those tasks are always available.

_**Hint:** You can easily start creating your own preset by running: `boards default:preset myPreset`_

### Running tasks

Presets have their tasks documented in the readme. The command to run a preset task is identical to running a task from your project, with one difference: you prepend the preset name to the task.

For example, let's say you have installed a preset called `user` which has a task called `create`, you'd execute the task like this:

`boards user:create Bob`

_**Hint:** If you want to list the specific tasks of a preset in your terminal, try running: `boards presetName:tasks`. Example: `boards user:tasks`_

### Overriding preset tasks

Overriding tasks that come with a preset is as simple as just defining it in your `tasks`. The key you use to override the task is the same as the key used to run the command.

Here's an example overriding task `create` from preset `user`:

```js
module.exports = {
  templateRoot: __dirname + '/templates',

  appRoot: __dirname + '/src',

  tasks: {
   'user:create': () => {} // Noop, just used as example
  }
};
```

### Overriding templates

Want to use a preset, but hate the default templates it comes with? No problem! Just override the template in your project and it'll be used, no configuration required.

All you have to do is create a file in the exact same location relative to your `templateRoot`, and change the content.

## Tasks

The cli only has 2 tasks available. Refreshing, isn't it?

The cool thing is that you can batch them. This means a single task can perform multiple actions. Every task has a couple of options that can be combined freely, giving you a lot of flexibility and possibilities. `<insert rainbow here>`.

### Generate

This allows you to generate a new file in your project.

```js
{
  task: 'generate',

  // Path to template (relative from `templateRoot`)
  template: 'reducers.hbs',

  // Path to target file. Where will we be putting the new file?
  target: '{{pascalCased}}.reducers.js'
}
```

#### Generate simple copy

Sometimes you just want to copy a file from A to B.
Because that's such a simple command to perform, Boards-cli by default assumes a template.
This means that copying without using the template engine is opt-in.

**Example (simple):**

```js
{
  // Just a regular glob task.
  task: 'generate',

  method: 'copy',

  template: 'favicon.ico',

  // Path to target file. Where will we be putting the new files?
  target: '.'
}
```

**Example (glob):**

```js
{
  task: 'generate',

  // Tell boards you want a simple copy.
  method: 'copy',

  // Start glob in templateRoot/config/ as to not create the config dir in target
  from: 'config',

  // Copy all config files
  glob: 'config/**/*',

  // Path to target file. Where will we be putting the new files?
  target: 'component/{{pascalCased}}/configuration'
}
```

#### Generate glob

It's also possible to batch-generate files using globs.
These will all go through the templating engine allowing you to use variables.

This method is particularly handy when initializing directories or projects.

**Example:**

```js
{
  // Just a regular glob task.
  task: 'generate',

  // Start glob in templateRoot/config/ as to not create the config dir in target
  from: 'config',

  // Copy all config files
  glob: 'config/**/*',

  // Path to target file. Where will we be putting the new files?
  target: 'component/{{pascalCased}}/configuration'
}
```

**Warning:** this comes with some downsides:

1. The source and target paths need to be identical. You can't change file extension or location.
2. The target needs to be a directory. If it's a filename, a directory using that name will be created.

### Modify

This allows you to modify an existing file in your project. Useful for routes of exports!

```js
{
  task: 'modify',

  // Path to target file. Which file will we be modifying? Relative to appRoot.
  target: '{{pascalCased}}.reducers.js',

  patch: {
    pattern: /];\s*module/,
    prepend: `  '{{name}}',\n`
  }
}
```

_**Note:** Read more about the [modify step](https://github.com/SpoonX/boards#modify) in the Boards docs._

### Batching tasks

Batching tasks looks like this (using the config we made in [Setting up](#setting-up)):

```js
module.exports = {
  // Where will you kep your boilerplate templates?
  templateRoot: __dirname + '/templates',

  // Where is your application's source located?
  appRoot: __dirname + '/src',

  tasks: {
    hello: [
      {task: 'generate', template: 'hello.hbs', target: '{{pascalCased}}.js'},
      {task: 'generate', template: 'hello2.hbs', target: '{{pascalCased}}2.js'},
      {task: 'modify', target: 'redux/foo.js', patch: {pattern: /];\s*module/, prepend: `  '{{name}}',\n`}},
    ]
  }
};
```

Now when running hello, two files will be created and one will be altered.

### Parameters

Out of the box you get the following parameters:

- name
- pascalCased
- upperCased

Do you need more? Pass them along with the command as explained in the [The command](#the-command) chapter.

Do you need to alter or manipulate parameters? Keep reading!

### Prepare

It's also possible to manipulate your parameters before your task gets run, either for all the steps, or a specific one.

#### Specific steps

When preparing parameters for a specific part, you'll get a copy of the original parameters object.
This means that all prepared changes are only applied within the context of that specific step.

```js
module.exports = {
  tasks: {
    hello: [
      {
        task: 'generate',
        template: 'hello.hbs',
        prepare: params => Object.assign(params, {foo: 'bar'}), // using a function
        target: '{{foo}}.js', // Accessible
      },
    ]
  }
};
```

Or simply return an object of parameters if you want a simple merge:


```js
module.exports = {
  tasks: {
    hello: [
      {
        task: 'generate',
        template: 'hello.hbs',
        prepare: {foo: 'bar'}, // Let boards do the merge for you
        target: '{{foo}}.js', // Accessible
      },
    ]
  }
};
```

_**Note: This also works for definedTasks. When used there, this automatically makes the task isolated.**_

#### Complete task

If you wish to manipulate the params for all steps following your prepare method, pass in a function as the task.
This step passes the parameters by reference, so it affects all other steps.

```js
module.exports = {
  tasks: {
    hello: [
      {task: params => Object.assign(params, {foo: 'bar'})},
      {
        task: 'generate',
        template: 'hello.hbs',
        target: '{{foo}}.js', // Accessible
      }
    ]
  }
};
```

_**Note:** All steps that follow this prepare step will be affected, the ones before it will not._

### Sync tasks

_**New:** You no longer have to worry about basic sync / async tasks. Boards-cli now automatically resolves most (disk) IO dependencies for you._

Sometimes you want to create dynamic tasks that for example fetch data from third party APIs, so you can pass that info on to subsequent tasks.

Boards-cli is smart, but not that smart. You'll have to help it out a bit by telling it to wait with the rest of the tasks until it's done.

TL;DR; by marking a task as sync, you tell boards to let all the other tasks under it to wait until it finishes running.

```js
module.exports = {
  tasks: {
    /* for the sake of brevity I'll omit the action and saga tasks from this example */
    fullAction: [
      { definedTask: 'action' },
      { definedTask: 'saga' },
    ],

    api: [
      { dynamicTask: params => fetchRemoteConfigAndAddToParameters(params), sync: true },
      { definedTask: 'fullAction' },
      { definedTask: 'fullAction', prepare: params => { params.type += 'Success'} },
      { definedTask: 'fullAction', prepare: params => { params.type += 'Failure'} },
    ],
  }
};
```

This would alter the same files three times, causing race conditions.
By setting the sync flag, the steps will be executed in sequence, preventing race conditions from happening.

## defined tasks

Using `definedTask` you can reuse other tasks you've defined (ha! it's in the name).
This is especially useful to create reusable steps.

```js
module.exports = {
  tasks: {
    tinyTask: [
      {task: 'modify', target: 'redux/foo.js', patch: {pattern: /];\s*module/, prepend: `  '{{name}}',\n`}},
    ],
    anotherTinyTask: [
      {task: 'generate', template: 'hello.hbs', target: '{{pascalCased}}.js'},
      {task: 'generate', template: 'hello2.hbs', target: '{{pascalCased}}2.js'},
    ],
    slightlyLargerTask: [
      {definedTask: 'tinyTask'},
      {definedTask: 'anotherTinyTask'},
    ]
  }
};
```

Now you can run the tiny commands, or call them both at once by using the slightlyLargerTask!

### Isolation

By default, parameters are passed on to other tasks by reference.
This means that changes made to the parameters by definedTasks are automatically passed on to the next task.

You can disable this behavior by flagging a definedTask as `isolated`, meaning that parameter changes will only apply to that step.

_**Note:** not needed when also using the `prepare` option._

```js
module.exports = {
  tasks: {
    tinyTask: [
      {task: 'modify', target: 'redux/foo.js', patch: {pattern: /];\s*module/, prepend: `  '{{name}}',\n`}},
    ],
    anotherTinyTask: [
      {task: params => {params.foo = 'bar'}},
      {task: 'generate', template: 'hello.hbs', target: '{{pascalCased}}.js'},
      {task: 'generate', template: 'hello2.hbs', target: '{{pascalCased}}2.js'},
    ],
    slightlyLargerTask: [
      {definedTask: 'anotherTinyTask', isolated: true},

      // Param `foo` now doesn't exist in tinyTask.
      {definedTask: 'tinyTask'},
    ]
  }
};
```

## Dynamic tasks

Dynamic tasks allow you to supply the tasks "JIT" and async!
This is useful when you need to, for instance, read out a dir or make an API call before you know the tasks.

Make an API call, read a dir, query a database or ask for user input on the CLI.
This task type adds a ton of possibilities

Here's an example to blow your proverbial mind:

```js
const fs = require('fs');

module.exports = {
  tasks: {
    specialTask: {
      dynamicTask: params => new Promise((resolve, reject) => {
        fs.readdir(__dirname + '/src/components', (error, files) => {
          if (error) {
            return reject(error);
          }

          params.entries = files;

          resolve({definedTask: 'logEntries'});
        });
      })
    },

    logEntries: {task: parameters => console.log('Logging entries!\n\n', parameters.entries)},
  }
};
```

Now you can run `boards specialTask`. Whaaaaaat!? I know.

## Templating

Templating uses [Procurator](https://www.npmjs.com/package/procurator). This means you have some flexibility in terms of defaults and variables. Also, it's just extremely fast.

## License

MIT
