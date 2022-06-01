const express = require("express");
const Blockchain = require("./blockchain");
const app = express();
const cors = require("cors");
const WebSocket = require("ws");
const ip = require("ip");
const Transaction = require("./transaction");
const Block = require("./block");

const blockchain = new Blockchain();

let mining;
let wsPort = 8080;

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/stop", (req, res) => {
  console.log("채굴종료");
  mining = false;
  res.json("채굴종료");
});

app.post("/tx", (req, res) => {
  console.log("트랜잭션 전송");
  let { tx } = req.body;
  tx = { from: ip.address(), to: "B", amount: 10 };
  blockchain.addTx(new Transaction(tx));
  broadcast(JSON.stringify({ type: "TX", tx: tx }));
  res.json("트랜잭션 전송");
});

app.get("/txList", (req, res) => {
  console.log(blockchain.mempool);
  res.json(blockchain.mempool);
});

app.get("/blocks", (req, res) => {
  res.json(blockchain.blockchain);
});

app.get("/mining", async (req, res) => {
  const miner = req.query.miner;
  if (!mining) {
    res.json("채굴시작");
    mining = true;
    while (mining) {
      const newBlock = await blockchain.mining(miner);
      blockchain.addBlock(newBlock);
      broadcast(JSON.stringify({ type: "BLOCK", block: newBlock }));
    }
  } else {
    res.json("채굴중...");
  }
});

app.get("/network", (req, res) => {
  let { peer } = req.body;
  /* //TODO 나중에 삭제
  peer = "ws://localhost:8080"; */
  const ws = new WebSocket(peer);

  ws.on("open", () => {
    console.log("Open");
    // 노드끼리 서로 소켓연결 진행 (새로들어온 노드와 기존노드간의 연결)
    ws.send(
      JSON.stringify({ type: "WSS", url: `ws://${ip.address()}:${wsPort}` })
    );
  });

  ws.on("message", (message) => {
    const msg = JSON.parse(message.toString());
    console.log("msg", msg);
    switch (msg.type) {
      // 노드가 처음으로 네트워크 연결 시 블록체인 다운로드
      case "BLOCKCHAIN":
        console.log("첫노드 블록체인 다운로드");
        if (blockchain.isValidBlockchain(msg.blockchain)) {
          blockchain.blockchain = msg.blockchain;
        }
        break;
      case "TX":
        console.log("트랜잭션 추가");
        blockchain.addTx(new Transaction(msg.tx));
        break;
      case "BLOCK":
        console.log("블록 추가");
        blockchain.addBlock(new Block(msg.block));
        break;
    }
  });

  res.json("블록체인 네트워크에 연결 성공");
});

app.listen(3001, () => {
  console.log("Connected 3001port!");
});

/* --------------------  network ----------------------------- */

const wss = new WebSocket.Server({ port: wsPort });
let wsClient;

wss.on("connection", (ws, req) => {
  console.log(`${req.socket.remoteAddress}가 연결되었습니다!`);
  ws.on("message", onMessage);
  ws.send(
    JSON.stringify({ type: "BLOCKCHAIN", blockchain: blockchain.blockchain })
  );
});

function onMessage(message) {
  const msg = JSON.parse(message.toString());
  switch (msg.type) {
    case "WSS": // 새로 온 노드와 연결하는 부분 -> 같은 websocket server를 보고 있으므로 주석처리
      wsClient = new WebSocket(msg.url);
      wsClient.on("open", () => {
        console.log("wsclient open:", msg.url);
      });
      break;
  }
}

function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function broadcastWithoutMe(ws, message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && ws !== client) {
      client.send(message);
    }
  });
}
