<a name="4.0.0"></a>
# [4.0.0](https://github.com/SpoonX/boards-cli/compare/v3.0.0...v4.0.0) (2018-01-26)


### Features

* **project:** add glob and default presets ([b5da7e3](https://github.com/SpoonX/boards-cli/commit/b5da7e3))
* **project:** add support for presets ([2424e37](https://github.com/SpoonX/boards-cli/commit/2424e37))



<a name="3.0.0"></a>
# [3.0.0](https://github.com/SpoonX/boards-cli/compare/v2.2.2...v3.0.0) (2017-12-05)


### Features

* **Runner:** add support for dynamicTask ([908f3c5](https://github.com/SpoonX/boards-cli/commit/908f3c5))
* **Runner:** add sync tasks ([e4327c5](https://github.com/SpoonX/boards-cli/commit/e4327c5))


### BREAKING CHANGES

* **Runner:** Exceptions are no longer thrown. Instead, they're now
rejected promises. The reason for this is to normalize the return value
to a Promise and make the entire Runner.run more predictable.
* **Runner:** Prepare is now always run, even for definedTasks. When
returning anything of type object from prepare, it will replace the
parameters in the chain. This is useful for simpel prepare changed.



<a name="2.2.2"></a>
## [2.2.2](https://github.com/SpoonX/boards-cli/compare/v2.2.1...v2.2.2) (2017-10-12)


### Bug Fixes

* **project:** allow nameless tasks to be run ([d77d096](https://github.com/SpoonX/boards-cli/commit/d77d096))



<a name="2.2.1"></a>
## [2.2.1](https://github.com/SpoonX/boards-cli/compare/v2.2.0...v2.2.1) (2017-10-12)



<a name="2.2.0"></a>
# [2.2.0](https://github.com/RWOverdijk/boards-cli/compare/v2.1.0...v2.2.0) (2017-10-12)


### Features

* **Runner:** add isolation mode to definedTask ([65023dd](https://github.com/RWOverdijk/boards-cli/commit/65023dd))



<a name="2.1.0"></a>
# [2.1.0](https://github.com/RWOverdijk/boards-cli/compare/v2.1.0-0...v2.1.0) (2017-10-12)


### Features

* **Runner:** allow reusing defined tasks in other tasks ([08328c6](https://github.com/RWOverdijk/boards-cli/commit/08328c6))



<a name="2.1.0-0"></a>
# [2.1.0-0](https://github.com/RWOverdijk/boards-cli/compare/v2.0.6...v2.1.0-0) (2017-10-11)


### Features

* **Runner:** allow prepare step for params ([6c379ef](https://github.com/RWOverdijk/boards-cli/commit/6c379ef))



<a name="2.0.6"></a>
## [2.0.6](https://github.com/RWOverdijk/boards-cli/compare/v2.0.5...v2.0.6) (2017-10-11)


### Bug Fixes

* **Runner:** add upperCased param to target ([f054e81](https://github.com/RWOverdijk/boards-cli/commit/f054e81))



<a name="2.0.5"></a>
## [2.0.5](https://github.com/RWOverdijk/boards-cli/compare/v2.0.4...v2.0.5) (2017-10-11)


### Features

* **project:** add upperCased as default parameter ([982b9a0](https://github.com/RWOverdijk/boards-cli/commit/982b9a0))



<a name="2.0.4"></a>
## [2.0.4](https://github.com/RWOverdijk/boards-cli/compare/v2.0.3...v2.0.4) (2017-10-10)



<a name="2.0.3"></a>
## [2.0.3](https://github.com/RWOverdijk/boards-cli/compare/v2.0.2...v2.0.3) (2017-10-10)


### Bug Fixes

* **Runner:** identify partial paths ([5411456](https://github.com/RWOverdijk/boards-cli/commit/5411456))



<a name="2.0.2"></a>
## [2.0.2](https://github.com/RWOverdijk/boards-cli/compare/v2.0.1...v2.0.2) (2017-10-10)


### Bug Fixes

* **Runner:** replace multiple occurrences ([a4ce2c8](https://github.com/RWOverdijk/boards-cli/commit/a4ce2c8))



<a name="2.0.1"></a>
## [2.0.1](https://github.com/RWOverdijk/boards-cli/compare/v2.0.0...v2.0.1) (2017-10-10)



<a name="2.0.0"></a>
# 2.0.0 (2017-10-10)



