const express = require("express");
const Blockchain = require("./blockchain");
const app = express();
const cors = require("cors");
const ip = require("ip");
const Transaction = require("./transaction");
const P2PServer = require("./p2p");
const MessageType = require("./msg");

const blockchain = new Blockchain();
const ws = new P2PServer(blockchain);

let mining;

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
  tx = new Transaction({ from: ip.address(), to: "B", amount: 10 });
  blockchain.addTx(tx);
  // 트랜잭션 broadcast
  const message = {
    type: MessageType.receivedTx,
    payload: tx,
  };
  ws.broadcast(message);
  res.json(tx);
});

app.get("/txList", (req, res) => {
  console.log(blockchain.mempool);
  res.json(blockchain.mempool);
});

app.get("/blocks", (req, res) => {
  res.json(blockchain.blockchain);
});

app.get("/getSockets", (req, res) => {
  res.json(ws.getSockets());
});

app.get("/mining", async (req, res) => {
  const miner = req.query.miner;
  if (!mining) {
    res.json("채굴시작");
    mining = true;
    while (mining) {
      const newBlock = await blockchain.mining(miner);
      blockchain.addBlock(newBlock);
      const msg = {
        type: MessageType.latest_block,
        payload: {},
      };
      ws.broadcast(msg);
    }
  } else {
    res.json("채굴중...");
  }
});

app.post("/addToPeer", (req, res) => {
  const { peer } = req.body;
  ws.connectToPeer(peer);
  res.json(`${peer} 연결 성공`);
});

app.listen(3000, () => {
  console.log("Connected 3000port!");
  ws.listen();
});
