const express = require('express');
const path = require('path');
const { createChunkBuffer } = require('./utilities');
const app = express();

app.use('/public', express.static(path.join(__dirname, '..', 'public')));
app.get('/', (req,res)=>res.sendFile(path.join(__dirname,'..','index.html')));

app.get('/server/ping',(req,res)=>{
  if(req.query.load){
    const start = Date.now();
    while(Date.now() - start < 20){}
  }
  res.json({ts: Date.now()});
});

app.get('/server/testfile',(req,res)=>{
  const sizeMB = Math.min(100, Number(req.query.size)||20);
  res.setHeader('Content-Type','application/octet-stream');
  res.setHeader('Cache-Control','no-store');
  const chunk = createChunkBuffer(1);
  let sent = 0;
  function send(){
    if(sent >= sizeMB) return res.end();
    if(!res.write(chunk)){
      res.once('drain',()=>setImmediate(send));
    } else setImmediate(send);
    sent++;
  }
  send();
});

app.post('/server/upload', express.raw({type:'*/*', limit:'200mb'}),(req,res)=>{
  res.json({receivedBytes:req.body.length});
});

app.listen(3000,()=>console.log('speedtest-lite running http://localhost:3000'));
