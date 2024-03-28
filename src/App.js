import { encryptDataAndSendtoServer } from "./protocol";
import { deriveKeys,         
         generateAesKW256BitsKeyForWrapAndUnwrap, 
         derivePBKDF2Key256ForWrapAndUnwrap, 
         wrapKeyWithKeyAesKW, 
         generateECDSAKeyPair, 
         generateECDHKeyPair,           
         exportCryptoKeyToJwk,
         exportCryptoKeyToRaw,
         importRawAESGCMEcryptAndDecryptKey,
         importHMACSignAndVerifyKey,
         unwrapKeyWithKeyAesKWForWarpAndUnwrap,
         unwrapSecretWithToken,
         unwrapDecrypt,
         unwrapSign,
         importECDHPublicKey,
         ECDHDeriveEncrypt,
         ECDHDeriveSign,

        } from "./CryptoUtils";

import './App.css';
import { getQueriesForElement } from "@testing-library/react";
import { AES } from "crypto-js";

const INVITE_URL = "https://localhost:7125/api/Transactions/Invite";
const REGISTER_URL = "https://localhost:7125/api/Transactions/Register";
const REKEY_URL = "https://localhost:7125/api/Transactions/Rekey";
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
let g_rekeyTime;
let g_storedNONCE;
let g_storedTOKEN;

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
  let LOGIN_ENCRYPTS = [];
  for (let i = 0; i < g_storedLOGIN_ENCRYPTS.length; i++) {
    let cryptoKey = await importRawAESGCMEcryptAndDecryptKey(g_storedLOGIN_ENCRYPTS[i]);
    LOGIN_ENCRYPTS.push(cryptoKey);
  }
  return LOGIN_ENCRYPTS;
}

async function getStoredLOGIN_SIGNS() { 
  let LOGIN_SIGNS = [];
  for (let i = 0; i < g_storedLOGIN_SIGNS.length; i++) {
    let cryptoKey = await importHMACSignAndVerifyKey(g_storedLOGIN_SIGNS[i]);
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
  let inviteENCRYPTSRaw = [];
  let inviteSIGNSRaw = [];
  for (let n = 0; n <= numServers; n++) {
    inviteENCRYPTSRaw.push(await exportCryptoKeyToRaw(inviteENCRYPTS[n]));     
    inviteSIGNSRaw.push(await exportCryptoKeyToRaw(inviteSIGNS[n]));      
  }

  // Compose transaction and send KEYS using OWN_KEYS
  let inviteTransanction = {   
    inviteENCRYPTS: inviteENCRYPTSRaw,
    inviteSIGNS: inviteSIGNSRaw,
    inviteID: inviteID 
  };

  // Send transaction to server
  let response = await encryptDataAndSendtoServer(deviceENCRYPTS, deviceSIGNS, deviceID, INVITE_URL, numServers, inviteTransanction);
  console.log("Response: ", response);  
}

const createNewSecretAndWKeys = async(numServers, deviceCode) => { 
  // NONCE  previously sent to server + TOKEN must be defined in memory before this block runs
  const NONCE = await getStoredNONCEFromMem();
  const TOKEN = await getStoredTOKENFromMem();

  // create new SECRET
  const SECRET = await derivePBKDF2Key256ForWrapAndUnwrap(deviceCode);
     
  // derive SIGNS[] + ENCRYPTS[]
  const [ENCRYPTS, SIGNS, ] = await deriveKeys(deviceCode, numServers);

  // store wSIGNS = SIGNS wrap by NONCE  
  let wSIGNS = [];
  for (let n = 0; n < SIGNS.length; n++) {   
    const wSIGN = await wrapKeyWithKeyAesKW(SIGNS[n], NONCE);
    wSIGNS.push(wSIGN);    
  }  
  await storeWSIGNS(wSIGNS);

  // store wENCRYPTS = ENCRYPTS wrap by NONCE
  let wENCRYPTS = [];
  for (let n = 0; n < ENCRYPTS.length; n++) {
    const wENCRYPT = await wrapKeyWithKeyAesKW(ENCRYPTS[n], NONCE);   
    wENCRYPTS.push(wENCRYPT);
  } 
  await storeWENCRYPTS(wENCRYPTS);

  // store wSECRET = SECRET wrap by TOKEN
  const wSECRET = await wrapKeyWithKeyAesKW(SECRET, TOKEN);
  await storeWSECRET(wSECRET);
}

const register = async() => {
      
  const numServers = NUM_SERVERS;

  // the new user needs to open the web app in a browser, then register using the invite.CODE
  // get invite.CODE from the user
  const deviceCode = INVITE_CODE; 
   
  // derive device.id + device.SECRET 
  // derive device.SIGNS + device.ENCRYPTS
  const [deviceENCRYPTS, deviceSIGNS, deviceID] = await deriveKeys(deviceCode, numServers);
 
  // store device.id  
  await storeDeviceID(deviceID); 

  // create TOKEN + NONCE as 256 bits keys
  const TOKEN = await generateAesKW256BitsKeyForWrapAndUnwrap(); 
  const NONCE = await generateAesKW256BitsKeyForWrapAndUnwrap();

  await storeTOKENInMem(TOKEN);
  await storeNONCEInMem(NONCE);

  const rawNONCE = await exportCryptoKeyToRaw(NONCE);

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

  // store DS.PRIV + DE.PRIV
  const DS_PRIV = await exportCryptoKeyToJwk(DS.privateKey);
  const DE_PRIV = await exportCryptoKeyToJwk(DE.privateKey);
  await storeDS_PRIV(DS_PRIV);
  await storeDE_PRIV(DE_PRIV);  

  // send wTOKEN + NONCE + device.id as Register transaction data 
  let registerTransanction = {
    wTOKEN, 
    NONCE: rawNONCE,
    deviceID
  };

  let response = await encryptDataAndSendtoServer(deviceENCRYPTS, deviceSIGNS, deviceID, REGISTER_URL, numServers, registerTransanction);
  console.log("response: ", response);  
  await createNewSecretAndWKeys(numServers, deviceCode);
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
  const NONCE = await generateAesKW256BitsKeyForWrapAndUnwrap();
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
  let rekeyTransanction = {  
    DS_PUB,
    DE_PUB, 
    wSIGNS,
    wENCRYPTS, 
    NONCE: rawNONCE
  };

  let response = await encryptDataAndSendtoServer(ENCRYPTS, SIGNS, deviceID, REKEY_URL, numServers, rekeyTransanction);
  
  const SE_PUB = response.SE_PUB;
  const wTOKEN = response.wTOKEN;
  
  // LOGINS[0] = device. SIGNS[0]
  // for each (n), store LOGINS[n] = ECDH.derive (DE.PRIV, SE.PUB[n])
  let LOGIN_ENCRYPTS = [];
  let LOGIN_SIGNS = [];
  for (let n = 0; n <= numServers; n++) {
    const cryptoKeySE_PUB = await importECDHPublicKey(new Uint8Array(SE_PUB[n]).buffer);
   
    const derivedEncrypt = await ECDHDeriveEncrypt(DE.privateKey, cryptoKeySE_PUB);
    LOGIN_ENCRYPTS.push(derivedEncrypt);   
   
    const derivedSign = await ECDHDeriveSign(DE.privateKey, cryptoKeySE_PUB);
    LOGIN_SIGNS.push(derivedSign); 
  }

  await storeLOGIN_ENCRYPTS(LOGIN_ENCRYPTS);
  await storeLOGIN_SIGNS(LOGIN_SIGNS);

  const deviceCode = INVITE_CODE; 
  await createNewSecretAndWKeys(numServers, deviceCode);  
}

const login = async() => {
  
  // We have 3 servers 
  const numServers = NUM_SERVERS;
  
  // get LOGINS[] for device from storage
  // SIGNS[] = ENCRYPTS[] = LOGINS[] for login transaction processing
  const deviceID = await getStoredDeviceID();
  const LOGIN_ENCRYPTS = await getStoredLOGIN_ENCRYPTS();
  const LOGIN_SIGNS = await getStoredLOGIN_SIGNS();
  const NONCE = await getStoredNONCEFromMem();
  const rawNONCE = await exportCryptoKeyToRaw(NONCE);

  // send wSIGNS + wENCRYPTS as login transaction data
  const wENCRYPTS = await getStoredWENCRYPTS();
  const wSIGNS = await getStoredWSIGNS();

  // send DS.PUB + DE.PUB + wKEYS + NONCE
  let loginTransanction = {
    wENCRYPTS,
    wSIGNS,  
    NONCE: rawNONCE
  };

  console.log("Sent Data: ", loginTransanction);

  let response = await encryptDataAndSendtoServer(LOGIN_ENCRYPTS, LOGIN_SIGNS, deviceID, LOGIN_URL, numServers, loginTransanction);
  console.log("Response: ", response); 

  const wTOKEN = new Uint8Array(response.wTOKEN);  

  //  get PASSWORD, wSECRET
  const PASSWORD = MY_PASSWORD;
  const PASSKEY = await derivePBKDF2Key256ForWrapAndUnwrap(PASSWORD);
  const wSECRET = await getStoredWSECRET();

  // TOKEN = unwrap wTOKEN with PASSWORD  
  const TOKEN = await unwrapKeyWithKeyAesKWForWarpAndUnwrap(wTOKEN, PASSKEY);

  // SECRET = unwrap wSECRET with TOKEN
  const SECRET = await unwrapSecretWithToken(wSECRET, TOKEN); 
  
  // derive SIGNS + ENCRYPTS from SECRET + store in session memory

  // if rekeyTime + rekeyPeriod > timeNow then call rekey(TOKEN)

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
    </header>
  </div>

    
  );
}

export default App;
