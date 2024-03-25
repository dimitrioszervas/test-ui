// Helper function to encode text to Uint8Array
const textToBytes = (text) => new TextEncoder().encode(text);

// Function to import a secret key for HKDF
const importHKDFDeriveKeyAndBits = async (keyData) => {
  return window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HKDF' },
    false,
    ['deriveKey', 'deriveBits']
  );
};

// Function to import a secret key for HKDF
const importHKDFDeriveKey = async (keyData) => {
  return window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HKDF' },
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
  let key = await importHKDFDeriveKeyAndBits(textToBytes(code)); 
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
  
export async function exportCryptoKeyToRaw(key) {
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

export const deriveKeys = async(ownerCode, n) => {
  try {
    const secretString = ownerCode;
    let saltString  = "";

    console.log("secret string: ", secretString); 
     
    let salt = textToBytes(saltString);

    console.log("secret: ", secretString);

    // generateKey cannot be used to create a key which will be used to drive other keys in future so using importKey function
    let secret = await importHKDFDeriveKeyAndBits(textToBytes(secretString));
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
    let sign = await importHKDFDeriveKey(signAB);

    // Derive encrypt Key from secret     
    const encryptAB = await deriveHKDFBits(secret, salt, "encrypt", 256);
    console.log("encrypt: ",  encryptAB);  
    let encrypt = await importHKDFDeriveKey(encryptAB);
      
    const encrypts = await generateNKeys(n, salt, "encrypt", encrypt);      
    const signs = await generateNKeys(n, salt, "sign", sign);  
  
    return [encrypts, signs, src];

  } catch (error) {
    console.error("Error in generateKeys:", error.message);
    throw error;
  }
}

export async function deriveKWSharedKey(privateKey, publicKey) {
 
  const sharedKey = await window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: publicKey,
    },
    privateKey,
    {
      name: "AES-KW",
      length: 256,
    },
    true,
    ["wrapKey", "unwrapKey"]
  );
  return sharedKey;
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

async function importPBKDF2Key(text) {  
  const enc = new TextEncoder();
  return window.crypto.subtle.importKey(
    "raw",
    enc.encode(text),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );
}

export async function deriveKeyPBKDF2(text) {
  const keyMaterial = await importPBKDF2Key(text);
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

export async function exportCryptoKeyToBytes(key) {
  const exportedKeyAB = await exportCryptoKeyToRaw(key);
  return new Uint8Array(exportedKeyAB);
}

export async function wrapKeyWithKeyAesKW(keyToWrap, wrappingKey) {
  const keyAB = await window.crypto.subtle.wrapKey("raw", keyToWrap, wrappingKey, "AES-KW");
  return await new Uint8Array(keyAB);
}

export async function generateNonce() {
  const key = await generateAesKWKey();
  return await exportCryptoKeyToBytes(key);
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


