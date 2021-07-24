const {appendJSONFile, readJSONDir, deleteDir, readJSONFile} = require('./myutil');
// const {requireMapPath, quoteMapPath, filesTransDir} = require('./config');
const { requireMapPath, quoteMapPath, filesTransDir } = process.env;

switch (process.argv.slice(2)[0]) {
    case 'requireMap':
        {
            const data = readJSONDir(filesTransDir);
            appendJSONFile(requireMapPath, data);
            break;
        }
    case 'quoteMap':
        {
            const data = readJSONDir(filesTransDir, (obj, data) => {
                Object.entries(data).forEach(([key, val])=>{
                    if (val === true) {
                        obj[key] = val;
                    }
                })
            });
            const all = readJSONFile(requireMapPath);
            appendJSONFile(quoteMapPath, Object.assign(all, data));
            break;
        }
}
deleteDir(filesTransDir);

