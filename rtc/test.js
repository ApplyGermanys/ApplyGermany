import a from './database.js';
a.get_user("123").then((res)=>{
    console.log(res)
}).catch((er)=>{console.log(er)})
