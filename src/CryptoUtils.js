// Helper function to encode text to Uint8Array
const textToBytes = (text) => new TextEncoder().encode(text);

export async function generateRawKey() {

  let key = await window.crypto.subtle.generateKey(
    {
      name: "AES-KW",
      length: 256,
    },
    true, //whether the key is extractable (i.e. can be used in exportKey)
    ["unwrapKey", "unwrapKey"]
  );

  return await exportCryptoKeyToRaw(key);
}

export async function importHKDFKey(rawkey) {
  return await window.crypto.subtle.importKey(
    "raw",
    rawkey,
    { name: 'HKDF' },
    false,
    ["deriveKey", "deriveBits"]
  );
}

export async function deriveRawID(code) {
  
  const hashed = await window.crypto.subtle.digest('SHA-256', textToBytes(code));
  
  const hkdfKey = await window.crypto.subtle.importKey(
    "raw",
    hashed,
    { name: 'HKDF' },
    false,
    ["deriveKey", "deriveBits"]
  );
 
  let salt = textToBytes("");
  
  const result = await deriveRawKey(hkdfKey, salt, textToBytes("ID"), 64);

  return new Uint8Array(result);
}

export async function deriveRawSecret(code, ID) {
  
  const hashed = await window.crypto.subtle.digest('SHA-256', textToBytes(code));
  
  const hkdfKey = await window.crypto.subtle.importKey(
    "raw",
    hashed,
    { name: 'HKDF' },
    false,
    ["deriveKey", "deriveBits"]
  );

  const result = await deriveRawKey(hkdfKey, ID, textToBytes("SECRET"), 256);

  return new Uint8Array(result);
}

export const importECDHPublicKey = async (rawPublicKey) => {
  // import raw public key (uncompressed format)
  const importedPublicKey = await window.crypto.subtle.importKey(
    "raw", 
    rawPublicKey, // valid raw public key in uncompressed format
    { name: "ECDH", namedCurve: "P-256" },
    false,                          
    [] // empty list
  ); 
  return importedPublicKey;
};

export const importECDHKey = async (rawkey) => {
  return await window.crypto.subtle.importKey(
    "raw",
    rawkey,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );
};

// Function to import a Jwk HKDF Key for deriving keys 
export const importJwkHKDFKey = async (keyData) => {
  return await window.crypto.subtle.importKey(
    'jwk',
    keyData,
    { name: 'HKDF',  namedCurve: "P-256" },
    false,
    ['deriveKey']
  );
};

// Function to derive bits using HKDF
const deriveRawKey = async (hkdfKey, salt, info, bits) => {
  return await window.crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt,
      info: info,
    },
    hkdfKey,
    bits
  );
};

const deriveHmacKey = async (hkdfKey, salt, info) => {
  return await window.crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt,
      info: info,
    },  
    hkdfKey,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    true,
    ["sign", "verify"]
  );
};

const deriveAesGcmKey = async (hkdfKey, salt, info) => {
  return await window.crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt,
      info: info,
    },   
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

export const deriveID = async (code)=> {
  let key = await importHKDFKey(textToBytes(code)); 
  const ab = await deriveRawKey(key, textToBytes(""), "id", 64);
  return new Uint8Array(ab);
}

// Function to generate n keys of a specific type (sign or encrypt)
const generateNKeys = async (n, salt, type, baseKey) => {
  try { 
    let keys = [];

    for (let i = 0; i <= n; i++) {
      let key;
      if (type === "sign") { 
        key = await deriveHmacKey(baseKey, salt, textToBytes("SIGNS" + i));
      }
      else { 
        key = await deriveAesGcmKey(baseKey, salt, textToBytes("ENCRYPTS" + i));
      }
           
      keys.push(key);
    }
    return keys;
  } catch (error) {
    console.error(`Error in generateNKeys for ${type}:`, error.message);
    throw error;
  }
};

// Function to encrypt a shard with a given CryptoKey
export async function encrypt(dataToEncrypt, cryptoKey, src) {

  let iv = new Uint8Array(12);
  for (let i = 0; i < src.length; i++) {
    iv[i] = src[i];
  }

  const algo = { name: "AES-GCM", iv: iv, tagLength: 128 };
  const ciphertext = await crypto.subtle.encrypt(algo, cryptoKey, dataToEncrypt);
  return new Uint8Array(ciphertext);
}

// Function to calculate HMAC using a given CryptoKey
export async function calculateHMAC(data, cryptoKey) {
  const algo = { name: "HMAC", hash: "SHA-256" };
  const signature = await crypto.subtle.sign(algo, cryptoKey, new Uint8Array(data));
  return new Uint8Array(signature).buffer;
}
  
export async function exportCryptoKeyToRaw(key) {
  const exportedKey = await window.crypto.subtle.exportKey("raw", key);
  return new Uint8Array(exportedKey);
}

export async function exportCryptoKeyToJwk(key) {
  const exportedleKey = await window.crypto.subtle.exportKey("jwk", key);
  return exportedleKey;
}

export async function exportCryptoKeyToPKCS8(key) {
  const exportedKey = await window.crypto.subtle.exportKey("pkcs8", key);
  return exportedKey;
}

export async function importAesGcmKey(keyData) {
  const importedKey = await window.crypto.subtle.importKey(
    "raw",
    keyData,
    { 
       name: "AES-GCM", 
        length: 256
    },
    true,
    ["encrypt", "decrypt"]
  );

  return importedKey;
} 

export async function ECDHDeriveEncrypt(privateKey, publicKey) { 
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "ECDH",       
      public: publicKey,
    },
    privateKey,
    {
      name: "AES-GCM",      
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
  
  const rawKey = await exportCryptoKeyToRaw(derivedKey);

  const hashed = await window.crypto.subtle.digest('SHA-256', rawKey.buffer);

  const importedKey = await importAesGcmKey(hashed);

  return await exportCryptoKeyToRaw(importedKey);
}

export async function importHmacKey(rawkey) {
  const importedKey = await window.crypto.subtle.importKey(
    "raw",
    rawkey,
    { 
      name: "HMAC", 
      hash: "SHA-256",
      length: 256,
    },
    true,
    ["sign", "verify"]
  );

  return importedKey;
}

export async function ECDHDeriveSign(privateKey, publicKey) { 
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: publicKey,
    },
    privateKey,
    {
      name: "HMAC", 
      hash: "SHA-256",
      length: 256,
    },
    true,
    ["sign", "verify"],
  );
 
  const rawKey = await exportCryptoKeyToRaw(derivedKey);

  const hashed = await window.crypto.subtle.digest('SHA-256', rawKey.buffer);

  const importedKey = await importHmacKey(hashed);

  return await exportCryptoKeyToRaw(importedKey);
}

export async function generateAesKWKey() {
  let key = await window.crypto.subtle.generateKey(
    {
      name: "AES-KW",
      length: 256,
    },
    true, //whether the key is extractable (i.e. can be used in exportKey)
    ["wrapKey", "unwrapKey"]
  );

  return key;
}

export async function importAesKWKey(rawkey) {
  let key = await window.crypto.subtle.importKey(
    "raw",
    rawkey,
    {
      name: "AES-KW",
      length: 256,
    },
    true, //whether the key is extractable (i.e. can be used in exportKey)
    ["wrapKey", "unwrapKey"]
  );

  return key;
}

async function importPBKD2Key(text) {  
  const enc = new TextEncoder();
  return await window.crypto.subtle.importKey(
    "raw",
    enc.encode(text),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );
}

export async function derivePBKDF2Key(text) {
  const keyMaterial = await importPBKD2Key(text);
  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new Uint8Array(8),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-KW", length: 256 },
    true,
    ["wrapKey", "unwrapKey"],
  );
}

export async function wrapKey(keyToWrap, wrappingKey) {
  const keyAB = await window.crypto.subtle.wrapKey("raw", keyToWrap, wrappingKey, "AES-KW");
  return new Uint8Array(keyAB);
}

export async function unwrapKey(keyToUnwrap, wrappingKey) {
  return await window.crypto.subtle.unwrapKey(
    "raw", 
    keyToUnwrap, wrappingKey,  
    "AES-KW", // algorithm identifier for key encryption key
    "AES-KW", // algorithm identifier for key to unwrap
    true, // extractability of key to unwrap
    ["wrapKey", "unwrapKey"], // key usages for key to unwrap
  );
}

export async function unwrapSecretWithToken(wSECRET, TOKEN) { 
  return await window.crypto.subtle.unwrapKey(
    "raw",
    wSECRET,
    TOKEN,
    {
      name: "AES-KW" // algorithm identifier for key encryption key
    },
    {
      name: "AES-KW", // algorithm identifier for key to unwrap
      length: 256 // Assuming the key length is 256 bits, adjust if necessary
    },
    true,     // extractability of key to unwrap
    ["wrapKey", "unwrapKey"] // key usages for key to unwrap
  );
}

export async function unwrapSign(keyToUnwrap, wrappingKey) {
  return await window.crypto.subtle.unwrapKey(
    "raw", 
    keyToUnwrap, wrappingKey,  
    "AES-KW", // algorithm identifier for key encryption key
    {
      name: "HMAC", 
      hash: "SHA-256",
      length: 256,
    }, // algorithm identifier for key to unwrap
    true, // extractability of key to unwrap
    ["sign", "verify"], // key usages for key to unwrap
  );
}

export async function unwrapDecrypt(keyToUnwrap, wrappingKey) {
  return await window.crypto.subtle.unwrapKey(
    "raw", 
    keyToUnwrap, wrappingKey,  
    "AES-KW", // algorithm identifier for key encryption key
    "AES-GCM", // algorithm identifier for key to unwrap
    true, // extractability of key to unwrap
    ["encrypt", "decrypt"], // key usages for key to unwrap
  );  
}

export async function generateECDSAKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
        name: "ECDSA",
        namedCurve: "P-256"//"P-521",
    },
    true,
    ['sign', 'verify']
  );
  return keyPair;
}

export async function generateECDHKeyPair () {
  const keyPair = await crypto.subtle.generateKey(
    {
        name: "ECDH",
        namedCurve: "P-256",//"P-384",
        hash: "SHA-256",
    },
    true,
    ['deriveKey']
  );
  return keyPair;
}

// Assuming the secret is derived from some initial key material and is suitable for use in key derivation
// This function will derive sign and encrypt keys based on the provided secret
export const deriveSignsAndEncryptsFromSecret = async (rawSecret, n) => {
 try {
   
    // generateKey cannot be used to create a key which will be used to drive other keys in future so using importKey function
    let SECRET = await importHKDFKey(rawSecret);
    let saltString  = "";

    let SALT = textToBytes(saltString);

    console.log("secret or baseKey: ", SECRET);
  
    // Deriving bits for src, sign, and encrypt
    const srcAB = await deriveRawKey(SECRET, SALT, textToBytes("SRC"), 64);   
  
    let SRC = new Uint8Array(srcAB);
    
    SALT = SRC;
  
    // Derive sign Key from secret      
    const signAB = await deriveRawKey(SECRET, SALT, textToBytes("SIGN"), 256);
    console.log("sign: ", signAB);  
    let SIGN = await importHKDFKey(signAB);

    // Derive encrypt Key from secret     
    const encryptAB = await deriveRawKey(SECRET, SALT, textToBytes("ENCRYPT"), 256);
    console.log("encrypt: ",  encryptAB);  
    let ENCRYPT = await importHKDFKey(encryptAB);
      
    const ENCRYPTS = await generateNKeys(n, SALT, "encrypt", ENCRYPT);      
    const SIGNS = await generateNKeys(n, SALT, "sign", SIGN);  
  
    return [ENCRYPTS, SIGNS, SRC];

  } catch (error) {
    console.error("Error in generateKeys:", error.message);
    throw error;
  }
};

export const convertBytesToBase64 = async (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export const convertBase64ToBytes = async (base64String) => {
  const binaryString = atob(base64String);
  const length = binaryString.length;
  const buffer = new ArrayBuffer(length);
  const view = new Uint8Array(buffer);

  for (let i = 0; i < length; i++) {
    view[i] = binaryString.charCodeAt(i);
  }

  return new Uint8Array(buffer);
}
