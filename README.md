# XiaoYangTouJs
+ 把 request 对象（即 http.IncomingMessage）里的文件存到硬盘某处
+ 一次只允许保存一个文件

# 如何使用
### 安装
```bash
$ npm install xyt
```

### 在项目中使用
``` javascript
const http = require('http');
const xyt = require('xyt');

const filePosition = 'C:\\static';
const fileWriter = new xyt(filePosition); // 实例化只需要一个存储路径（绝对路径）

function handler(request, response){
  fileWriter.save(request).then( fileName => {
    console.log('文件已保存');
    response.end(fileName);
  }).catch( e => {
    response.end(e.message);
  });
}

http.createServer(handler).listen(1234);
```

### 待解决的问题
+ 文件大小限制
