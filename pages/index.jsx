import React, { useRef } from "react";
import Axios from "axios";
import Message from "../message";
import Transaction from "../transaction";
import ip from "ip";

const axios = Axios.create({ baseURL: "http://localhost:3001" });

const index = () => {
  const ref = useRef();
  const connectWs = () => {
    const peer = ref.current.value;
    axios.post("/network", { peer }).then((res) => {
      console.log(res.data);
    });
  };

  const sendTx = () => {
    axios.post("/tx").then((res) => {
      console.log(res.data);
    });
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

  const onChange = () => {};

  return (
    <div>
      <div>
        <input type="text" ref={ref} />
        <button onClick={connectWs}>웹소켓연결</button>
      </div>
      <button onClick={start}>start</button>
      <button onClick={stop}>stop</button>
      <button onClick={sendTx}>sendTx</button>
      <button onClick={getTx}>getTx</button>
      <button onClick={getBlocks}>getBlocks</button>
    </div>
  );
};

export default index;
