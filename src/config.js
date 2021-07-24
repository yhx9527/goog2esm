const path = require('path');
const distDir = path.join(__dirname, '../dist')
module.exports = {
    distDir: distDir,
    filesTransDir: path.join(distDir, 'filesTrans'),
    requireMapPath: path.join(distDir, 'requireMap.json'),
    quoteMapPath: path.join(distDir, 'quoteMap.json'),
    workspaceAbsPath: process.cwd(),
    pendingDirs: [],
    entry: '',
    quote_file: '_quote_.js',
    output: '_transfer_.js',
}