const jscs = require('jscodeshift');
const path = require('path');
const fs = require('fs');
const {readJSONFile, relativeDir} = require('./myutil');
// const { entry, requireMapPath, quoteMapPath, quote_file, output} = require('./config.js');
const { entry, requireMapPath, quoteMapPath, quote_file, output } = process.env;
const quoteMap = readJSONFile(quoteMapPath);
const requireMap = readJSONFile(requireMapPath);

const entryPath = requireMap[entry];
function genQuoteFile() {
    const noQuoteList = Object.values(quoteMap).filter(i => i !== true)
    if (!noQuoteList.length) return;
    const program = jscs.program([]);
    const usePathSet = new Set();
    noQuoteList.forEach(filePath => {
        const usePath = relativeDir(filePath, entryPath);
        if (usePath === './') {
            return;
        }
        usePathSet.add(usePath)
    })
    for (const p of usePathSet) {
        const expr = jscs.importDeclaration([], jscs.literal(p));
        program.body.push(expr);
    }
    const fileSource = jscs(program).toSource();
    const filePath = path.resolve(entryPath, '..', quote_file);
    fs.writeFileSync(filePath, `${fileSource}\n`, 'utf8');
}
function genIndexFile() {
    const filePath = path.resolve(entryPath, '..', output);
    if (fs.existsSync(filePath)) {
        console.warn('Entry file naming conflict', filePath);
        return;
    }
    const program = jscs.program([]);
    let parentNoDeclare = findParentNoDeclare(quoteMap);
    const noDeclareVari = iterDeclare(parentNoDeclare);
    // const Blockly = {};
    const expr1 = jscs.variableDeclaration('const', 
        [jscs.variableDeclarator(
            jscs.identifier(entry), 
            jscs.objectExpression(noDeclareVari)
        )])
    // export default Blockly;
    const expr2 = jscs.exportDefaultDeclaration(
        jscs.identifier(entry)
    )
    program.body.push(expr1, expr2);
    const fileSource = jscs(program).toSource();
    fs.writeFileSync(filePath, `${fileSource}\n`, 'utf8');
}

function findParentNoDeclare(declareMap) {
    const parentNoDeclare = new Set();
    Object.keys(declareMap).map(k => {
        const temp = k.split('.');
        if (temp.length > 2) {
            const parent = temp.slice(0, -1).join('.');
            if (typeof declareMap[parent] === 'undefined') {
                parentNoDeclare.add(temp.slice(1, -1).join('.'));
            }
        }
    });
    return [...parentNoDeclare].map(i => i.split('.'));
}
function iterDeclare(arr) {
    return arr.reverse().map(vari => {
        return vari.reduce((acc, cur)=>{
            const temp = acc ? [acc] : []
            return jscs.property(
                'init',
                jscs.identifier(cur),
                jscs.objectExpression(temp)
            )
        }, undefined)
    })
}
function cpGoogLib() {
    const sourcePath = path.join(__dirname, './goog-lib.js');
    const destPath = path.resolve(entryPath, '../goog-lib.js');
    fs.copyFileSync(sourcePath, destPath);
}
genQuoteFile();
genIndexFile();
cpGoogLib();