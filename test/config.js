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

global.psuedoRes = psuedoRes;
