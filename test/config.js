// This overrides the jest buffer's prototype for compatability with nacl
Object.setPrototypeOf(global.Buffer.prototype, global.Uint8Array.prototype);
