const { deleteFile, deleteDir} = require('./myutil');
// const {requireMapPath, quoteMapPath, filesTransDir} = require('./config');
const { requireMapPath, quoteMapPath, filesTransDir } = process.env;

deleteFile(requireMapPath);
deleteFile(quoteMapPath);
deleteDir(filesTransDir);