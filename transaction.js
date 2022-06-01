// 트랜잭션 설계도
class Transaction {
  constructor(data) {
    this.from = data.from; // 보내는 사람 주소
    this.to = data.to; // 받는 사람 주소
    this.amount = data.amount; // 보내는 양
    this.timestamp = Date.now(); // 트랜잭션 생성 시간
  }
}

module.exports = Transaction;
