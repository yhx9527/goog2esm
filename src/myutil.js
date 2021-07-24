const fs = require('fs');
const jscs = require('jscodeshift');
const path = require('path');

function relativeDir(relative, absolute) {
    var rela = relative.split('/');
    rela.shift();
    var abso = absolute.split('/');
    abso.shift();

    var num = 0;

    for (var i = 0; i < rela.length; i++) {
        if (rela[i] === abso[i]) {
            num++;
        } else {
            break;
        }
    }

    rela.splice(0, num);
    abso.splice(0, num);

    var str = '';

    for (var j = 0; j < abso.length - 1; j++) {
        str += '../';
    }

    if (!str) {
        str += './';
    }

    str += rela.join('/');

    return str;
}

function appendJSONFile(file, obj) {
    let data = obj;
    try {
        if (fs.existsSync(file)) {
            data = fs.readFileSync(file, 'utf8');
            data = JSON.parse(data);
            Object.assign(data, obj);
        }
        fs.writeFileSync(file, JSON.stringify(data, null, 4))
    } catch(err) {
        console.warn('appendJSONFile err', err)
    }
}
function readJSONFile(file) {
    if (fs.existsSync(file)) {
        let data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    }
    return null;
}
function writeJSONFile(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 4))
}
function deleteFile(file) {
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
    }
}
function getJSONFileRandom(dir) {
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    } catch(err) {
        console.warn('getJSONFileRandom', err)
    }
    return path.resolve(dir, Date.now()+'.json');
}
function readJSONDir(dir, callback) {
    const files = fs.readdirSync(dir);
    const obj = {};
    if (typeof callback !== 'function') {
        callback = (obj, data) => {
            return Object.assign(obj, data);
        }
    }
    files.forEach(file=>{
        const data = readJSONFile(path.resolve(dir, file));
        if (data) {
            callback(obj, data)
        }
    })
    return obj;
}
function deleteDir(dir) {
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir)
        files.forEach((file) => {
            const nextFilePath = `${dir}/${file}`
            const states = fs.statSync(nextFilePath)
            if (states.isDirectory()) {
                //recurse
                deleteDir(nextFilePath)
            } else {
                //delete file
                fs.unlinkSync(nextFilePath)
            }
        })
        fs.rmdirSync(dir)
    }
}
const createMemberExpression = (path) => {
    const pathParts = Array.isArray(path) ? path : path.split('.');
    return pathParts.reduce((expr, current, idx, arr) => {
        if (arr.length > idx + 1) {
            if (!expr) {
                expr = jscs.memberExpression(jscs.identifier(arr[idx]), jscs.identifier(arr[idx + 1]));
            } else {
                expr = jscs.memberExpression(expr, jscs.identifier(arr[idx + 1]));
            }
        }

        return expr;
    }, undefined);
};

module.exports = {
    relativeDir,
    appendJSONFile,
    readJSONFile,
    writeJSONFile,
    deleteFile,
    getJSONFileRandom,
    readJSONDir,
    deleteDir,
    createMemberExpression,
}