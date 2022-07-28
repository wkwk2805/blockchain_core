const Block = require("./block");
const { BN } = require("bn.js");
const Transaction = require("./transaction");
const MessageType = require("./msg");

// 블록체인 설계도
class Blockchain {
  constructor(blockchain) {
    // 기존 블록체인이 존재하지 않으면 제네시스 블록을 넣어서 초기화 한다
    this.blockchain = blockchain || [Block.getGenesis()];
    this.mempool = [];
  }

  // 트랜잭션 멤풀에 추가
  addTx(tx) {
    this.mempool.push(tx);
  }

  // 블록을 블록체인에 추가
  addBlock(block) {
    const oldBlock = this.blockchain[this.blockchain - 1];
    if (this.isValidBlock(oldBlock, block)) {
      this.blockchain.push(block);
      console.log("추가된 블록", block);
      return true;
    } else {
      console.log("유효하지 않은 블록입니다.");
      return false;
    }
  }

  slowResolve() {
    return new Promise((resolve) => setTimeout(resolve.bind(), 0));
  }

  // 채굴
  async mining(miner) {
    // Coinbase 트랜잭션
    const coinbaseTx = new Transaction({
      from: "COINBASE",
      to: miner,
      amount: 50,
    });
    // 멤풀에 있는 트랜잭션리스트들을 블록에 담기 위해 가져옴
    const transactions = [coinbaseTx, ...this.mempool];
    // 멤풀 초기화
    this.mempool = [];
    // 마지막 블록 가져오기
    const lastBlock = this.blockchain[this.blockchain.length - 1];
    // 마지막 블록 해시는 새로 만들어질 블록의 이전해시이다
    const preHash = lastBlock.hash;
    // 목표값을 위한 난이도
    const newDifficulty = this.getDifficulty(lastBlock.difficulty);
    // 블록 넘버
    const index = lastBlock.index;
    // 새로운 블록 만들기
    const newBlock = new Block({
      index: index + 1,
      preHash: preHash,
      timestamp: Date.now(),
      transactions: transactions,
      difficulty: newDifficulty,
      nonce: 0,
    });
    // 새로운 난이도 계산
    newBlock.difficulty = newDifficulty;
    // 해시값과 목표값을 비교해서 목표값보다 해시값이 작을경우 블록을 생성하도록 되어있음!
    const target = this.getTarget(newDifficulty);
    while (!(newBlock.getHash() <= target)) {
      // nonce를 단조증가 시킨다
      newBlock.nonce++;
      await this.slowResolve();
    }
    // 목표 해시값 넣어주기
    newBlock.hash = newBlock.getHash();
    // 채굴이 끝난 블록 리턴
    return newBlock;
  }

  getDifficulty(difficulty) {
    const lastBlock = this.blockchain[this.blockchain.length - 1];
    if (lastBlock.index > 0 && lastBlock.index % 10 == 0) {
      console.log("난이도 조절 시작");
      let prevTime = this.blockchain[this.blockchain.length - 10].timestamp;
      let lastTime = lastBlock.timestamp;
      let avgTime = (lastTime - prevTime) / 10 / 1000; // 초
      let multiple = avgTime < 20 ? 4 : 1 / 4;
      difficulty = difficulty * multiple;
      console.log("변경된 난이도", difficulty);
    }
    return difficulty;
  }

  // 타겟 구하기
  getTarget(difficulty) {
    let bits = this.difficultyToBits(difficulty);
    let bits16 = parseInt("0x" + bits.toString(16), 16);
    let exponent = bits16 >> 24;
    let mantissa = bits16 & 0xffffff;
    let target = mantissa * 2 ** (8 * (exponent - 3));
    let target16 = target.toString(16);
    let k = Buffer.from("0".repeat(64 - target16.length) + target16, "hex");
    return k.toString("hex");
  }

  // 난이도를 통해서 비트구하기
  difficultyToBits(difficulty) {
    const maximumTarget = "0x00ffff000000" + "0".repeat(64 - 12);
    const difficulty16 = difficulty.toString(16);
    let target = parseInt(maximumTarget, 16) / parseInt(difficulty16, 16);
    let num = new BN(target.toString(16), "hex");
    let compact, nSize, bits;
    nSize = num.byteLength();
    if (nSize <= 3) {
      compact = num.toNumber();
      compact <<= 8 * (3 - nSize);
    } else {
      compact = num.ushrn(8 * (nSize - 3)).toNumber();
    }
    if (compact & 0x800000) {
      compact >>= 8;
      nSize++;
    }
    bits = (nSize << 24) | compact;
    if (num.isNeg()) {
      bits |= 0x800000;
    }
    bits >>>= 0;
    return parseInt(bits.toString(10));
  }

  getLastBlock() {
    return this.blockchain[this.blockchain.length - 1];
  }

  isValidBlock(oldBlock, newBlock) {
    if (!oldBlock) return true;
    return (
      newBlock.index > 0 &&
      oldBlock.hash === newBlock.preHash &&
      newBlock.getHash() === newBlock.hash
    );
  }

  isValidBlockchain(blockchain) {
    let result = false;
    if (blockchain.length === 1) return true;
    for (const index in blockchain) {
      if (index == 0) {
        result = blockchain[0].hash === blockchain[1].preHash;
      } else {
        result = blockchain[index - 1].hash === blockchain[index].preHash;
      }
      if (!result) return false;
    }
    return result;
  }

  handleChainResponse(receivedChain, ws) {
    // 전달 받은 체인이 올바른가?
    const isValidChain = this.isValidBlockchain(receivedChain);

    if (!isValidChain) return;

    const isValid = this.replaceChain(receivedChain);
    if (!isValid) return;

    // broadcast
    const message = {
      type: MessageType.receivedChain,
      payload: receivedChain,
    };

    ws.broadcast(message);

    return true;
  }

  replaceChain(receivedChain) {
    const latestReceivedBlock = receivedChain[receivedChain.length - 1];
    const latestBlock = this.getLastBlock();
    if (latestReceivedBlock.index === 0) {
      console.log("받은 최신 블록이 제네시스 블록");
      return false;
    }

    if (latestReceivedBlock.index <= latestBlock.index) {
      console.log("자신의 블록이 더 길거나 같습니다.");
      return false;
    }

    // 체인 바꿔주는 코드 (내 체인이 더 짧다면)
    this.blockchain = receivedChain;
    return true;
  }
}

module.exports = Blockchain;
