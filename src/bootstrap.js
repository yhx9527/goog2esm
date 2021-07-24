const path = require('path');
const shell = require('shelljs');
const step = Promise.resolve();
const CONF_NAME = 'goog2esm.config.js';
let isUndefined;
const isEmpty = (val) => {
    if (val == isUndefined) return true;
    if (val.length === 0) return true;
    if (Object.keys(val).length === 0) return true;
    return false;
}
const assignObj = (target, origin, keys) => {
    keys.forEach(key => {
        if (!isEmpty(origin[key])) {
            target[key] = origin[key]
        }
    })
}
const context = {};
const log = console.info;
step
.then(() => {
    log('reading config...');
    const externalConf = require(path.join(`${process.cwd()}`, CONF_NAME));
    return externalConf;
})
.catch((err) => {
    console.error(err)
    throw 'no goog2esm.config.js, please create it'
})
.then((conf) => {
    log('merging config...');
    if (conf.entry === isUndefined) throw 'entry is required';
    const myConf = require('./config.js');
    assignObj(myConf, conf, [
        'workspaceAbsPath',
        'pendingDirs',
        'entry',
        'quote_file',
        'output',
    ])
    Object.entries(myConf).forEach(([k, v]) => {
        process.env[k] = v;
    })
    context.conf = myConf;
})
.then(() => {
    log('startup...');
    //init
    const { distDir } = context.conf;
    if (!shell.test('-e', distDir)) {
        shell.mkdir(distDir);
    }
    shell.exec(`node ${__dirname}/removeConfigJson.js`)
})
.then(() => {
    log('generate a map to show namespace in which file')
    // generate a map to show namespace in which file
    const genRequireFiles = `npx jscodeshift -t ${__dirname}/genRequireFiles.js`;
    const { workspaceAbsPath, pendingDirs} = context.conf;
    let assetStr = pendingDirs.map(dir => path.join(workspaceAbsPath, dir)).join(' ');
    if (!assetStr) {
        assetStr = workspaceAbsPath;
    }
    const mergeFiles = `node ${__dirname}/mergeJsonFiles.js requireMap`;
    const cmd = `${genRequireFiles} ${assetStr} && ${mergeFiles}`
    shell.exec(cmd);
    return assetStr;
})
.then((assetStr) => {
    log('transform goog to import')
    // transform goog to import
    const goog2esm = `npx jscodeshift -t ${__dirname}/goog2esm.js`;
    const genUnlinkVarMap = `node ${__dirname}/mergeJsonFiles.js quoteMap`;
    const cmd = `${goog2esm} ${assetStr} && ${genUnlinkVarMap}`
    shell.exec(cmd);
})
.then(() => {
    log('generate unlinkVar file and transfer file')
    // generate unlinkVar file and transfer file
    const cmd = `node ${__dirname}/genOutput.js`;
    shell.exec(cmd);
})