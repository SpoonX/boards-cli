# Boards-cli

_An opinionated, no-nonsense boilerplate tool based on [Boards](https://www.npmjs.com/package/boards) and [Procurator](https://www.npmjs.com/package/procurator)._

Simply tell me where you keep your templates, pass instructions through a tiny config file and I'll take care of the rest.

Use me to:

- Generate boilerplate files (using a _really_ simple [templating language](https://www.npmjs.com/package/procurator)).
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

## The command

Running a command is simple, and allows for flexibility in terms of parameters.

> `boards <task> <name> [parameters]`

* The name of the **task** _(property `hello` in your config's tasks)_ is the first argument. This is defined by you in the config. Use this to specify which task to run.
* The **name** argument is second, and specifies the name of the _thing_ you want to generate. This is one of the default parameters available in your templates, and target name.
* The **parameters** is the third and last argument. This will be passed in to the templates and can be used in the target name. The format used here is [ezon](https://www.npmjs.com/package/ezon), a super simple format. Just JSON with the (optional) possibility to leave out quotes, curly braces and such.

Some examples:

* `boards redux user`
* `boards class test 'className:TestClass,location:my/path'`

## Tasks

The cli only has 2 tasks available. Refreshing, isn't it?
The cool thing is that you can batch them. This means a single task can perform multiple actions.

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
        prepare: params => Object.assign(params, {foo: 'bar'}),
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

Sometimes you want to create and edit files multiple times. One example is a redux/saga combo for API requests:

```js
module.exports = {
  tasks: {
    /* for the sake of brevity I'll omit the action and saga tasks from this example */ 
    fullAction: [
      { definedTask: 'action' },
      { definedTask: 'saga' },
    ],
    
    api: [
      { definedTask: 'fullAction', sync: true },
      { definedTask: 'fullAction', prepare: params => { params.type += 'Success'}, sync: true },
      { definedTask: 'fullAction', prepare: params => { params.type += 'Failure'}, sync: true },
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
