import React from "react";
import Axios from "axios";
import Message from "../message";
import Transaction from "../transaction";

const axios = Axios.create({ baseURL: "http://localhost:3001" });

const index = () => {
  const connectWs = () => {
    axios.get("/network").then((res) => {
      console.log(res.data);
    });
  };

  const sendTx = () => {
    const tx = new Transaction({ from: "A", to: "B", amount: 100 });
    axios.post("/tx");
  };

  const getTx = () => {
    axios.get("/txList").then((res) => {
      console.log(res.data);
    });
  };

  const getBlocks = () => {
    axios.get("/blocks").then((res) => {
      console.log(res.data);
    });
  };

  const start = () => {
    axios.get("/mining").then((res) => {
      console.log(res.data);
    });
  };

  const stop = () => {
    axios.get("/stop").then((res) => {
      console.log(res.data);
    });
  };

  return (
    <div>
      <button onClick={connectWs}>웹소켓연결</button>
      <button onClick={start}>start</button>
      <button onClick={stop}>stop</button>
      <button onClick={sendTx}>sendTx</button>
      <button onClick={getTx}>getTx</button>
      <button onClick={getBlocks}>getBlocks</button>
    </div>
  );
};

export default index;
