/*
// Helper function to encode text to Uint8Array
const encodeText = (text) => new TextEncoder().encode(text);

// Function to import a secret key for HKDF
const importSecretKey = async (secretText) => {
  return window.crypto.subtle.importKey(
    'raw',
    encodeText(secretText),
    { name: 'HKDF' },
    false,
    ['deriveKey', 'deriveBits']
  );
};

// Function to derive bits using HKDF
const deriveBitsHKDF = async (secretKey, saltText, infoText, bits) => {
  return window.crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: encodeText(saltText),
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

export const generateKeys = async(secretString, n) => {
  try {
    const saltString = "";
    const secret = await importSecretKey(secretString);

    // Deriving bits for src, sign, and encrypt
    const srcAB = await deriveBitsHKDF(secret, saltString, "src", 64);
    console.log(srcAB);

    const signAB = await deriveBitsHKDF(secret, saltString, "sign", 256);
    console.log(signAB);
    const encryptAB = await deriveBitsHKDF(secret, saltString, "encrypt", 256);
    console.log(encryptAB);

    const sign = await importSecretKey(new Uint8Array(signAB));
    const encrypt = await importSecretKey(new Uint8Array(encryptAB));
   
    const encrypts = await generateNKeys(n, srcAB, "encrypt", encrypt);
    const signs = await generateNKeys(n, srcAB, "sign", sign);

    const src = new Uint8Array(srcAB);

    return [encrypts, signs, src];

  } catch (error) {
    console.error("Error in generateKeys:", error.message);
    throw error;
  }
}
*/

// fucntion to generate n keys.
const generateNKeys = async (n, salt, type, baseKey) => {

    try {
      
      let derivedKeyAlgo, keyUsage, info;
      if (type === "sign") {
        // if we want to create keys which will be used to sign the data
        derivedKeyAlgo = { name: "HMAC", hash: "SHA-256", length: 256 };
        keyUsage = ["sign", "verify"];    
        info = new TextEncoder().encode("signs");
      } else {
        derivedKeyAlgo = { name: "AES-GCM", length: 256 };
        keyUsage = ["encrypt", "decrypt"];     
        info = new TextEncoder().encode("encrypts");
      }
      let keys = []; // array to store n keys
  
      // for loop to generate n keys
      for (let i = 0; i <= n; i++) {
        // here we are creating a key using HKDF algorithm
        const key = await window.crypto.subtle.deriveKey(
          {
            name: "HKDF",
            hash: "SHA-256",
            salt: salt,
            info: info
          },
          baseKey,
          derivedKeyAlgo,
          true,
          keyUsage
        );
        keys.push(key);
      }
      return keys;
    } catch (error) {
      console.error("Error in generateNKeys:", error.message);
      throw error;
    }
  };
  
  export const generateKeys = async(secretText, n) => {
    try {
      const secretString = secretText;
      let saltString  = "";
  
      console.log("secret string: ", secretString);
      
      let secretRaw = new TextEncoder().encode(secretString);
      let salt = new TextEncoder().encode(saltString);
  
      console.log("secret: ", secretRaw);
  
      // generateKey cannot be used to create a key which will be used to drive other keys in future so using importKey function
      let secret = await window.crypto.subtle.importKey("raw", secretRaw, "HKDF", false, [
        "deriveBits",
        "deriveKey",
      ]);
      console.log("secret or baseKey: ", secret);
    
        // creating SRC from the SECRET
      let srcAB = await window.crypto.subtle.deriveBits(
        {
          name: "HKDF",
          hash: "SHA-256",
          salt: salt,
          info: new TextEncoder().encode("src"),
        },
        secret,
        64
      );
  
      let src = new Uint8Array(srcAB);
  
      salt = src;
  
      console.log("src: ", src);
  
      // Derive sign Key from secret
      let signAB = await window.crypto.subtle.deriveBits(
        {
          name: "HKDF",
          hash: "SHA-256",
          salt: salt,
          info: new TextEncoder().encode("sign"),
        },
        secret,      
        256
      );     
  
      let signRaw = new Uint8Array(signAB);
  
      console.log("sign: ", signRaw);
  
      let sign = await window.crypto.subtle.importKey("raw", signAB, "HKDF", false, [
        "deriveKey",
      ]);
  
      // Derive encrypt Key from secret
      let encryptAB = await window.crypto.subtle.deriveBits(
        {
          name: "HKDF",
          hash: "SHA-256",
          salt: salt,
          info: new TextEncoder().encode("encrypt"),
        },
        secret,      
        256
      );     
  
      let encryptRaw = new Uint8Array(encryptAB);
  
      console.log("encrypt: ", encryptRaw);
  
      let encrypt = await window.crypto.subtle.importKey("raw", encryptAB, "HKDF", false, [  
        "deriveKey",
      ]);
        
      const encrypts = await generateNKeys(n, salt, "encrypt", encrypt);      
      const signs = await generateNKeys(n, salt, "sign", sign);  
   
      return [encrypts, signs, src];
  
    } catch (error) {
      console.error("Error in generateKeys:", error.message);
      throw error;
    }
  }