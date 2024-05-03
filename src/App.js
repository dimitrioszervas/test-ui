import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import cbor from 'cbor-js';
//import { encryptDataAndSendtoServer } from './protocoltest';
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
         convertBytesToBase64,
         convertBase64ToBytes 
        } from "./CryptoUtils";

import './App.css';
import { getQueriesForElement } from "@testing-library/react";
import { AES } from "crypto-js";

const INVITE_URL = "https://localhost:7125/api/Transactions/Invite";
const REGISTER_URL = "https://localhost:7125/api/Transactions/Register";
const REKEY_URL = "https://localhost:7125/api/Transactions/Rekey";
const LOGIN_URL = "https://localhost:7125/api/Transactions/Login";
const SESSION_URL = "https://localhost:7125/api/Transactions/Session"; 


const NUM_SERVERS=3;
const OWNER_CODE = "1234";
const INVITE_CODE = "5678"
const numServers= NUM_SERVERS;
const MY_PASSWORD = "Password";


let wrapKeyWithKeyAesKW;
//let rekeyOperation;
let wrapKeyWithNonceOrToken;

function App() {
  const [loginKeys, setLoginKeys] = useState({ encrypts: null, signs: null });
  const [deviceCode, setDeviceCode] = useState("1234");
  const [inviteCode, setInviteCode] = useState('');
  const [password, setPassword] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [transactionData, setTransactionData]= useState({});
  

  useEffect(() => {
    const rekeyIfNeeded = async () => {
      const rekeyPeriod = 1000 * 60 * 60 * 24; 
      const rekeyTime = new Date(localStorage.getItem('rekeyTime'));
      const timeNow = new Date();
      if (rekeyTime && (rekeyTime.getTime() + rekeyPeriod) > timeNow.getTime()) {
        const TOKEN = await getTokenFromSession(); 
        await handleRekeyWithToken(TOKEN); 
      }
    };

    rekeyIfNeeded();
  }, []);

const handleInvite = async () => {
     
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
};

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

const handleRegisterWithInvite = async (inviteCode, password) => {
      
  const numServers = NUM_SERVERS;

  // the new user needs to open the web app in a browser, then register using the invite.CODE
  // get invite.CODE from the user
  //const inviteCode = INVITE_CODE; 
   
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
  const PASSWORD = password;//MY_PASSWORD;
  
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
};

const handleRekeyWithToken = async (TOKEN) => {

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

const handleLogin = async () => {
 
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
  };
   
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

async function getTokenFromSession() {
  // Implement according to your session management logic
  return localStorage.getItem('sessionToken'); 
}

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 10); 
}

async function storeDeviceID(deviceID) { 
  let str = await convertBytesToBase64(deviceID); 
  localStorage.setItem("deviceID", str);
}

async function storePreENCRYPTS(preENCRYPTS) {
  let array = [];
  for (let i = 0; i < preENCRYPTS.length; i++) {
    let base64 = await convertBytesToBase64(preENCRYPTS[i]); 
    array.push(base64);
  }

  localStorage.setItem("preENCRYPTS", array.toString());
}

async function storePreSIGNS(preSIGNS) {
  let array = [];
  for (let i = 0; i < preSIGNS.length; i++) {
    let base64 = await convertBytesToBase64(preSIGNS[i]); 
    array.push(base64);
  }

  localStorage.setItem("preSIGNS", array.toString());
}

async function storeDS_PRIV(DS_PRIV) {
  const jwkString = JSON.stringify(DS_PRIV);
  localStorage.setItem("DS_PRIV", jwkString);
}

async function storeDE_PRIV(DE_PRIV) {
  const jwkString = JSON.stringify(DE_PRIV);
  localStorage.setItem("DE_PRIV", jwkString);
}

async function storeSE_PUB(SE_PUB) {
  const jwkString = JSON.stringify(SE_PUB);
  localStorage.setItem("SE_PUB", jwkString);
}

async function storeWSECRET(wSECRET) {
  let str = await convertBytesToBase64(wSECRET); 
  localStorage.setItem("wSECRET", str);
}

async function storeWENCRYPTS(wENCRYPTS) {
  let array = [];
  for (let i = 0; i < wENCRYPTS.length; i++) {
    let base64 = await convertBytesToBase64(wENCRYPTS[i]); 
    array.push(base64);
  }

  localStorage.setItem("wENCRYPTS", array.toString());
}

async function storeWSIGNS(wSIGNS) {
  let array = [];
  for (let i = 0; i < wSIGNS.length; i++) {
    let base64 = await convertBytesToBase64(wSIGNS[i]); 
    array.push(base64);
  }

  localStorage.setItem("wSIGNS", array.toString());
}

async function getStoredDeviceID() {
  let str = localStorage.getItem("deviceID"); 
  let uint8arr = await convertBase64ToBytes(str); 
  return uint8arr;
}

async function storeSessionENCRYPTS(sessionENCRYPTS) {
  let array = [];
  for (let i = 0; i < sessionENCRYPTS.length; i++) {
    let raw = await exportCryptoKeyToRaw(sessionENCRYPTS[i]);
    let base64 = await convertBytesToBase64(raw); 
    array.push(base64);
  }

  localStorage.setItem("sessionENCRYPTS", array.toString());

}

async function storeSessionSIGNS(sessionSIGNS) {
  let array = [];
  for (let i = 0; i < sessionSIGNS.length; i++) {
    let raw = await exportCryptoKeyToRaw(sessionSIGNS[i]);
    let base64 = await convertBytesToBase64(raw); 
    array.push(base64);
  }

  localStorage.setItem("sessionSIGNS", array.toString());

}

async function getStoredPreENCRYPTS() {  
  
  let str = localStorage.getItem("preENCRYPTS");
  let array = str.split(',');

  let preENCRYPTS = []
  for (let i=0; i<array.length; i++) {
    let cryptoKey = await importAesGcmKey(await convertBase64ToBytes(array[i]));
    preENCRYPTS.push(cryptoKey);
  }

  return preENCRYPTS;
}

async function getStoredPreSIGNS() {  
    let str = localStorage.getItem("preSIGNS");
    let array = str.split(',');
  
    let preSIGNS = []
    for (let i=0; i<array.length; i++) {
      let cryptoKey = await importHmacKey(await convertBase64ToBytes(array[i]));
      preSIGNS.push(cryptoKey);
    }  
    return preSIGNS;
}

async function storeRekeyTime(rekeyTime) {
  localStorage.setItem("rekeyTime", rekeyTime.toString());
}

async function storeNONCEInMem(NONCE) {
  let raw = await exportCryptoKeyToRaw(NONCE);
  let str = await convertBytesToBase64(raw);
  localStorage.setItem("NONCE", str);
}

async function storeTOKENInMem(TOKEN) {
  let raw = await exportCryptoKeyToRaw(TOKEN);
  let str = await convertBytesToBase64(raw);
  localStorage.setItem("TOKEN", str);
}

async function getStoredDS_PRIV() {
  return JSON.parse(localStorage.getItem("DS_PRIV"));
}

async function getStoredDE_PRIV() {
  return JSON.parse(localStorage.getItem("DE_PRIV"));
}

async function getStoredSE_PUB() {
  return JSON.parse(localStorage.getItem("SE_PUB"));
}

async function getStoredWSECRET() {
  let str = localStorage.getItem("wSECRET"); 
  let uint8arr = await convertBase64ToBytes(str); 
  return uint8arr;
}

async function getStoredWENCRYPTS() {

  let str = localStorage.getItem("wENCRYPTS");
  let array = str.split(',');

  let wENCRYPTS = []
  for (let i=0; i<array.length; i++) {
    wENCRYPTS.push(await convertBase64ToBytes(array[i]));
  }

  return wENCRYPTS;
}

async function getStoredWSIGNS() {

  let str = localStorage.getItem("wSIGNS");
  let array = str.split(',');

  let wSIGNS = []
  for (let i=0; i<array.length; i++) {
    wSIGNS.push(await convertBase64ToBytes(array[i]));
  }

  return wSIGNS;
}

async function getReleyTime() {
    return Number.parseInt(localStorage.getItem("rekeyTime"));
}

async function getStoredNONCEFromMem() {  
  let str = localStorage.getItem("NONCE"); 
  let uint8arr = await convertBase64ToBytes(str); 
  return await importAesKWKey(uint8arr);
}

async function getStoredTOKENFromMem() {
  let str = localStorage.getItem("TOKEN"); 
  let uint8arr = await convertBase64ToBytes(str); 
  return await importAesKWKey(uint8arr);
}

async function getStoredSessionENCRYPTS() { 
  let str = localStorage.getItem("sessionENCRYPTS");
  let array = str.split(',');

  let sessionENCRYPTS = []
  for (let i=0; i<array.length; i++) {
    let cryptoKey = await importAesGcmKey(await convertBase64ToBytes(array[i]));
    sessionENCRYPTS.push(cryptoKey);
  }

  return sessionENCRYPTS;
}

async function getStoredSessionSIGNS() { 
  let str = localStorage.getItem("sessionSIGNS");
  let array = str.split(',');

  let sessionSIGNS = []
  for (let i=0; i<array.length; i++) {
    let cryptoKey = await importHmacKey(await convertBase64ToBytes(array[i]));
    sessionSIGNS.push(cryptoKey);
  }  
  return sessionSIGNS;
}


return (
  <div className="App">
    <header className="App-header">
      <h1>Secure Transaction System</h1>
      <div>
        <input
          type="text"
          value={deviceCode}
          onChange={(e) => setDeviceCode(e.target.value)}
          placeholder="Enter Device Code"
        />
        <input
          type="text"
          placeholder="Enter Invite Code for Registration"
          onChange={(e) => setInviteCode(e.target.value)}
        />
        <input
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="Generate Invite Code"
        />
        <button onClick={handleInvite}>Generate and Send Invite</button>
        <input
          type="password"
          placeholder="Enter Password for Registration"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={() => handleRegisterWithInvite(inviteCode, password)}>Register with Invite</button>
        <button onClick={() => handleRekeyWithToken()}>Rekey with Token</button>
        <button onClick={handleLogin}>Login</button>
        
        <div>
          <input
            type="text"
            placeholder="Enter Transaction Data"
            onChange={(e) => setTransactionData(JSON.parse(e.target.value || '{}'))}
          />
          <button onClick={session}>Start Session and Send Transaction</button>
        </div>
      </div>
    </header>
  </div>
);
}


export default App;
