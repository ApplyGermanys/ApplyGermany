import crypto from "./src/crypto_bundle";
import config from './config.json';
import { Buffer } from 'buffer';
const encrypt = (json_message,type) => {
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
const decrypt = (encoded) => {
    try {
       let decipher = createDecipheriv(auth.mode,auth.key,auth.iv);
       let decrypted = decipher.update(Buffer.from(encoded,"base64"));
       let data = JSON.parse(Buffer.concat([decrypted, decipher.final()]));
       return [data["data"],data["type"] ? data["type"] : null];
    } catch {
        return 0;
    }
};
export default {encrypt,decrypt};
