// Helper function to encode text to Uint8Array
const textToBytes = (text) => new TextEncoder().encode(text);

// Function to import a Raw HKDF Key for deriving keys or bits 
const importRawHKDFKeyForDerivingKeyAndBits = async (keyData) => {
  return window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HKDF' },
    false,
    ['deriveKey', 'deriveBits']
  );
};

// Function to import a Raw HKDF Key for deriving keys
const importRawHKDFKeyForDerivingKey = async (keyData) => {
  return window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );
};

export const importECDHPublicKey = async (publicKey) => {
  // import raw public key (uncompressed format)
  let importedPublicKey = await window.crypto.subtle.importKey(
    "raw", 
    publicKey, // valid raw public key in uncompressed format
    { name: "ECDH", namedCurve: "P-256" },
    false,                          
    [] // empty list
  ); 
  return importedPublicKey;
};

export const importRawECDHKeyForSignAndVerify = async (keyData) => {
  return window.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );
};

// Function to import a Jwk HKDF Key for deriving keys 
export const importJwkHKDFKeyForDerivingKey = async (keyData) => {
  return window.crypto.subtle.importKey(
    'jwk',
    keyData,
    { name: 'HKDF',  namedCurve: "P-256" },
    false,
    ['deriveKey']
  );
};

// Function to derive bits using HKDF
const deriveHKDFBits = async (secretKey, salt, infoText, bits) => {
  return window.crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt,
      info: textToBytes(infoText),
    },
    secretKey,
    bits
  );
};

export const deriveID = async (code)=> {
  let key = await importRawHKDFKeyForDerivingKeyAndBits(textToBytes(code)); 
  const ab = await deriveHKDFBits(key, textToBytes(""), "id", 64);
  return new Uint8Array(ab);
}

// Function to generate n keys of a specific type (sign or encrypt)
const generateNKeys = async (n, salt, type, baseKey) => {
  try {

    let derivedKeyAlgo, keyUsage, info;
    if (type === "sign") {
      // if we want to create keys which will be used to sign the data
      derivedKeyAlgo = { name: "HMAC", hash: "SHA-256", length: 256 };
      keyUsage = ["sign", "verify"];    
      info = textToBytes("signs");
    } else {
      derivedKeyAlgo = { name: "AES-GCM", length: 256 };
      keyUsage = ["encrypt", "decrypt"];     
      info = textToBytes("encrypts");
    }

    let keys = [];

    for (let i = 0; i <= n; i++) {
      const key = await window.crypto.subtle.deriveKey(
        { name: "HKDF", hash: "SHA-256", salt, info },
        baseKey,
        derivedKeyAlgo,
        true,
        keyUsage
      );
      keys.push(key);
    }
    return keys;
  } catch (error) {
    console.error(`Error in generateNKeys for ${type}:`, error.message);
    throw error;
  }
};

// Function to encrypt a shard with a given CryptoKey
export async function encryptAesGCMShard(shard, cryptoKey, src) {

  let iv = new Uint8Array(12);
  for (let i = 0; i < src.length; i++) {
    iv[i] = src[i];
  }

  const algo = { name: "AES-GCM", iv: iv, tagLength: 128 };
  const ciphertext = await crypto.subtle.encrypt(algo, cryptoKey, shard);
  return new Uint8Array(ciphertext);
}

// Function to calculate HMAC using a given CryptoKey
export async function calculateHMAC(data, cryptoKey) {
  const algo = { name: "HMAC", hash: "SHA-256" };
  const signature = await crypto.subtle.sign(algo, cryptoKey, new Uint8Array(data));
  return new Uint8Array(signature).buffer;
}
  
export async function exportCryptoKeyToRawAB(key) {
  const exportedKey = await window.crypto.subtle.exportKey("raw", key);
  return exportedKey;
}

export async function exportCryptoKeyToJwk(key) {
  const exportedleKey = await window.crypto.subtle.exportKey("jwk", key);
  return exportedleKey;
}

export async function exportCryptoKeyToPKCS8(key) {
  const exportedKey = await window.crypto.subtle.exportKey("pkcs8", key);
  return exportedKey;
}

export const deriveKeysFromCode = async(ownerCode, n) => {
  try {
    const secretString = ownerCode;
   
    // generateKey cannot be used to create a key which will be used to drive other keys in future so using importKey function
    let secret = await importRawHKDFKeyForDerivingKeyAndBits(textToBytes(secretString));
    console.log("secret or baseKey: ", secret);
  
    let saltString  = "";

    let salt = textToBytes(saltString);

    console.log("secret or baseKey: ", secret);
  
    // Deriving bits for src, sign, and encrypt
    const srcAB = await deriveHKDFBits(secret, salt, "src", 64);
    console.log(srcAB);
  
    let src = new Uint8Array(srcAB);

    console.log("src: ", src);
    
    salt = src;
  
    // Derive sign Key from secret      
    const signAB = await deriveHKDFBits(secret, salt, "sign", 256);
    console.log("sign: ", signAB);  
    let sign = await importRawHKDFKeyForDerivingKey(signAB);

    // Derive encrypt Key from secret     
    const encryptAB = await deriveHKDFBits(secret, salt, "encrypt", 256);
    console.log("encrypt: ",  encryptAB);  
    let encrypt = await importRawHKDFKeyForDerivingKey(encryptAB);
      
    const encrypts = await generateNKeys(n, salt, "encrypt", encrypt);      
    const signs = await generateNKeys(n, salt, "sign", sign);  
  
    return [encrypts, signs, src];

  } catch (error) {
    console.error("Error in generateKeys:", error.message);
    throw error;
  }
}

export async function importRawAESGCMEcryptAndDecryptKey(keyData) {
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

  const importedKey = await importRawAESGCMEcryptAndDecryptKey(hashed);

  return await exportCryptoKeyToRaw(importedKey);
}

export async function importHMACSignAndVerifyKey(keyData) {
  const importedKey = await window.crypto.subtle.importKey(
    "raw",
    keyData,
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

  const importedKey = await importHMACSignAndVerifyKey(hashed);

  return await exportCryptoKeyToRaw(importedKey);
}

export async function generateAesKW256BitsKeyForWrapAndUnwrap() {
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

async function importPBKDF2KeyForDerivingKeyAndBits(text) {  
  const enc = new TextEncoder();
  return window.crypto.subtle.importKey(
    "raw",
    enc.encode(text),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );
}

export async function derivePBKDF2Key256ForWrapAndUnwrap(text) {
  const keyMaterial = await importPBKDF2KeyForDerivingKeyAndBits(text);
  return window.crypto.subtle.deriveKey(
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

export async function generateHKDFSecret() {

  const keyData = window.crypto.getRandomValues(new Uint8Array(32)); 
  
  let key = await window.crypto.subtle.generateKey(
    {
      name: "HKDF",
      length: 256,
    },
    true, //whether the key is extractable (i.e. can be used in exportKey)
    ["deriveKey", "deriveBits"]
  );
 
 /*
  const key = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HKDF' },
    false,
    ['deriveKey', 'deriveBits']
  );

  /*
  let key = await window.crypto.subtle.generateKey(
    {
      name: "AES-KW",
      length: 256,
    },
    true, //whether the key is extractable (i.e. can be used in exportKey)
    ['deriveKey', 'deriveBits']
  );
 */

  return key;
} 

/*
export async function createNewSecret(deviceCode) {
  return await importRawHKDFKeyForDerivingKeyAndBits(textToBytes(deviceCode));
}
*/

export async function exportCryptoKeyToRaw(key) {
  const exportedKeyAB = await exportCryptoKeyToRawAB(key);
  return new Uint8Array(exportedKeyAB);
}

export async function wrapKeyWithKeyAesKW(keyToWrap, wrappingKey) {
  const keyAB = await window.crypto.subtle.wrapKey("raw", keyToWrap, wrappingKey, "AES-KW");
  return new Uint8Array(keyAB);
}

export async function unwrapKeyWithKeyAesKWForWarpAndUnwrap(keyToUnwrap, wrappingKey) {
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
export const deriveSignsAndEncryptsFromSecret = async (secret, n) => {
 /*
  // Use an appropriate salt for key derivation. This could be a fixed value or derived from some other data.
  // Ensure the salt is appropriately chosen for your application's security requirements.
  const salt = window.crypto.getRandomValues(new Uint8Array(16)); // Example: 16-byte random salt
  // Derive sign keys
  const signs = await generateNKeys(n, salt, "sign", secret);
  // Derive encrypt keys
  const encrypts = await generateNKeys(n, salt, "encrypt", secret);
  // Convert derived keys to a format suitable for storage (e.g., raw or JWK format)
  const exportedSigns = await Promise.all(signs.map(key => exportCryptoKeyToRaw(key)));
  const exportedEncrypts = await Promise.all(encrypts.map(key => exportCryptoKeyToRaw(key)));
  // Return the exported keys
  return { exportedSigns, exportedEncrypts };
  */
   
    let saltString  = "";

    let salt = textToBytes(saltString);

    // Deriving bits for src, sign, and encrypt
    const srcAB = await deriveHKDFBits(secret, salt, "src", 64);
    console.log(srcAB);
  
    let src = new Uint8Array(srcAB);

    console.log("src: ", src);
    
    salt = src;
  
    // Derive sign Key from secret      
    const signAB = await deriveHKDFBits(secret, salt, "sign", 256);
    console.log("sign: ", signAB);  
    let sign = await importRawHKDFKeyForDerivingKey(signAB);

    // Derive encrypt Key from secret     
    const encryptAB = await deriveHKDFBits(secret, salt, "encrypt", 256);
    console.log("encrypt: ",  encryptAB);  
    let encrypt = await importRawHKDFKeyForDerivingKey(encryptAB);
      
    const encrypts = await generateNKeys(n, salt, "encrypt", encrypt);      
    const signs = await generateNKeys(n, salt, "sign", sign);  
  
    return [encrypts, signs];
};
