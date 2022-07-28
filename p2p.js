const WebSocket = require("ws");
const MessageType = require("./msg");

class P2PServer {
  constructor(blockchain) {
    this.sockets = [];
    this.blockchain = blockchain;
  }

  listen() {
    const server = new WebSocket.Server({ port: 7545 });
    server.on("connection", (socket, req) => {
      console.log(
        `webSocket connection ${req.socket.remoteAddress}:${req.socket.remotePort}`
      );
      this.connectSocket(socket);
    });
  }

  connectToPeer(newPeer) {
    const socket = new WebSocket(newPeer);
    socket.on("open", () => {
      this.connectSocket(socket);
    });
  }

  connectSocket(socket) {
    this.sockets.push(socket);
    this.messageHandler(socket);
    const data = {
      type: MessageType.latest_block,
      payload: {},
    };
    this.send(socket, data);
  }

  getSockets() {
    return this.sockets;
  }

  messageHandler(socket) {
    const callback = (message) => {
      const result = JSON.parse(message.toString());
      switch (result.type) {
        case MessageType.latest_block: {
          console.log(0);
          // 내용
          const message = {
            type: MessageType.all_block,
            payload: this.blockchain.getLastBlock(),
          };
          this.send(socket, message);
          break;
        }
        case MessageType.all_block: {
          console.log(1);
          const message = {
            type: MessageType.receivedChain,
            payload: this.blockchain.blockchain,
          };
          const receivedBlock = result.payload;
          const isSuccess = this.blockchain.addBlock(receivedBlock);
          if (!isSuccess) break;

          this.send(socket, message);
          break;
        }
        case MessageType.receivedChain: {
          console.log(2);
          const receivedChain = result.payload;
          this.blockchain.handleChainResponse(receivedChain, this.broadcast);
          break;
        }
        case MessageType.receivedTx: {
          break;
        }
      }
    };
    socket.on("message", callback);
  }

  broadcast(data) {
    this.sockets.forEach((socket) => socket.send(JSON.stringify(data)));
  }

  send(socket, message) {
    return socket.send(JSON.stringify(message));
  }
}

module.exports = P2PServer;
