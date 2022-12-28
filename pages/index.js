import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { useState, useEffect, useSyncExternalStore } from 'react';
import { ethers } from "ethers";

import abi  from "../contract/abi.json";
import ercabi from "../contract/erc20Abi.json";


export default function Home() {
  //State variables
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState("");
  const [tokenContract, setTokenContract] = useState("");
  const [lpBalance, setLpBalance] = useState(""); 
  const [tokenBalance, setTokenBalance] = useState(""); 
  const contractAddress = "0xb2f00B750B152E7E8152DFbA7CE66ba6A3BB5582";
  const tokenAddress = "0x6878C0fF3012F45944aae971Eb3E03235bbb7468";

  //Loading Screen
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [msg, setMsg] = useState("");
  const [showMsg, setShowMsg] = useState(false);

  //User Inputs
  const [tokenInp, setTokenInp] = useState("");
  const [ethInp, setEthInp] = useState("");
  const [ethSwapInp, setEthSwapInp] = useState("");
  const [lpInp, setLpInp] = useState("");
  
  //Connection functions
  const checkIfWalletConnected = async () => {
    try {
      const ethereum = window.ethereum;
  
      if (!ethereum) {
        console.error("Make sure you have Metamask!");
        return null;
      }
  
      const accounts = await ethereum.request({ method: "eth_accounts" });
  
      if (accounts.length !== 0) {
        const account = accounts[0];
        return account;
      } else {
        console.error("No authorized account found");
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const connectWallet = async () => {
    try {
      const ethereum = window.ethereum;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setAccount(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  };

  const connectToContract = async(_account) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const _contract = new ethers.Contract(contractAddress, abi.abi, signer);
    console.log(_contract);
    setContract(_contract);

    let _lp = await _contract.balanceOf(_account);
    setLpBalance((_lp.toNumber()) * Math.pow(10,-13));
  }

  const connectToTokenContract = async(account) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const _contract = new ethers.Contract(tokenAddress, ercabi.abi, signer);
    setTokenContract(_contract);

    let balance = await _contract.balanceOf(account);
    setTokenBalance(balance.toNumber());
  }
  
  //Contract Functions
  const addLiquidityftfs = async() => {
    let weiValue =  ethers.utils.parseUnits(ethInp.toString(), "ether");
  
    let txn = await tokenContract.approve(contractAddress, tokenInp);
    await txn.wait();

    await contract.addLiquidity( tokenInp, {value: weiValue} );
  }

  const addLiquidity = async() => {

    try{
      let weiValue = ethers.utils.parseUnits(ethInp.toString(), "ether");
      let tokenValue = await contract.getTokenForAddingLiquidity(weiValue);
      setLoadingMsg(`Tokens to Send: ${tokenValue.toString()}`)
  
      setLoading(true);
  
      let txn = await tokenContract.approve(contractAddress, tokenValue);
      await txn.wait();
  
      let txn1 = await contract.addLiquidity( tokenValue, {value: weiValue} );
      let rc = await txn1.wait();
  
      setLoading(false);
      const event = rc.events.find(event => event.event === 'liquidityAdded');
      const [lpValue] = event.args;
      let readableLP = (lpValue.toNumber()) * Math.pow(10,-13);
      setShowMsg(true);
      setMsg(`LP Minted: ${readableLP}`);
    }catch(error){
      console.log(error);
      setLoading(false);
    }
  }

  const removeLiquidity = async() => {
    try{
      setLoading(true);
      setLoadingMsg("");

      let txn = await contract.removeLiquidity(lpInp * Math.pow(10,13));
      let rc = await txn.wait();
      setLoading(false)
      const event = rc.events.find(event => event.event === 'liquidityRemoved');
      const [tokenAm, weiAm] = event.args;
  
      
      console.log("Token Received: ", tokenAm.toNumber());
      let weiNum = weiAm.toNumber();
      let ethNum = ethers.utils.formatEther(weiNum.toString());
      console.log("eth Received", ethNum);

      setShowMsg(true)
      setMsg(`Token Received: ${tokenAm.toNumber()}, Eth Recieved: ${ethNum}`)
    }catch(error){
      console.log(error);
      setLoading(false);
    }
  }


  const swapEth = async() => {
    try{
      setLoading(true);
      setLoadingMsg("");
      let weiValue = ethers.utils.parseUnits(ethSwapInp.toString(), "ether");
      let txn = await contract.etherToToken({value: weiValue});
      let rc = await txn.wait();
      setLoading(false)

      const event = rc.events.find(event => event.event === 'ethToToken');
      const [tokenValue] = event.args;

      setShowMsg(true);
      setMsg(`Tokens Received: ${tokenValue.toNumber()}`)
    }catch(error){
      console.log(error);
      setLoading(fasle)
    }
  }

  const swapToken = async() => {
    try{
      setLoading(true);
      setLoadingMsg("");
      let txn = await tokenContract.approve(contractAddress, tokenInp);
      await txn.wait();
  
      let txn1 = await contract.tokenToEther(tokenInp);
      let rc = await txn1.wait(1);
      setLoading(false)
      const event = rc.events.find(event => event.event === 'tokenToEth');
      const [weiValue] = event.args;
      let weiNum = weiValue.toString();
      let ethValue = ethers.utils.formatEther(weiNum.toString());
      console.log("eth Received", ethValue);
      setShowMsg(true);
      setMsg(`Eth Received: ${ethValue}`);
    }catch(error){
      console.log(error);
      setLoading(false);
    }
  }

  useEffect(() => {
    checkIfWalletConnected().then( (account) => {
      if(account !== null){
        setAccount(account);
        connectToContract(account);
        connectToTokenContract(account);
      }
    })
  }, [])

  return (
    <>
      <Head>
        <title>Automated Market Maker</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className='heading'>
        <h1>Automated Market Maker V2</h1>
        <p>Network: Goerli</p>
      </div>
      <main className={styles.main}>
        {showMsg &&(
          <div className='msg' >
            <p>{msg}</p>
          </div>
        )}
        {loading=== true &&(
          <div className='loading' >
            <h3>Transaction going through, please wait</h3>
            <h3>{loadingMsg}</h3>
            <div className='loader'></div>
          </div>
        )}
        <h3>Swap Between a token and Ethereum</h3>

        {!account && (
            <button className="waveButton" onClick={connectWallet}>
              Connect Wallet
            </button>
        )}

        {account && (
          <>
            <p> <a href='https://testtokenminter.netlify.app/' target="_blank" >Click</a> to mint test tokens</p>
             <p>LP balance of the user: {lpBalance}</p>
             <p>Token balance of the user: {tokenBalance}</p>

            <div className='input' >
              <h3>Add liquidity</h3>
              <input type="number" value={ethInp} onChange={(e) => setEthInp(e.target.value)} placeholder='enter eth Value' />
              <button onClick ={addLiquidity} >Add Liquidity</button>
            </div>

            <div className='input'>
              <h3>Remove Liquidity</h3>  
              <input type="number" value={lpInp} onChange={(e) => setLpInp(e.target.value)} placeholder='enter LP token Value' />
              <button onClick={removeLiquidity} >Remove liquidity</button>
            </div>

            <div className='input'>              
              <h3>Swap Eth for token</h3>  
              <input type="number" value={ethSwapInp} onChange={(e) => setEthSwapInp(e.target.value)} placeholder='enter eth Value' />
              <button onClick={swapEth} >Swap eth</button>
            </div>

            <div className='input'>
              <h3>Swap token for Eth</h3>  
              <input type="number" value={tokenInp} onChange={(e) => setTokenInp(e.target.value)}  placeholder='enter token Value' />
              <button onClick={swapToken} >Swap Token</button>
            </div>

            {/* <h3>Add liquidity For the first time</h3>
            <input type="number"  value={ethInp} onChange={(e) => setEthInp(e.target.value)} placeholder='enter eth Value' />
            <input type="number" value={tokenInp} onChange={(e) => setTokenInp(e.target.value)} placeholder='enter Token Value' />
            <button onClick={addLiquidityftfs} >Add Liquidity</button> */}
          </>
        )}
      </main>
    </>
  )
}
