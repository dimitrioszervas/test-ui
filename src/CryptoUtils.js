// Helper function to encode text to Uint8Array
const encodeText = (text) => new TextEncoder().encode(text);

// Function to import a secret key for HKDF
const importSecretKey = async (secret) => {
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

// Function to generate n keys of a specific type (sign or encrypt)
const generateNKeys = async (n, salt, type, baseKey) => {
  try {
    const derivedKeyAlgo = type === "sign" ? 
      { name: "HMAC", hash: "SHA-256", length: 256 } : 
      { name: "AES-GCM", length: 256 };
    const keyUsage = type === "sign" ? ["sign", "verify"] : ["encrypt", "decrypt"];
    const info = encodeText(type === "sign" ? "signs" : "encrypts");
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
  
export const generateKeys = async(secretText, n) => {
  try {
    const secretString = secretText;
    let saltString  = "";

    console.log("secret string: ", secretString); 
     
    let salt = encodeText(saltString);

    console.log("secret: ", secretString);

    // generateKey cannot be used to create a key which will be used to drive other keys in future so using importKey function
    let secret = await importSecretKey(encodeText(secretString));
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
