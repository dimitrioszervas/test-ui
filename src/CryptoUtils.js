// Helper function to encode text to Uint8Array
const encodeText = (text) => new TextEncoder().encode(text);

// Function to import a secret key for HKDF
const importKey = async (secret) => {
  return window.crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HKDF' },
    false,
    ['deriveKey', 'deriveBits']
  );
};

// Function to import a secret key for HKDF
const importDeriveKey = async (keyData) => {
  return window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );
};

// Function to derive bits using HKDF
const deriveBitsHKDF = async (secretKey, salt, infoText, bits) => {
  return window.crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt,
      info: encodeText(infoText),
    },
    secretKey,
    bits
  );
};

export const deriveID = async (code)=> {
  let key = await importKey(encodeText(code)); 
  const ab = await deriveBitsHKDF(key, encodeText(""), "id", 64);
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
      info = encodeText("signs");
    } else {
      derivedKeyAlgo = { name: "AES-GCM", length: 256 };
      keyUsage = ["encrypt", "decrypt"];     
      info = encodeText("encrypts");
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
export async function encryptShard(shard, cryptoKey, src) {

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
  
export async function exportKey(key) {
  const exportableKey = await window.crypto.subtle.exportKey("raw", key);
  return exportableKey;
}

export const deriveKeys = async(ownerCode, n) => {
  try {
    const secretString = ownerCode;
    let saltString  = "";

    console.log("secret string: ", secretString); 
     
    let salt = encodeText(saltString);

    console.log("secret: ", secretString);

    // generateKey cannot be used to create a key which will be used to drive other keys in future so using importKey function
    let secret = await importKey(encodeText(secretString));
    console.log("secret or baseKey: ", secret);
  
    // Deriving bits for src, sign, and encrypt
    const srcAB = await deriveBitsHKDF(secret, salt, "src", 64);
    console.log(srcAB);
  
    let src = new Uint8Array(srcAB);

    console.log("src: ", src);
    
    salt = src;
  
    // Derive sign Key from secret      
    const signAB = await deriveBitsHKDF(secret, salt, "sign", 256);
    console.log("sign: ", signAB);  
    let sign = await importDeriveKey(signAB);

    // Derive encrypt Key from secret     
    const encryptAB = await deriveBitsHKDF(secret, salt, "encrypt", 256);
    console.log("encrypt: ",  encryptAB);  
    let encrypt = await importDeriveKey(encryptAB);
      
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

export async function generateAESKWKey() {
  let key = await window.crypto.subtle.generateKey(
    {
      name: "AES-KW",
      length: 256,
    },
    false, //whether the key is extractable (i.e. can be used in exportKey)
    ["wrapKey", "unwrapKey"]
  );

  return key;
}

export async function deriveKeyPBKDF2(password) { 
  const enc = new TextEncoder();
  return window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["wrapKey", "unwrapKey"],
  );
}

export async function wrapKeyWithKeyKW(
  keyToBeWrapped,
  wrappingKey
) {
  try {
    const wrappedKey = await window.crypto.subtle.wrapKey(
      "raw",
      keyToBeWrapped,
      wrappingKey,
      {
        name: "AES-KW",
      }
    );
    return wrappedKey;
  } catch (e) {
    console.error("wrapKeyWithKWKey error: ", e);
    throw e; // Re-throw the error for handling at a higher level, if needed
  }
}
