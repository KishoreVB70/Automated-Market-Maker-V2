import { useEffect, useState } from 'react';
import { ethers } from "ethers";
import './App.css';
import abi  from "./abi.json";
import ercabi from "./erc20Abi.json"


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

function App() {
  //State variables
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState("");
  const [tokenContract, setTokenContract] = useState("");
  const [lpBalance, setLpBalance] = useState("");
  const contractAddress = "0xb2f00B750B152E7E8152DFbA7CE66ba6A3BB5582";
  const tokenAddress = "0x6878C0fF3012F45944aae971Eb3E03235bbb7468";

  //User Inputs
  const [tokenInp, setTokenInp] = useState("");
  const [ethInp, setEthInp] = useState("");
  const [ethSwapInp, setEthSwapInp] = useState("");
  const [lpInp, setLpInp] = useState("");

//Connection functions
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

  const connectToTokenContract = async() => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const _contract = new ethers.Contract(tokenAddress, ercabi.abi, signer);
    setTokenContract(_contract);
  }
  
  //Contract Functions
  const addLiquidityftfs = async() => {
    let weiValue =  ethers.utils.parseUnits(ethInp.toString(), "ether");
  
    let txn = await tokenContract.approve(contractAddress, tokenInp);
    await txn.wait();

    await contract.addLiquidity( tokenInp, {value: weiValue} );
  }

  const addLiquidity = async() => {
    let weiValue = ethers.utils.parseUnits(ethInp.toString(), "ether");
    let tokenValue = await contract.getTokenForAddingLiquidity(weiValue);
    console.log(tokenValue.toString());

    let txn = await tokenContract.approve(contractAddress, tokenValue);
    await txn.wait();

    let txn1 = await contract.addLiquidity( tokenValue, {value: weiValue} );
    let rc = await txn1.wait();
    const event = rc.events.find(event => event.event === 'liquidityAdded');
    const [lpValue] = event.args;
    let readableLP = (lpValue.toNumber()) * Math.pow(10,-13);
    console.log("LP minted: ", readableLP);
  }

  const removeLiquidity = async() => {
    let txn = await contract.removeLiquidity(lpInp * Math.pow(10,13));
    let rc = await txn.wait();
    const event = rc.events.find(event => event.event === 'liquidityRemoved');
    const [tokenAm, weiAm] = event.args;

    console.log("Token Received: ", tokenAm.toNumber());
    let weiNum = weiAm.toNumber();
    let ethNum = ethers.utils.formatEther(weiNum.toString());
    console.log("eth Received", ethNum);
  }

  const getTokenBalance = async() => {
    let bal = await contract.getTokenBalance();
    console.log(bal.toNumber());
  }

  const swapEth = async() => {
    let weiValue = ethers.utils.parseUnits(ethSwapInp.toString(), "ether");
    console.log(ethSwapInp.toString());
    let txn = await contract.etherToToken({value: weiValue});
    let rc = await txn.wait();
    const event = rc.events.find(event => event.event === 'ethToToken');
    const [tokenValue] = event.args;
    console.log("Token Received: ", tokenValue.toNumber());
  }

  const swapToken = async() => {
    let txn = await tokenContract.approve(contractAddress, tokenInp);
    await txn.wait();

    let txn1 = await contract.tokenToEther(tokenInp);
    let rc = await txn1.wait(1);
    const event = rc.events.find(event => event.event === 'tokenToEth');
    const [weiValue] = event.args;
    let weiNum = weiValue.toNumber();
    let ethValue = ethers.utils.parseEther(weiNum.toString());
    console.log("eth Received", ethValue);
  }

  useEffect(() => {
    checkIfWalletConnected().then( (account) => {
      if(account !== null){
        setAccount(account);
        connectToContract(account);
        connectToTokenContract();
      }
    })
  }, [])

//------------------------------------------------->UI<--------------------------------------------------------------------------
  return (
    <div className="App">
      <h1>Welcome to the automated market maker of the century</h1>

      {!account && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
      )}

      {account && (
        <>
          <p> <a href='https://testtokenminter.netlify.app/' >Click</a> to get free tokens</p>
          <button onClick={getTokenBalance}>Get Token balance</button>
          <p>LP balance of the user: {lpBalance}</p>

          <h3>Add liquidity</h3>
          <input type="number" value={ethInp} onChange={(e) => setEthInp(e.target.value)} placeholder='enter eth Value' />
          <button onClick ={addLiquidity} >Add Liquidity</button>

          <h3>Remove Liquidity</h3>  
          <input type="number" value={lpInp} onChange={(e) => setLpInp(e.target.value)} placeholder='enter LP token Value' />
          <button onClick={removeLiquidity} >Remove liquidity</button>

          <h3>Swap Eth for token</h3>  
          <input type="number" value={ethSwapInp} onChange={(e) => setEthSwapInp(e.target.value)} placeholder='enter eth Value' />
          <button onClick={swapEth} >Swap eth</button>

          <h3>Swap token for Eth</h3>  
          <input type="number" value={tokenInp} onChange={(e) => setTokenInp(e.target.value)}  placeholder='enter token Value' />
          <button onClick={swapToken} >Swap Token</button>

          <h3>Add liquidity For the first time</h3>
          <input type="number"  value={ethInp} onChange={(e) => setEthInp(e.target.value)} placeholder='enter eth Value' />
          <input type="number" value={tokenInp} onChange={(e) => setTokenInp(e.target.value)} placeholder='enter Token Value' />
          <button onClick={addLiquidityftfs} >Add Liquidity</button>
        </>
      )}
    </div>
  );
}

export default App;
