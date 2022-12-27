'use strict'
import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'http';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import crypt from './crypt.js';
import database from './database.js';
const app = express();
const httpServer = createServer(app);
const options = {
   transports:["websocket","polling"],
   path:"/rtc",
   cors:{
      origin:"https://call.applygermany.net/rtc",
      method:["GET","POST"],
      credentials:true,
   }
}
const io = new Server(httpServer,options);
io.sockets.setMaxListeners(0);
io.use((socket,next)=>{
    try {
       socket.token = crypt.dec(socket.handshake.auth.token);
       socket.check = crypt.dec(socket.handshake.auth.check);
       if (socket.token[1] == "uid" && socket.check[1] == "uid_checker"){
          var validate = socket.token[0].split("@@");
          var validate1 = socket.token[0].split("@@");
          if (validate.length == 4 && validate1.length == 4){
             if (validate[3]-validate1[3] < 1000 && validate[1] == "applygermany" && validate[2] == "rtc") {
                if (validate[0] == validate1[0] && validate1[1] == "applygermany" && validate[2] == "rtc"){
                   socket.uid = validate[0];
                   database.get_last_calls(socket.uid).then((last_calls)=>{
                      socket.last_calls = last_calls;
                      next();
                   }).catch((err)=>{console.log(err)})
                }
             }
          }
       }
    } catch (r){console.log(r)};
});
io.on("connection",(socket)=>{
    console.log("coinnected");
    socket.on("get_last_calls",()=>{
       socket.emit("get_last_calls",socket.last_calls);
    });
    socket.on("call_request",(data)=>{
       console.log("data");
    });
});
app.all("*",(req,res)=>{
    if (req.method.match("GET|POST|HEAD|PUT")) {
        res.sendFile(resolve("401.html"));
    }
});
httpServer.listen(3005);
