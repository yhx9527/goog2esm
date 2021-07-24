const jscs = require('jscodeshift');
const {entry} = require('./config.js');
const getTypePath = (path, typeName) => {
    while (path && path.value && path.value.type !== typeName) {
        path = path.parent;
    }
    return path;
}
const clearExpr = (root, typeName) => {
    root.find(jscs.Identifier, { name: entry })
        .forEach((path) => {
            const p = getTypePath(path, typeName);
            if (p) {
                try {
                    jscs(p).remove();
                }catch(err) {
                    console.warn('remove failed')
                }
            }
        })
}

module.exports = (file) => {
    const root = jscs(file.source);
    clearExpr(root, 'ExpressionStatement');
    clearExpr(root, 'VariableDeclarator');
    clearExpr(root, 'FunctionDeclaration');
    return root.toSource();
}


