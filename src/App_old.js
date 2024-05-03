import { encryptDataAndSendtoServer } from "./protocol";
import {   
         deriveSignsAndEncryptsFromSecret,
         encrypt,
         generateAesKWKey,
         deriveRawID,
         deriveRawSecret, 
         derivePBKDF2Key, 
         wrapKey, 
         generateECDSAKeyPair, 
         generateECDHKeyPair,           
         exportCryptoKeyToJwk,
         exportCryptoKeyToRaw,
         importAesGcmKey,
         importHmacKey,
         unwrapKey,
         unwrapSecretWithToken,
         unwrapDecrypt,
         unwrapSign,
         importECDHPublicKey,
         ECDHDeriveEncrypt,
         ECDHDeriveSign,
         importAesKWKey,      
        } from "./CryptoUtils";

import './App.css';
import { getQueriesForElement } from "@testing-library/react";
import { AES } from "crypto-js";

const INVITE_URL = "https://localhost:7125/api/Transactions/Invite";
const REGISTER_URL = "https://localhost:7125/api/Transactions/Register";
const REKEY_URL = "https://localhost:7125/api/Transactions/Rekey";
const LOGIN_URL = "https://localhost:7125/api/Transactions/Login";
const SESSION_URL = "https://localhost:7125/api/Transactions/Session"; 

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
let g_rekeyTime;
let g_storedNONCE;
let g_storedTOKEN;
let g_storedSessionENCRYPTS;
let g_storedSessionSIGNS;

async function storeDeviceID(devideID) {
  g_storedDeviceID = devideID;
}

async function storePreENCRYPTS(LOGIN_ENCRYPTS) {
  g_storedLOGIN_ENCRYPTS = LOGIN_ENCRYPTS;
}

async function storePreSIGNS(LOGIN_SIGNS) {
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

async function storeSessionENCRYPTS(ENCRYPTS) {
  g_storedSessionENCRYPTS = ENCRYPTS;
}

async function storeSessionSIGNS(SIGNS) {
  g_storedSessionSIGNS = SIGNS;
}


async function getStoredPreENCRYPTS() {  
  let LOGIN_ENCRYPTS = [];
  for (let i = 0; i < g_storedLOGIN_ENCRYPTS.length; i++) {
    let cryptoKey = await importAesGcmKey(g_storedLOGIN_ENCRYPTS[i]);
    LOGIN_ENCRYPTS.push(cryptoKey);
  }
  return LOGIN_ENCRYPTS;
}

async function getStoredPreSIGNS() { 
  let LOGIN_SIGNS = [];
  for (let i = 0; i < g_storedLOGIN_SIGNS.length; i++) {
    let cryptoKey = await importHmacKey(g_storedLOGIN_SIGNS[i]);
    LOGIN_SIGNS.push(cryptoKey);
  }  
  return LOGIN_SIGNS;
}

async function storeRekeyTime(rekeyTime) {
  g_rekeyTime = rekeyTime;
}

async function storeNONCEInMem(NONCE) {
  g_storedNONCE = NONCE;
}

async function storeTOKENInMem(TOKEN) {
  g_storedTOKEN = TOKEN;
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

async function getReleyTime() {
    return g_rekeyTime;
}

async function getStoredNONCEFromMem() {
  return g_storedNONCE;
}

async function getStoredTOKENFromMem() {
  return g_storedTOKEN;
}

async function getStoredSessionENCRYPTS() { 
  /* 
  let ENCRYPTS = [];
  for (let i = 0; i < g_storedSessionENCRYPTS.length; i++) {
    let cryptoKey = await importAesGcmKey(g_storedSessionENCRYPTS[i]);
    ENCRYPTS.push(cryptoKey);
  }*/
  return g_storedSessionENCRYPTS;
}

async function getStoredSessionSIGNS() { 
  /*
  let SIGNS = [];
  for (let i = 0; i < g_storedSessionSIGNS.length; i++) {
    let cryptoKey = await importHmacKey(g_storedSessionSIGNS[i]);
    SIGNS.push(cryptoKey);
  } */ 
  return g_storedSessionSIGNS;
}


const invite = async() => {
   
  const numServers = NUM_SERVERS; 
  // we are using the device.CODE for the test app, but production app will 
  // allow any logged-in user to invite others

  // get device.CODE from the user that is making the invite
  const deviceCode = OWNER_CODE;
  
  // derive device.id + device.SECRET + device.SIGNS + device.ENCRYPTS
  const deviceID = await deriveRawID(deviceCode); 
  const deviceSECRET = await deriveRawSecret(deviceCode, deviceID);   
  
  // derive SIGNS[] + ENCRYPTS[] 
  const [deviceENCRYPTS, deviceSIGNS] = await deriveSignsAndEncryptsFromSecret(deviceSECRET, numServers);
  
  // create invite.CODE for new user DEVICE
  const inviteCode = INVITE_CODE; 
   
  //  derive invite.id + invite.SECRET + invite.SIGNS + invite.ENCRYPTS
  const inviteID = await deriveRawID(inviteCode); 
  const inviteSECRET = await deriveRawSecret(inviteCode, inviteID);
  const [inviteENCRYPTS, inviteSIGNS] = await deriveSignsAndEncryptsFromSecret(inviteSECRET, numServers);
  
  let encryptedInviteENCRYPTS = [];
  let encryptedInviteSIGNS = []
  encryptedInviteENCRYPTS.push(await exportCryptoKeyToRaw(inviteENCRYPTS[0]));
  encryptedInviteSIGNS.push(await exportCryptoKeyToRaw(inviteSIGNS[0]));
  for (let n = 1; n <= numServers; n++) {
    const rawInviteENCRYPT = await exportCryptoKeyToRaw(inviteENCRYPTS[n]);
    const encryptedIviteENCRYPT = await encrypt(rawInviteENCRYPT, deviceENCRYPTS[n], deviceID);
    encryptedInviteENCRYPTS.push(encryptedIviteENCRYPT);

    const rawInviteSIGN = await exportCryptoKeyToRaw(inviteSIGNS[n]);
    const encryptedInviteSIGN = await encrypt(rawInviteSIGN, deviceENCRYPTS[n], deviceID);
    encryptedInviteSIGNS.push(encryptedInviteSIGN);
  }

  // send invite.id + invite.SIGNS + invite.ENCRYPTS as invite transaction data... 
  // Compose transaction and send KEYS using OWN_KEYS
  // Encrypt Server elements (invite.ENCRYPTS & invite.SIGNS) with owner device.ENCRYPTS
  let inviteTransaction = {   
    inviteENCRYPTS: encryptedInviteENCRYPTS,
    inviteSIGNS: encryptedInviteSIGNS,
    inviteID 
  };

  // Send transaction to server
  let response = await encryptDataAndSendtoServer(deviceENCRYPTS, deviceSIGNS, deviceID, INVITE_URL, numServers, inviteTransaction);
  console.log("Response: ", response);  
}

const createNewSecretAndWKeys = async(numServers, deviceCode) => { 
  // NONCE  previously sent to server + TOKEN must be defined in memory before this block runs
  const NONCE = await getStoredNONCEFromMem();
  const TOKEN = await getStoredTOKENFromMem();

  // create new SECRET  
  const deviceID = await deriveRawID(deviceCode); 
  const deviceSECRET = await deriveRawSecret(deviceCode, deviceID);     
  
  // derive SIGNS[] + ENCRYPTS[]
  const [ENCRYPTS, SIGNS] = await deriveSignsAndEncryptsFromSecret(deviceSECRET, numServers);

  // store wSIGNS = SIGNS wrap by NONCE  
  let wSIGNS = [];
  for (let n = 0; n < SIGNS.length; n++) {   
    const wSIGN = await wrapKey(SIGNS[n], NONCE);
    wSIGNS.push(wSIGN);    
  }  
  await storeWSIGNS(wSIGNS);

  // store wENCRYPTS = ENCRYPTS wrap by NONCE
  let wENCRYPTS = [];
  for (let n = 0; n < ENCRYPTS.length; n++) {
    const wENCRYPT = await wrapKey(ENCRYPTS[n], NONCE);   
    wENCRYPTS.push(wENCRYPT);
  } 
  await storeWENCRYPTS(wENCRYPTS);
  
  // store wSECRET = SECRET wrap by TOKEN
  const wSECRET = await wrapKey(await importAesKWKey(deviceSECRET), TOKEN);
  await storeWSECRET(wSECRET); 
}

const register = async() => {
      
  const numServers = NUM_SERVERS;

  // the new user needs to open the web app in a browser, then register using the invite.CODE
  // get invite.CODE from the user
  const inviteCode = INVITE_CODE; 
   
  // derive device.id + device.SECRET
  const deviceID = await deriveRawID(inviteCode); 
  const deviceSECRET = await deriveRawSecret(inviteCode, deviceID);

  // derive device.SIGNS + device.ENCRYPTS
  const [deviceENCRYPTS, deviceSIGNS] = await deriveSignsAndEncryptsFromSecret(deviceSECRET, numServers);
 
  // store device.id  
  await storeDeviceID(deviceID);

  // create TOKEN + NONCE as 256 bits keys
  const TOKEN = await generateAesKWKey(); 
  const NONCE = await generateAesKWKey();

  await storeTOKENInMem(TOKEN);
  await storeNONCEInMem(NONCE);

  const rawNONCE = await exportCryptoKeyToRaw(NONCE);

  // create PASSWORD as TEXT entered by the new user on their device
  const PASSWORD = MY_PASSWORD;
  
  // derive PASSKEY FROM PASSWORD using PBKDF2
  const PASSKEY = await derivePBKDF2Key(PASSWORD);

  // wTOKEN = wrap TOKEN with PASSKEY using AES-KW
  const wTOKEN = await wrapKey(TOKEN, PASSKEY);

  // DS = create ECDSA key pair
  const DS = await generateECDSAKeyPair();

  // DE = create ECDH key pair
  const DE = await generateECDHKeyPair();

  // store DS.PRIV + DE.PRIV
  const DS_PRIV = await exportCryptoKeyToJwk(DS.privateKey);
  const DE_PRIV = await exportCryptoKeyToJwk(DE.privateKey);
  await storeDS_PRIV(DS_PRIV);
  await storeDE_PRIV(DE_PRIV);  

  // send wTOKEN + NONCE + device.id as Register transaction data 
  let registerTransaction = {
    wTOKEN, 
    NONCE: rawNONCE,
    deviceID 
  };
  
  let response = await encryptDataAndSendtoServer(deviceENCRYPTS, deviceSIGNS, deviceID, REGISTER_URL, numServers, registerTransaction);
  console.log("response: ", response);  
  await createNewSecretAndWKeys(numServers, inviteCode);
} 

const rekey  = async() => { 

  const numServers = NUM_SERVERS;

  // store rekeyTime = timeNow
  const timeNow = Date.now();
  const rekeyTime = timeNow;
  await storeRekeyTime(rekeyTime);

  // get wSIGNS + wENCRYPTS from local storage
  const wENCRYPTS = await getStoredWENCRYPTS();
  const wSIGNS = await getStoredWSIGNS();
  // get NONCE stored prevously in memory to uwrap the wKEYS
  const oldNONCE = await getStoredNONCEFromMem();
  // get deviceID
  const deviceID = await getStoredDeviceID();

  // unrwap wSIGNS with oldNONCE
  let SIGNS = [];
  for (let n = 0; n < wSIGNS.length; n++) {
    const SIGN = await unwrapSign(wSIGNS[n], oldNONCE);
    SIGNS.push(SIGN);
  }
 
  // unrwap wENCRYPTS with oldNONCE
  let ENCRYPTS = [];
  for (let n = 0; n < wENCRYPTS.length; n++) {
    const ENCRYPT = await unwrapDecrypt(wENCRYPTS[n], oldNONCE);
    ENCRYPTS.push(ENCRYPT);
  }

  // create NONCE
  const NONCE = await generateAesKWKey();
  const rawNONCE = await exportCryptoKeyToRaw(NONCE);

  // DS = create ECDSA key pair
  const DS = await generateECDSAKeyPair();

  // DE = create ECDH key pair 
  const DE = await generateECDHKeyPair();

  // store DS.PRIV +  DE.PRIV
  const DS_PRIV = await exportCryptoKeyToJwk(DS.privateKey);
  const DE_PRIV = await exportCryptoKeyToJwk(DE.privateKey);
  await storeDS_PRIV(DS_PRIV);
  await storeDE_PRIV(DE_PRIV);

  const DS_PUB = await exportCryptoKeyToRaw(DS.publicKey);
  const DE_PUB = await exportCryptoKeyToRaw(DE.publicKey);

  // send DS.PUB + DE.PUB + wSIGNS + wENCRYPTS + NONCE  as Rekey transaction data 
  let rekeyTransaction = {  
    DS_PUB,
    DE_PUB, 
    wSIGNS,
    wENCRYPTS, 
    NONCE: rawNONCE
  };

  let response = await encryptDataAndSendtoServer(ENCRYPTS, SIGNS, deviceID, REKEY_URL, numServers, rekeyTransaction);
  
  const SE_PUB = response.SE_PUB;
  const wTOKEN = response.wTOKEN;
  
  // LOGINS[0] = device. SIGNS[0]
  // for each (n), store LOGINS[n] = ECDH.derive (DE.PRIV, SE.PUB[n])
  let preENCRYPTS = [];
  let preSIGNS = [];
  for (let n = 0; n <= numServers; n++) {
    const cryptoKeySE_PUB = await importECDHPublicKey(new Uint8Array(SE_PUB[n]).buffer);
   
    const derivedEncrypt = await ECDHDeriveEncrypt(DE.privateKey, cryptoKeySE_PUB);
    preENCRYPTS.push(derivedEncrypt);   
   
    const derivedSign = await ECDHDeriveSign(DE.privateKey, cryptoKeySE_PUB);
    preSIGNS.push(derivedSign); 
  }

  await storePreENCRYPTS(preENCRYPTS);
  await storePreSIGNS(preSIGNS);

  const deviceCode = INVITE_CODE; 
  await createNewSecretAndWKeys(numServers, deviceCode);  
}

const login = async() => {
  
  // We have 3 servers 
  const numServers = NUM_SERVERS;
  
  // get LOGINS[] for device from storage
  // SIGNS[] = ENCRYPTS[] = LOGINS[] for login transaction processing
  const deviceID = await getStoredDeviceID();
  const LOGIN_ENCRYPTS = await getStoredPreENCRYPTS();
  const LOGIN_SIGNS = await getStoredPreSIGNS();
  const NONCE = await getStoredNONCEFromMem();
  const rawNONCE = await exportCryptoKeyToRaw(NONCE);

  // send wSIGNS + wENCRYPTS as login transaction data
  const wENCRYPTS = await getStoredWENCRYPTS();
  const wSIGNS = await getStoredWSIGNS();

  // send DS.PUB + DE.PUB + wKEYS + NONCE
  let loginTransaction = {
    wENCRYPTS,
    wSIGNS,  
    NONCE: rawNONCE
  };

  console.log("Sent Data: ", loginTransaction);

  let response = await encryptDataAndSendtoServer(LOGIN_ENCRYPTS, LOGIN_SIGNS, deviceID, LOGIN_URL, numServers, loginTransaction);
  console.log("Response: ", response); 

  const wTOKEN = new Uint8Array(response.wTOKEN);  

  //  get PASSWORD, wSECRET
  const PASSWORD = MY_PASSWORD;
  const PASSKEY = await derivePBKDF2Key(PASSWORD);
  const wSECRET = await getStoredWSECRET();

  // TOKEN = unwrap wTOKEN with PASSWORD  
  const TOKEN = await unwrapKey(wTOKEN, PASSKEY);

  // SECRET = unwrap wSECRET with TOKEN
  const SECRET = await exportCryptoKeyToRaw(await unwrapSecretWithToken(wSECRET, TOKEN)); 
  
  // derive SIGNS + ENCRYPTS from SECRET + store in session memory  
  const [ ENCRYPTS, SIGNS ] = await deriveSignsAndEncryptsFromSecret(SECRET, numServers);

  // Convert the CryptoKeys to a storable format before saving
  //const exportedSigns = await Promise.all(SIGNS.map(async (sign) => await exportCryptoKeyToRaw(sign)));
  //const exportedEncrypts = await Promise.all(ENCRYPTS.map(async (encrypt) => await exportCryptoKeyToRaw(encrypt)));
  
  // Store 'signs' and 'encrypts' in session memory
  //sessionStorage.setItem('signs', JSON.stringify(exportedSigns));
  //sessionStorage.setItem('encrypts', JSON.stringify(exportedEncrypts));
  await storeSessionENCRYPTS(ENCRYPTS);
  await storeSessionSIGNS(SIGNS);

  // Check if rekey is needed
  const REKEY_PERIOD = 1000 * 60 * 60 * 24; // 24 hours for example
  const timeNow = Date.now();
  const rekeyTime = await getReleyTime();
  if (rekeyTime + REKEY_PERIOD <= timeNow) {
    //await rekey(TOKEN); // Call rekey with the TOKEN
  }
 
} 

const session = async() => {

  const ENCRYPTS = await getStoredSessionENCRYPTS();
  const SIGNS = await getStoredSessionSIGNS();
  const deviceID = await getStoredDeviceID();

  const MSG = "HELLO!";
  let sessionTransaction = {
    MSG
  };

  // Send transaction to server
  let response = await encryptDataAndSendtoServer(ENCRYPTS, SIGNS, deviceID, SESSION_URL, NUM_SERVERS, sessionTransaction);
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
      <button onClick={rekey}>Rekey</button>
      <button onClick={login}>Login</button>
      <button onClick={session}>Session</button>
    </header>
  </div>

    
  );
}

export default App;
