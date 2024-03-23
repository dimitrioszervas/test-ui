import { encryptDataAndSendtoServer } from "./protocol";
import { deriveKeys, generateAESKWKey, deriveKeyPBKDF2, wrapKeyWithKeyKW } from "./CryptoUtils";
import { exportKey as exportCryptoKeyToRaw } from "./CryptoUtils";

import './App.css';
import { getQueriesForElement } from "@testing-library/react";

const INVITE_URL = "https://localhost:7125/api/Transactions/Invite";
const REGISTER_URL = "https://localhost:7125/api/Transactions/Register";
const LOGIN_URL = "https://localhost:7125/api/Transactions/Login"; 

const OWNER_CODE = "1234";
const INVITE_CODE = "5678"
const NUM_SERVERS = 3;

const invite = async() => {
   
  // get owner.CODE from the user that is making the invite
  const ownerCode = OWNER_CODE;
  
  // derive owner.id + owner.SECRET + owner.KEYS
  const numServers = NUM_SERVERS; 
  const [ownENCRYPTS, ownSIGNS, ownerID] = await deriveKeys(ownerCode, numServers);
  
  // create invite.CODE for new user DEVICE
  const inviteCode = INVITE_CODE; 
   
  // derive invite.id + invite.SECRET + invite.KEYS (invite.SIGNS + invite.ENCRYPTS)
  const [invENCRYPTS, invSIGNS, inviteID] = await deriveKeys(inviteCode, numServers);
  
  // send invite.id + invite.KEYS as transaction data using owner.KEYS

  // Convert encrypts & signs CryptoKeys to raw binary
  let ENCRYPTS = [];
  let SIGNS = [];
  for (let i = 0; i <= numServers; i++) {
    ENCRYPTS.push(new Uint8Array(await exportCryptoKeyToRaw(invENCRYPTS[i])));     
    SIGNS.push(new Uint8Array(await exportCryptoKeyToRaw(invSIGNS[i])));      
  }

  // Compose transaction and send KEYS using OWN_KEYS
  let inviteTransanction = {   
    ENCRYPTS,
    SIGNS,
    inviteID 
  };

  // Send transaction to server
  let response = await encryptDataAndSendtoServer(ownENCRYPTS, ownSIGNS, ownerID, INVITE_URL, numServers, inviteTransanction);
  console.log("Response: ", response);
  
}

const register = async() => {
      
  const numServers = NUM_SERVERS;

  // the new user needs to open the web app in a browser, then register using the invite.CODE
  // get invite.CODE from the user
  const inviteCode = INVITE_CODE; 
   
  // derive invite.id + invite.SECRET + invite.KEYS (invite.SIGNS + invite.ENCRYPTS)
  const [invENCRYPTS, invSIGNS, inviteID] = await deriveKeys(inviteCode, numServers);

  // create TOKEN + NONCE as 256 bits keys
  const TOKEN = await generateAESKWKey();
  console.log("TOKEN: ", TOKEN);

  const NONCE = await generateAESKWKey();
  console.log("NONCE: ", NONCE);

  // create PASSWORD as TEXT entered by the new user on their device
  const PASSWORD = "Password";
  //const PASSKEY = await deriveKeyPBKDF2(PASSWORD);
  //const wTOKEN = await wrapKeyWithKeyKW(TOKEN, PASSKEY);

  let registerTransanction = {  
    DS_PUB: new Uint8Array(32),
    DE_PUB: new Uint8Array(32), 
    wTOKEN: new Uint8Array(32), 
    NONCE: new Uint8Array(32),
    inviteID
  };

  console.log("Sent Data: ", registerTransanction);

  let response = await encryptDataAndSendtoServer(invENCRYPTS, invSIGNS, inviteID, REGISTER_URL, numServers, registerTransanction);
    
  console.log("Response: ", response); 
} 

const login = async() => {
                
  const inviteCode = INVITE_CODE;

  // generateKey cannot be used to create a key which will be used to drive other keys in future so using importKey function
  // creating n encryption keys from ENCRYPT i.e ENCRYPTS    
  // We have 3 servers 
  const numServers = 3;
  const [encrypts, signs, src] = await deriveKeys(inviteCode, numServers);
  
  // Convert encrypts & signs CryptoKeys to raw binary
  let ENCRYPTS = [];
  let SIGNS = [];
 
  for (let i = 0; i <= numServers; i++) {
    ENCRYPTS.push(new Uint8Array(await exportCryptoKeyToRaw(encrypts[i])));     
    SIGNS.push(new Uint8Array(await exportCryptoKeyToRaw(signs[i])));      
  }
 

  let loginTransanction = {   
    DS_PUB: new Uint8Array(32),
    DE_PUB: new Uint8Array(32),           
    NONCE: new Uint8Array(32),
    wENCRYPTS: ENCRYPTS,
    wSIGNS: SIGNS  
  };

  console.log("Sent Data: ", loginTransanction);

  let response = await encryptDataAndSendtoServer(encrypts, signs, src, LOGIN_URL, numServers, loginTransanction);
  console.log("Response: ", response); 
} 

function App() {  

  async function handleClick() {
  
    await invite();
  
  }

  return (
    <div className="App">
    <header className="App-header"> 
      <button onClick={invite}>Invite</button>
      <button onClick={register}>Register</button>
      <button onClick={login}>Login</button>
    </header>
  </div>

    
  );
}

export default App;
