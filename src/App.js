import { encryptDataAndSendtoServer } from "./protocol";
import { deriveKeys } from "./CryptoUtils";
import { exportKey as exportCryptoKeyToRaw } from "./CryptoUtils";

import './App.css';

const INVITE_URL = "https://localhost:7125/api/Transactions/Invite";
const REGISTER_URL = "https://localhost:7125/api/Transactions/Register";
const LOGIN_URL = "https://localhost:7125/api/Transactions/Login"; 

const OWNER_CODE = "1234";

const DUMMY_ENC_NODE_KEY = new Uint8Array(base64ToByteArray("U5PwRpgCmk/30vkWA9QsX02\u002B8thW00qGBr16fLkdu\u002B7l5\u002B5O/RodIQ=="));

function base64ToByteArray(base64) {
  var binaryString = atob(base64);
  var bytes = new Uint8Array(binaryString.length);
  for (var i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const invite = async() => {
                
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

  let inviteTransanction = {
    bID:"9476185f6905e331", 
    dID:"9554b2d9ad46683b",
    tID:"bc4f006e946664c8",
    TS:"2024-03-03T06:13:00.56537918Z",
    RT:true,
    REQ:[
          {
            TYP: "Invite",
            OWN_ENCRYPTS: ENCRYPTS,
            OWN_SIGNS: SIGNS, 
            encKEY: DUMMY_ENC_NODE_KEY            
          }
        ]
  };

  console.log("Sent Data: ", inviteTransanction);

  let response = await encryptDataAndSendtoServer(encrypts, signs, src, INVITE_URL, numServers, inviteTransanction);
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
    bID:"9476185f6905e331", 
    dID:"9554b2d9ad46683b",
    tID:"bc4f006e946664c8",
    TS:"2024-03-03T06:13:00.56537918Z",
    RT:true,
    REQ:[
          {
            TYP: "Register",
            DS_PUB: new Uint8Array(32),
            DE_PUB: new Uint8Array(32), 
            wTOKEN: new Uint8Array(32),
            NONCE: new Uint8Array(32),
            encKEY: DUMMY_ENC_NODE_KEY            
          }
        ]
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
    bID:"9476185f6905e331", 
    dID:"9554b2d9ad46683b",
    tID:"bc4f006e946664c8",
    TS:"2024-03-03T06:13:00.56537918Z",
    RT:true,
    REQ:[
          {
            TYP: "Login",
            DS_PUB: new Uint8Array(32),
            DE_PUB: new Uint8Array(32),           
            NONCE: new Uint8Array(32),
            wENCRYPTS: ENCRYPTS,
            wSIGNS: SIGNS,
            encKEY: DUMMY_ENC_NODE_KEY            
          }
        ]
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
