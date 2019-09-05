const fs = require('fs');
const { getUUID } = require('js-knife');

class XiaoYangTou {

  // path 文件保存的位置
  // createPath 实例化 xyt 时，检测 path 存在与否，不存在则创建目录
  constructor(path, maxSize){
    if(!path)
      throw Error('未指定文件存储路径');
    if(path[path.length-1] != '\\')
      path += '\\';
    this.path = path;
    let pathExist = fs.existsSync(path);
    if(!pathExist)
      fs.mkdirSync(path, { recursive: true });

    if(maxSize)
      this.maxSize = maxSize;
  }

  save(incomingMessage){
    // 因为，要把接收到的数据的“数据描述部分”删掉（第一次收到的数据的前几行，和最后一次收到数据的后几行）
    // 因此，要判断当前 chunk 是不是第一段，是不是最后一段
    // 第一段好辨识，第一次接收到的就是，最后一段应当是 end 事件被触发时，最后一次收到的数据
    // 如果在 onData 里存数据，那么“是否是最后一个 chunk”则无法判断
    // 因此这里采用，“下一次 onData 存上一次 chunk” 的方案
    return new Promise( (resolve,reject) => {
      let contentLength = incomingMessage.headers['content-length']; // 此处有两种偏差：1，http 报文里声称的文件大小不可信；2，第一段 chunk 的前段和最后一段 chunk 的后段有非文件内容。另外，10进制与2进制的文件尺寸表示法也可能造成误解
      if(contentLength == 0){
        reject(Error('没有数据'));
        return;
      }else if(this.maxSize&&contentLength>this.maxSize){
        reject(Error('文件太大了：'+contentLength));
        return;
      }
      let last; // 存 “上一次的 chunk”
      let state = 0; // 0 表示未接收到数据
      let fileName;
      incomingMessage.on('data', chunk => {
        if(state == 0){
          state = 1; // 1 标记收到第一段
          let {data, suffix} = getDataAndSuffixFromFirstChunk(chunk);
          last = data;
          fileName = getUUID() + suffix;
        }else{
          state = 2; // 2 标记收到好多段（大于一段）
          // 如果不是第一次，就把上次的数据存起来
          write(last, this.path + fileName, reject);
          last = chunk;
        }
      });
      incomingMessage.on('end', () => {
        if(!last){
          reject(Error('没有数据'));
          return;
        }
        let data = getDataFromLastChunk(last);
        write(data, this.path + fileName, reject);
        resolve(fileName);
      });
      incomingMessage.on('close', () => {
        fs.unlinkSync(this.path + fileName);
        reject(Error('文件传输中断, 文件未保存'));
      });
    })
  }
}

function write(chunk, file, handleError){
  try{
    fs.writeFileSync(file, chunk, { flag: 'a' });
  }catch(e){
    handleError(e);
  }
}

function getDataFromLastChunk(chunk){
  for(let i=chunk.length-5; i>0; i--)
    if(chunk[i]==10&&chunk[i-1]==13)
      return chunk.slice(0, i-1);
}

function getDataAndSuffixFromFirstChunk(chunk){
  let dataStartIndex; // 标记 数据 开始的地方
  let row2Start;
  let suffix;
  for(let i=0, len=chunk.length, rowNo=0; i<len; i++){ // rowNo 是行号
    if(chunk[i]==13&&chunk[i+1]==10){ // 检测到换行符
      rowNo++;
      if(rowNo ==1 ){
        row2Start= i+2;
      }else if(rowNo == 2){
        // 此时的 i 是 row2End
        suffix = getSuffixFromRow2(chunk.slice(row2Start, i).toString());
      }else if(rowNo == 3){
        dataStartIndex = i+4; // 第四行是空行，第五行开始是数据，那么从第三行换行符开始，还有一个换行符才到第五行
        break;
      }
    }
  }
  return {
    suffix,
    data: chunk.slice(dataStartIndex)
  }
}

function getSuffixFromRow2(row2){
  let lastDot = row2.lastIndexOf('.');
  if(lastDot == -1)
    return '';
  let lastDoubleQuotation = row2.length - 1;
  return row2.slice(lastDot, lastDoubleQuotation);
}

module.exports = XiaoYangTou;