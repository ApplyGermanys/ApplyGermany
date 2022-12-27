// Call table creation :
// CREATE TABLE calls (     id int not null primary key auto_increment,     uid VARCHAR(256) not null,     missed boolean not null,     call_to varchar(255) not null,     call_by varchar(255) not null,     call_time datetime not null,     call_seconds time not null );
'use strict'
import mysql from 'mysql';
import config from './config.json' assert {"type":"json"};
function newConnection(){
   var connections = mysql.createConnection({
      host:"localhost",user:config.database.username,password:config.database.password,
      database:config.database.database,socketPath:"/run/mysqld/mysqld.sock"
   });
   return connections;
}
function connect(query){
   return new Promise((resolve,reject)=>{
      try {
         var connection = newConnection();
         connection.connect((err)=>{
            if (err){
               connection.destroy();
               reject(err);
            };
            connection.query(query,(err,result,fields)=>{
               if (err){
                  connection.destroy();
                  reject(err);
               };
               connection.destroy();
               resolve(result);
            });
         });
      } catch {
         connection.destroy();
         reject(0);
      }
   });
};
function get_last_calls(uid){
   const query = "select * from calls where uid ='"+uid+"';";
   return new Promise((resolve,reject)=>{
      connect(query).then((result)=>{resolve(result)}).catch((err)=>{reject(err)})
   });
}
function register(uid){
   const query = "insert into users (uid,time) values ()";
   
}
function get_user(uid){
   const query = "select * from users where uid ='"+uid+"';";
   return new Promise((resolve,reject)=>{
      connect(query).then((result)=>{
         if (result.length > 0){
            resolve(result);
         } else {
            resolve(0);
         }
      }).catch((err)=>reject(err))
   });
}
export default {get_last_calls,get_user};
