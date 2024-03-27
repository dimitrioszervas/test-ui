import { encryptDataAndSendtoServer } from "./protocol";
import { deriveKeys,
         ECDHDeriveEncrypt,
         ECDHDeriveSign, 
         generateAesKW256KeyForWrapAndUnwrap, 
         derivePBKDF2Key256ForWrapAndUnwrap, 
         wrapKeyWithKeyAesKW, 
         urwrapKeyWithKeyAesKW,
         generateECDSAKeyPair, 
         generateECDHKeyPair,
         exportCryptoKeyToBytes,     
         exportCryptoKeyToJwk,
         importRawECDHKeyForEncryptAndDecrypt,
         importRawECDHKeyForSignAndVerify,
         importECDHPublicKey,       
        } from "./CryptoUtils";

import { exportCryptoKeyToRaw as exportCryptoKeyToRaw } from "./CryptoUtils";

import './App.css';
import { getQueriesForElement } from "@testing-library/react";
import { AES } from "crypto-js";

const INVITE_URL = "https://localhost:7125/api/Transactions/Invite";
const REGISTER_URL = "https://localhost:7125/api/Transactions/Register";
const LOGIN_URL = "https://localhost:7125/api/Transactions/Login"; 

const OWNER_CODE = "1234";
const INVITE_CODE = "5678"
const NUM_SERVERS = 3;
const MY_PASSWORD = "Password";

let g_storedDeviceID;
let g_storedLOGIN_ENCRYPTS;
let g_storedLOGIN_SIGNS;
let g_storedDS_PRIV;
let g_storedDE_PRIV;
let g_storedSE_PUB;
let g_storedWSECRET;
let g_storedWENCRYPTS;
let g_storedWSIGNS;

async function storeDeviceID(devideID) {
  g_storedDeviceID = devideID;
}

async function storeLOGIN_ENCRYPTS(LOGIN_ENCRYPTS) {
  g_storedLOGIN_ENCRYPTS = LOGIN_ENCRYPTS;
}

async function storeLOGIN_SIGNS(LOGIN_SIGNS) {
  g_storedLOGIN_SIGNS = LOGIN_SIGNS;
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

async function getStoredDeviceID() {
  return g_storedDeviceID;
}

async function getStoredLOGIN_ENCRYPTS() {
  /*
  let LOGIN_ENCRYPTS = [];
  for (let i = 0; i < g_storedLOGIN_ENCRYPTS.length; i++) {
    let cryptoKey = await importRawECDHEncryptDecryptKey(g_storedLOGIN_ENCRYPTS[i]);
    LOGIN_ENCRYPTS.push(cryptoKey);
  }
  return LOGIN_ENCRYPTS;*/
  return g_storedLOGIN_ENCRYPTS;
}

async function getStoredLOGIN_SIGNS() {
  /*
  let LOGIN_SIGNS = [];
  for (let i = 0; i < g_storedLOGIN_SIGNS.length; i++) {
    let cryptoKey = await importRawECDHSignVerifyKey(g_storedLOGIN_SIGNS[i]);
    LOGIN_SIGNS.push(cryptoKey);
  }  
  return LOGIN_SIGNS;
  */
  return g_storedLOGIN_SIGNS;
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
   
  // we are using the device.CODE for the test app, but production app will 
  // allow any logged-in user to invite others

  // get device.CODE from the user that is making the invite
  const deviceCode = OWNER_CODE;
  
  // derive device.id + device.SECRET + device.SIGNS + device.ENCRYPTS
  const numServers = NUM_SERVERS; 
  const [deviceENCRYPTS, deviceSIGNS, deviceID] = await deriveKeys(deviceCode, numServers);
  
  // create invite.CODE for new user DEVICE
  const inviteCode = INVITE_CODE; 
   
  //  derive invite.id + invite.SECRET + invite.SIGNS + invite.ENCRYPTS
  const [inviteENCRYPTS, inviteSIGNS, inviteID] = await deriveKeys(inviteCode, numServers);
  
  // send invite.id + invite.SIGNS + invite.ENCRYPTS as invite transaction data...

  // Convert inviteENCRYPTS & inviteSIGNS CryptoKeys to raw binary
  let inviteRawENCRYPTS = [];
  let inviteRawSIGNS = [];
  for (let i = 0; i <= numServers; i++) {
    inviteRawENCRYPTS.push(await exportCryptoKeyToBytes(inviteENCRYPTS[i]));     
    inviteRawSIGNS.push(await exportCryptoKeyToBytes(inviteSIGNS[i]));      
  }

  // Compose transaction and send KEYS using OWN_KEYS
  let inviteTransanction = {   
    inviteENCRYPTS: inviteRawENCRYPTS,
    inviteSIGNS: inviteRawSIGNS,
    inviteID: inviteID 
  };

  // Send transaction to server
  let response = await encryptDataAndSendtoServer(deviceENCRYPTS, deviceSIGNS, deviceID, INVITE_URL, numServers, inviteTransanction);
  console.log("Response: ", response);  
}

const register = async() => {
      
  const numServers = NUM_SERVERS;

  // the new user needs to open the web app in a browser, then register using the invite.CODE
  // get device.CODE from the user
  const deviceCode = INVITE_CODE; 
   
  // derive device.id + device.SECRET + device.KEYS (device.SIGNS + device.ENCRYPTS)
  const [deviceENCRYPTS, deviceSIGNS, deviceID] = await deriveKeys(deviceCode, numServers);
 
  // create TOKEN + NONCE as 256 bits keys
  const TOKEN = await generateAesKW256KeyForWrapAndUnwrap(); 
  const NONCE = await generateAesKW256KeyForWrapAndUnwrap();
  const binNONCE = await exportCryptoKeyToBytes(NONCE);

  // create PASSWORD as TEXT entered by the new user on their device
  const PASSWORD = MY_PASSWORD;
  
  // derive PASSKEY FROM PASSWORD using PBKDF2
  const PASSKEY = await derivePBKDF2Key256ForWrapAndUnwrap(PASSWORD);

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

  // store device.id, device.LOGIN_SIGNS[0], we need to remember it for the  login
  await storeDeviceID(deviceID); 

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

  let response = await encryptDataAndSendtoServer(deviceENCRYPTS, deviceSIGNS, deviceID, REGISTER_URL, numServers, registerTransanction);
  console.log("response: ", response);

  const SE_PUB = response.SE_PUB;

  console.log("response.SE_PUB: ", SE_PUB);
  
  // LOGINS[0] = device. SIGNS[0]
  // for each (n), store LOGINS[n] = ECDH.derive (DE.PRIV, SE.PUB[n])
  let LOGIN_ENCRYPTS = [];
  let LOGIN_SIGNS = [];
  for (let i = 0; i <= numServers; i++) {
    const cryptoKeySE_PUB = await importECDHPublicKey(new Uint8Array(SE_PUB[i]).buffer);
   
    let derivedECDHEcrypt = await ECDHDeriveEncrypt(DE.privateKey, cryptoKeySE_PUB);
    LOGIN_ENCRYPTS.push(derivedECDHEcrypt);//await exportCryptoKeyToBytes(derivedECDHEcryptKey));
    console.log("derivedECDHEcryptKey: ", await exportCryptoKeyToBytes(derivedECDHEcrypt));
   
    let derivedECDHSign = await ECDHDeriveSign(DE.privateKey, cryptoKeySE_PUB);
    LOGIN_SIGNS.push(derivedECDHSign);//await exportCryptoKeyToBytes(derivedECDHSignKey));    
  }

  await storeLOGIN_ENCRYPTS(LOGIN_ENCRYPTS);
  await storeLOGIN_SIGNS(LOGIN_SIGNS);

  await storeSE_PUB(SE_PUB); 
  
  // create SECRET + derive KEY for invite.id, which can be used 
  // for the tansaction session after successful login
  const SECRET = await derivePBKDF2Key256ForWrapAndUnwrap(deviceCode);

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
  
  // We have 3 servers 
  const numServers = NUM_SERVERS;
  
  // create NONCE
  const NONCE = await generateAesKW256KeyForWrapAndUnwrap();
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
    
  const deviceID = await getStoredDeviceID()
  const LOGIN_ENCRYPTS = await getStoredLOGIN_ENCRYPTS();
  const LOGIN_SIGNS = await getStoredLOGIN_SIGNS();

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

  let response = await encryptDataAndSendtoServer(LOGIN_ENCRYPTS, LOGIN_SIGNS, deviceID, LOGIN_URL, numServers, loginTransanction);
  console.log("Response: ", response); 

  const wTOKEN = new Uint8Array(response.wTOKEN);
  const SE_PUB = response.SE_PUB;

  //  get PASSWORD
  const PASSWORD = MY_PASSWORD;
  const PASSKEY = await derivePBKDF2Key256ForWrapAndUnwrap(PASSWORD);

  // unwrap wTOKEN with PASSWORD 
  const TOKEN = await urwrapKeyWithKeyAesKW(wTOKEN, PASSKEY);

  // unwrap wSECRET with TOKEN
  const wSECRET = await getStoredWSECRET();
  //const SECRET = await urwrapKeyWithKeyAesKW(wSECRET, )
  
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
