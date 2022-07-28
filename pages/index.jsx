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
    console.log(peer);
    axios.post("/addToPeer", { peer }).then((res) => {
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

  const getSockets = () => {
    axios.get("/getSockets").then((res) => {
      console.log(res.data);
    });
  };

  const broadcastToClient = () => {
    axios.get("/broadcastToClients").then((res) => {
      console.log(res.data);
    });
  };

  const broadcastToServer = () => {
    axios.get("/broadcastToServers").then((res) => {
      console.log(res.data);
    });
  };

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
      <button onClick={getSockets}>getSockets</button>
      <button onClick={broadcastToClient}>broadcastToClient</button>
      <button onClick={broadcastToServer}>broadcastToServer</button>
    </div>
  );
};

export default index;
