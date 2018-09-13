// This overrides the jest buffer's prototype for compatability with nacl
Object.setPrototypeOf(global.Buffer.prototype, global.Uint8Array.prototype);

class psuedoRes {
  constructor(callback) {
    this.sendCallback = callback;
  }
  status(val) {
    return this;
  }
  send(val) {
    return this.sendCallback(val);
  }
}

function dec(stringifiedObject) {
  if (typeof atob === 'undefined') {
    let buffer = Buffer.from(stringifiedObject, 'base64');
    return new Uint8Array(Array.prototype.slice.call(buffer, 0));
  } else {
    const decodedB64 = atob(stringifiedObject);
    const arr = new Uint8Array(decodedB64.length);
    for (let i = 0; i < decodedB64.length; i++) {
      arr[i] = decodedB64.charCodeAt(i);
    }
    return arr;
  }
}

global.signObject = (messageObject, secretKey) => {
  const stringifiedObject = JSON.stringify(messageObject);
  const msg = dec(stringifiedObject);
  const signed = require('tweetnacl').sign.detached(msg, secretKey);
  return JSON.stringify(Array.from(signed));
};

global.psuedoRes = psuedoRes;
