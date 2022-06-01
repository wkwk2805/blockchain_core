class Message {
  static SEND_BLOCK = 2;
  static SEND_TX = 1;
  static INIT = 0;
  static REQUEST_BLOCKCHAIN = 3;
  static RESPONSE_BLOCKCHAIN = 4;

  constructor(type, data) {
    this.type = type;
    this.data = data;
  }

  toString() {
    return JSON.stringify({ type: this.type, data: this.data });
  }
}

module.exports = Message;
