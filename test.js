class haha{
  constructor(name, flag){
    this.name = name;
    if(flag)
      return;
    this.flag = flag;
  }
}

let h = new haha(1,0);
console.log(JSON.stringify(h));