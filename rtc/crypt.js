import crypto from 'crypto';
import config from "./config.json" assert {type:"json"};
const enc = (json_message,type) => {
   try {
      var obj = {data:json_message,type:type,applytimes_germany:new Date().getTime()};
      let cipher = crypto.createCipheriv(config.auth.mode, Buffer.from(config.auth.key),config.auth.iv);
      let encrypted = cipher.update(JSON.stringify(obj));
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      return encrypted.toString("base64");
   } catch {
      return 0;
   }
}
const dec = (encoded) => {
//    try {
       let decipher = crypto.createDecipheriv(config.auth.mode,config.auth.key,config.auth.iv);
       let decrypted = decipher.update(Buffer.from(encoded,"base64"));
       let data = JSON.parse(Buffer.concat([decrypted, decipher.final()]));
       return [data["data"],data["type"] ? data["type"] : null];
//    } catch {
//        return 0;
//    }
};
export default {enc,dec};
