const jscs = require('jscodeshift');
const {createFindCallFn} = require('./ast');
const { appendJSONFile, getJSONFileRandom} = require('./myutil.js');
const path = require('path');
// const { filesTransDir} = require('./config');
const { filesTransDir } = process.env;
const jsonFileName = getJSONFileRandom(filesTransDir);
const requireMap = {};

const analysePath = (root, absPath) => {
    const findFn = createFindCallFn('goog.provide');
    root.find(jscs.CallExpression, findFn).forEach((path, idx, paths) => {
        const args = path.value.arguments;
        const statement = args[0].value;
        requireMap[statement] = absPath;
    });
}
module.exports = (file, api, options) => {
    const root = jscs(file.source);
    analysePath(root, path.resolve(file.path));
    appendJSONFile(jsonFileName, requireMap);
}