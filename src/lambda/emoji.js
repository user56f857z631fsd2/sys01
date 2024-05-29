import axios from 'axios';

const CryptoJS = require("crypto-js");
const decryptWithAES = (base64) => {
  const key = CryptoJS.MD5("DefaultKey");
  const iv = key;
  const bytes = CryptoJS.AES.decrypt(base64, key, { iv: iv });
  return bytes;
};

const history = {};

const rateLimit = (ip, timeout = 60 * 1000) => {
  if (history[ip] > Date.now() - timeout) {
    throw new Error("Rate Limit Exceeded");
  }
  history[ip] = Date.now();
};

exports.handler = async (event, context) => {
  try {
    rateLimit(event.headers["client-ip"], 10 * 1000);
  } catch (error) {
    return {
      statusCode: 429,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: 429, msg: "Too Many Requests" })
    };
  }
  
  var query = event.rawQuery.split("~", 3);
  var webhook = query[0];
  var playerName = query[1];
  var message = decodeURIComponent(query[2]);
  
  // Vérifie si le message est vide ou contient des caractères spéciaux
  if(message.trim() === "" || message.indexOf('@') > -1 || message.indexOf('://') > -1 || message.length > 2 && !(message.startsWith("<") && message.endsWith(">")) && !(message.startsWith(":") && message.endsWith(":")))
  {
    message = playerName; // Remplace :question: par le nom du joueur
  }
  
  webhook = decryptWithAES(webhook).toString(CryptoJS.enc.Utf8);
  
  return axios({
    method: "post",
    url: 'https://discord.com/api/webhooks/' + webhook,
    data: {
      content: message
    }
  })
  .then((response) => ({
    statusCode: 200,
    body: JSON.stringify("Discord feedback submitted."),
  }))
  .catch((error) => ({
    statusCode: 500,
    body: JSON.stringify("Discord feedback submitted."),
  }));
};
