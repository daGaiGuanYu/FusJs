const http = require('http');
const xyt = require('xyt');

const filePosition = 'C:\\static';
const fileWriter = new xyt(filePosition);

function handler(request, response){
  fileWriter.save(request).then( fileName => {
    console.log('文件已保存');
    response.end(fileName);
  }).catch( e => {
    response.end(e.message);
  });
}

http.createServer(handler).listen(1234);
console.log('正在测试，http://localhost:1234');
