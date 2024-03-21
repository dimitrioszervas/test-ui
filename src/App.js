import { encryptDataAndSendtoServer } from "./protocol";
import { deriveKeys, deriveID } from "./CryptoUtils";
import { exportKey as exportCryptoKeyToRaw } from "./CryptoUtils";

import './App.css';

const INVITE_URL = "https://localhost:7125/api/Transactions/Invite";
const REGISTER_URL = "https://localhost:7125/api/Transactions/Register";
const LOGIN_URL = "https://localhost:7125/api/Transactions/Login"; 

const OWNER_CODE = "1234";

const invite = async() => {
                
  const ownerCode = OWNER_CODE;
  let inviteCode = "5678";

  // creating n encryption keys from ENCRYPT i.e ENCRYPTS    
  // We have 3 servers 
  // Derive Owner id, encrypts & signs keys using the Onwer Code 
  const numServers = 3;
  let ownerID = await deriveID(ownerCode);
  const [ownECRYPTS, ownSIGNS, SRC] = await deriveKeys(ownerCode, numServers);

  // Derive invite id, encrypts & signs keys using the Invite Code  
  let inviteID = await deriveID(inviteCode);
  const [invCENCRYPTS, invSIGNS, ] = await deriveKeys(inviteCode, numServers);
  
  // Convert encrypts & signs CryptoKeys to raw binary
  let ENCRYPTS = [];
  let SIGNS = [];
  for (let i = 0; i <= numServers; i++) {
    ENCRYPTS.push(new Uint8Array(await exportCryptoKeyToRaw(invCENCRYPTS[i])));     
    SIGNS.push(new Uint8Array(await exportCryptoKeyToRaw(invSIGNS[i])));      
  }

  let inviteTransanction = {   
    ENCRYPTS,
    SIGNS,
    inviteID  
  };

  console.log("Sent Data: ", inviteTransanction);

  let response = await encryptDataAndSendtoServer(ownECRYPTS, ownSIGNS, SRC, INVITE_URL, numServers, inviteTransanction);
  console.log("Response: ", response);
    
  console.log(response.OWN_ENCRYPTS);
  console.log(response.OWN_SIGNS);
}

const register = async() => {
                
  const ownerCode = OWNER_CODE;

  // generateKey cannot be used to create a key which will be used to drive other keys in future so using importKey function
  // creating n encryption keys from ENCRYPT i.e ENCRYPTS    
  // We have 3 servers 
  const numServers = 3;
  const [encrypts, signs, src] = await deriveKeys(ownerCode, numServers);

  let registerTransanction = {  
    DS_PUB: new Uint8Array(32),
    DE_PUB: new Uint8Array(32), 
    wTOKEN: new Uint8Array(32),
    NONCE: new Uint8Array(32)
  };

  console.log("Sent Data: ", registerTransanction);

  let response = await encryptDataAndSendtoServer(encrypts, signs, src, REGISTER_URL, numServers, registerTransanction);
  console.log("Response: ", response); 
} 

const login = async() => {
                
  const ownerCode = OWNER_CODE;

  // generateKey cannot be used to create a key which will be used to drive other keys in future so using importKey function
  // creating n encryption keys from ENCRYPT i.e ENCRYPTS    
  // We have 3 servers 
  const numServers = 3;
  const [encrypts, signs, src] = await deriveKeys(ownerCode, numServers);
  
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
      <button onClick={login}>Register</button>
    </header>
  </div>

    
  );
}

export default App;
