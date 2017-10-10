# Boards-cli

_An opinionated, no-nonsense boilerplate tool based on [Boards](www.npmjs.com/package/boards) and [Procurator](https://www.npmjs.com/package/procurator)._

Simply tell me where you keep your templates, pass instructions through a tiny config file and I'll take care of the rest.

Use me to:

  - Generate boilerplate files (using a _really_ simple [templating language](https://www.npmjs.com/package/procurator)).
- Alter existing files (like adding routes, or exports).
- That's it. I don't do a lot, but I'm very good at what I do.

## Getting started

Getting started with Boards-cli is only a few steps.

### Installation

First, install the boards cli. `npm i -g boards-cli`

### Setting up

1. Create a new directory called `templates` (you can change this later) in the root of your project.
2. Create a template (`echo "Created {{name}}, hello {{who}}!" > templates/hello.hbs`)
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

## Templating

Templating uses [Procurator](https://www.npmjs.com/package/procurator). This means you have some flexibility in terms of defaults and variables. Also, it's just extremely fast.

## License

MIT
