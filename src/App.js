import { encryptDataAndSendtoServer } from "./protocol";
import { deriveKeys, generateAesKWKey, 
         deriveKeyPBKDF2, wrapKeyWithKeyAesKW, 
         generateECDSAKeyPair, generateECDHKeyPair,
        exportCryptoKeyToBytes,     
        exportCryptoKeyToJwk} from "./CryptoUtils";

import { exportCryptoKeyToRaw as exportCryptoKeyToRaw } from "./CryptoUtils";

import './App.css';
import { getQueriesForElement } from "@testing-library/react";

const INVITE_URL = "https://localhost:7125/api/Transactions/Invite";
const REGISTER_URL = "https://localhost:7125/api/Transactions/Register";
const LOGIN_URL = "https://localhost:7125/api/Transactions/Login"; 

const OWNER_CODE = "1234";
const INVITE_CODE = "5678"
const NUM_SERVERS = 3;

let g_storedDeviceID;
let g_storedDeviceLOGIN_SIGN;
let g_storedDS_PRIV;
let g_storedDE_PRIV;
let g_storedSE_PUB;
let g_storedWSECRET;
let g_storedWENCRYPTS;
let g_storedWSIGNS;

async function storeDeviceID(devideID) {
  g_storedDeviceID = devideID;
}

async function storeLOGIN_SIGN(deviceLOGIN_SIGNS_0) {
  g_storedDeviceLOGIN_SIGN = deviceLOGIN_SIGNS_0;
}

async function storeDS_PRIV(DS_PRIV) {
  g_storedDS_PRIV = DS_PRIV;
}

async function storeDE_PRIV(DE_PRIV) {
  g_storedDE_PRIV = DE_PRIV;
}

async function storeSE_PUB(SE_PUB) {
  g_storedSE_PUB = SE_PUB;
}

async function storeWSECRET(wSECRET) {
  g_storedWSECRET = wSECRET;
}

async function storeWENCRYPTS(wENCRYPTS) {
  g_storedWENCRYPTS = wENCRYPTS;
}

async function storeWSIGNS(wSIGNS) {
  g_storedWSIGNS = wSIGNS;
}

async function getStoredDeviceI() {
  return g_storedDeviceID;
}

async function getStoredLOGIN_SIGN() {
  return g_storedDeviceLOGIN_SIGN;
}

async function getStoredDS_PRIV() {
  return g_storedDS_PRIV;
}

async function getStoredDE_PRIV() {
  return g_storedDE_PRIV;
}

async function getStoredSE_PUB() {
  return g_storedSE_PUB;
}

async function getStoredWSECRET() {
  return g_storedWSECRET;
}

async function getStoredWENCRYPTS() {
  return g_storedWENCRYPTS;
}

async function getStoredWSIGNS() {
  return g_storedWSIGNS;
}

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
  let invRawENCRYPTS = [];
  let invRawSIGNS = [];
  for (let i = 0; i <= numServers; i++) {
    invRawENCRYPTS.push(await exportCryptoKeyToBytes(invENCRYPTS[i]));     
    invRawSIGNS.push(await exportCryptoKeyToBytes(invSIGNS[i]));      
  }

  // Compose transaction and send KEYS using OWN_KEYS
  let inviteTransanction = {   
    invENCRYPTS: invRawENCRYPTS,
    invSIGNS: invRawENCRYPTS,
    inviteID: inviteID 
  };

  // Send transaction to server
  let response = await encryptDataAndSendtoServer(ownENCRYPTS, ownSIGNS, ownerID, INVITE_URL, numServers, inviteTransanction);
  console.log("Response: ", response);  
}

const register = async() => {
      
  const numServers = NUM_SERVERS;

  // the new user needs to open the web app in a browser, then register using the invite.CODE
  // get device.CODE from the user
  const deviceCode = INVITE_CODE; 
   
  // derive device.id + device.SECRET + device.KEYS (device.SIGNS + device.ENCRYPTS)
  const [deviceENCRYPTS, deviceSIGNS, deviceID] = await deriveKeys(deviceCode, numServers);

  // store device.id, device.LOGIN_SIGNS[0], we need to remember it for the  login 
  await storeDeviceID(deviceID);
  await storeLOGIN_SIGN(deviceSIGNS[0])

  // create TOKEN + NONCE as 256 bits keys
  const TOKEN = await generateAesKWKey(); 
  const NONCE = await generateAesKWKey();
  const binNONCE = await exportCryptoKeyToBytes(NONCE);

  // create PASSWORD as TEXT entered by the new user on their device
  const PASSWORD = "Password";
  
  // derive PASSKEY FROM PASSWORD using PBKDF2
  const PASSKEY = await deriveKeyPBKDF2(PASSWORD);

  // wTOKEN = wrap TOKEN with PASSKEY using AES-KW
  const wTOKEN = await wrapKeyWithKeyAesKW(TOKEN, PASSKEY);

  // DS = create ECDSA key pair
  const DS = await generateECDSAKeyPair();

  // DE = create ECDH key pair
  const DE = await generateECDHKeyPair();

  // store DS.PRIV +  DE.PRIV
  const DS_PRIV = await exportCryptoKeyToJwk(DS.privateKey);
  const DE_PRIV = await exportCryptoKeyToJwk(DE.privateKey);
  await storeDS_PRIV(DS_PRIV);
  await storeDE_PRIV(DE_PRIV);

  //send DS.PUB + DE.PUB + wTOKEN  + NONCE  + device.id

  const DS_PUB = await exportCryptoKeyToBytes(DS.publicKey);
  const DE_PUB = await exportCryptoKeyToBytes(DE.publicKey);

  let registerTransanction = {  
    DS_PUB,
    DE_PUB, 
    wTOKEN, 
    NONCE: binNONCE,
    deviceID
  };

  console.log("Sent Data: ", registerTransanction);

  let response = await encryptDataAndSendtoServer(deviceENCRYPTS, deviceSIGNS, deviceID, REGISTER_URL, numServers, registerTransanction);
    
  await storeSE_PUB(response.SE_PUB); 

  // create SECRET + derive KEY for invite.id, which can be used 
  // for the tansaction session after successful login
  const SECRET = await deriveKeyPBKDF2(deviceCode);

  // store wSECRET = SECRET wrap by TOKEN
  const wSECRET = await wrapKeyWithKeyAesKW(SECRET, TOKEN);
  await storeWSECRET(wSECRET);
  
  // store wKEYS = KEYS wrap by NONCE
  let wENCRYPTS = [];
  let wSIGNS = [];
  for (let i = 0; i <= numServers; i++) {
    const wENCRYPT = await wrapKeyWithKeyAesKW(deviceENCRYPTS[i], NONCE);
    const wSIGN = await wrapKeyWithKeyAesKW(deviceSIGNS[i], NONCE);

    wENCRYPTS.push(wENCRYPT);
    wSIGNS.push(wSIGN);
  } 
  
  await storeWENCRYPTS(wENCRYPTS);
  await storeWSIGNS(wSIGNS);
} 

const login = async() => {
                
  const inviteCode = INVITE_CODE;

  // create NONCE
  const NONCE = await generateAesKWKey();
  const binNONCE = await exportCryptoKeyToBytes(NONCE);

  // DS = create ECDSA key pair
  const DS = await generateECDSAKeyPair();

  // DE = create ECDH key pair
  const DE = await generateECDHKeyPair();

  // store DS.PRIV +  DE.PRIV
  const DS_PRIV = await exportCryptoKeyToJwk(DS.privateKey);
  const DE_PRIV = await exportCryptoKeyToJwk(DE.privateKey);
  await storeDS_PRIV(DS_PRIV);
  await storeDE_PRIV(DE_PRIV);

  const DS_PUB = await exportCryptoKeyToBytes(DS.publicKey);
  const DE_PUB = await exportCryptoKeyToBytes(DE.publicKey);

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

  const wENCRYPTS = await getStoredWENCRYPTS();
  const wSIGNS = await getStoredWSIGNS();

  // send DS.PUB + DE.PUB + wKEYS + NONCE
  let loginTransanction = {   
    DS_PUB,
    DE_PUB,           
    wENCRYPTS,
    wSIGNS,  
    NONCE: binNONCE
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
