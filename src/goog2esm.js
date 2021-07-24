const { relativeDir, readJSONFile, appendJSONFile, getJSONFileRandom } = require('./myutil.js');
const path = require('path');
const jscs = require('jscodeshift');
const { createFindCallFn, createFindMemberExprObject } = require('./ast');
// const { entry, requireMapPath, output, filesTransDir} = require('./config.js');
const { entry, requireMapPath, output, filesTransDir, quote_file } = process.env;
const { createMemberExpression } = require('./myutil.js');

const requireMap = readJSONFile(requireMapPath);
const fileName = getJSONFileRandom(filesTransDir);
const quoteMap = { ...requireMap};

const replaceProvidesWithEntryImport = (root, filePath) => {
    const findFn = createFindCallFn('goog.provide');
    let isEntryFile = false;
    let importEntry = [];
    const afterImport = [];
    root.find(jscs.CallExpression, findFn).forEach((path, idx, paths) => {
        const args = path.value.arguments;
        const statement = args[0].value;
        isEntryFile = statement === entry;
        const hadAssign = root.find(jscs.AssignmentExpression, {
            left: createFindMemberExprObject(statement)
        })
        if (!hadAssign.length) {
            const memberExpr = createMemberExpression(statement);
            if (memberExpr) {
                const expr = jscs.expressionStatement(
                    jscs.assignmentExpression('=',
                        createMemberExpression(statement),
                        jscs.objectExpression([]))
                        );
                afterImport.push(expr)
            }
        }
        jscs(path).remove();
    });

    const indexPath = path.resolve(requireMap[entry], '..', output)
    const entryPath = relativeDir(indexPath, filePath);
    importEntry.push(jscs.importDeclaration(
        [jscs.importDefaultSpecifier(jscs.identifier(entry))],
        jscs.literal(entryPath)
    ));
    if (isEntryFile) {
        const quotePath = path.resolve(requireMap[entry], '..', quote_file)
        const quoteImportPath = relativeDir(quotePath, filePath);
        const expr = jscs.importDeclaration(
            [],
            jscs.literal(quoteImportPath)
        )
        expr.isEntryFile = true;
        afterImport.push(expr);
    }
    const program = root.find(jscs.Program).get().value;
    program.body = importEntry.concat(program.body);
    return afterImport;
};
const exportEntry = (root) => {
    const expr = jscs.exportDefaultDeclaration(jscs.identifier(entry));
    const program = root.find(jscs.Program).get().value;
    program.body.push(expr);
}
const replaceRequireWithImport = (root, filePath, afterImport =[]) => {
    const findFn = createFindCallFn('goog.require');
    let lastRequire;
    let ifImportGoog = false;
    root.find(jscs.CallExpression, findFn).forEach((path, idx, paths) => {
        const args = path.value.arguments;
        const statement = args[0].value;
        if (requireMap[statement]) {
            const usePath = relativeDir(requireMap[statement], filePath)
            const expr = jscs.importDeclaration([], jscs.literal(usePath))
            jscs(path.parent).replaceWith(expr);
            quoteMap[statement] = true;
            lastRequire = path.parent;
        } else if(/goog/.test(statement)){
            jscs(path).remove();
            ifImportGoog = true;
        } else {
            // console.warn('replaceRequireWithImport', requireMap[statement], 'not exist')
        }
    });
    // use goog but not import
    if (!ifImportGoog) {
        root.find(jscs.Identifier, (node) => {
            if (node.name === 'goog') {
                ifImportGoog = true;
                return;
            }
        })
    }
    if (afterImport.length) {
        if (!afterImport[0].isEntryFile) {
            afterImport[0].comments = [jscs.commentBlock('*\n * namespace declare \n ')];
        }
        if (lastRequire) {
            afterImport.reverse().forEach((expr, i, arr) => {
                jscs(lastRequire).insertAfter(expr);
            })
        } else {
            const program = root.find(jscs.Program).get().value;
            const [first, ...arr] = program.body;
            program.body = [first, ...afterImport, ...arr];
        }
    }
    if (ifImportGoog) {
        const googPath = path.resolve(requireMap[entry], '..', 'goog-lib.js');
        const googImportPath = relativeDir(googPath, filePath);
        const googImport = jscs.importDeclaration(
            [jscs.importDefaultSpecifier(jscs.identifier('goog'))],
            jscs.literal(googImportPath)
        );
        const program = root.find(jscs.Program).get().value;
        const [first, ...arr] = program.body;
        program.body = [first, googImport, ...arr];
    }
}

module.exports = (file, api, options) => {
    const root = jscs(file.source);
    const filePath = path.resolve(file.path);
    const afterImport = replaceProvidesWithEntryImport(root, filePath);
    exportEntry(root);
    replaceRequireWithImport(root, filePath, afterImport);
    appendJSONFile(fileName, quoteMap)
    return root.toSource();
}

