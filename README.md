# goog2esm

## intro
A way to transform goog module to esm by ast.

## usage
1. install it
`npm i goog2esm -g`
2. enter your project waiting for transform
3. create config file (goog2esm.config.js)
like this
```
module.exports = {
    entry: 'Blockly',
    pendingDirs: ['src'],
}
```
| Name | Description|
|:---:|:---:|
|entry| your goog module entry variable(required)|
|pendingDirs|Folders to convert(optional)|


4. exec command,your goog module will transfrom to esm
`goog2esm`

## how to work
1. Get all `goog.provide` and generate Map file of namespace and filepath used to calculate import paths.
2. To avoid circular dependencies, create a transfer file(`_transfer_.js`) to declare the entry variable and import this file into all files to enhance entry variable.
3. Replace `goog.require` with `import`.The relative path of the file here needs to be calculated.
4. If goog closure-library is used in the file, import the goog-lib.js I prepared.
5. Record the existing namespace, and new declaration will be created for those that do not. as beflow, we need declare `Test.B = {}`
```
goog.provide('Test.B');
Test.B.a = '123';
```
6. Files not referenced from the entry point need to be imported additionally.They are will in `_quote_.js`

## test case
-  [scratch-blocks-esm](https://github.com/yhx9527/scratch-blocks-esm)  
use http-server to open test/vertical_playground.html

