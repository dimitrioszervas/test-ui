import axios from "axios";
import cbor from "cbor-js";
import { calculateNShards } from "./ReedSolomon";
import { calculateReedSolomonShards } from "./ReedSolomon";
import { calculateDataPadding } from "./ReedSolomon";
import { StripPadding } from "./ReedSolomon";

// fucntion to generate n keys (here 3 keys).
const generateNKeys = async (n, SRC, type, baseKey) => {
  try {
    let derivedKeyAlgo, keyUsage, salt, info;
    if (type === "sign") {
      // if we want to create keys which will be used to sign the data
      derivedKeyAlgo = { name: "HMAC", hash: "SHA-256" };
      keyUsage = ["sign", "verify"];
      salt = SRC; // salt needed to generate keys
      info = new TextEncoder().encode("SIGNS" + n);
    } else {
      derivedKeyAlgo = { name: "AES-GCM", length: 256 };
      keyUsage = ["encrypt", "decrypt"];
      salt = SRC; // salt needed to generate keys
      info = new TextEncoder().encode("ENCRYPTS" + n);
    }
    let keys = []; // array to store n keys

    // for loop to generate n keys
    for (let i = 0; i < n; i++) {
      // here we are creating a key using HKDF algorithm
      const key = await window.crypto.subtle.deriveKey(
        {
          name: "HKDF",
          hash: "SHA-256",
          salt: salt,
          info: info,
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




/*
  data should be like this javascript object: 
  data = { id: string, name: string}
*/

export const encryptDataAndSendtoServer = async (ctx, src, req, endpoint, data, numSevers) => {
  try {
    // generateKey cannot be used to create a key which will be used to drive other keys in future so using importKey function
    let SECRET = await window.crypto.subtle.importKey("raw", new TextEncoder().encode("SECRET"), "HKDF", false, [
      "deriveBits",
      "deriveKey",
    ]);
    console.log("🔥  SECRET or baseKey: ", SECRET);

    // creating SRC from the SECRET
    let SRC = await window.crypto.subtle.deriveBits(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: new TextEncoder().encode(null),
        info: new TextEncoder().encode(null),
      },
      SECRET,
      64
    );
    console.log("🔥  SRC: ", SRC);

    // ENCRYPT from SECRET
    let ENCRYPT = await window.crypto.subtle.deriveKey(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: SRC,
        info: new TextEncoder().encode("ENCRYPT"),
      },
      SECRET,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    ENCRYPT = await window.crypto.subtle.exportKey("raw", ENCRYPT);
    ENCRYPT = await window.crypto.subtle.importKey(
      "raw",
      ENCRYPT,
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: SRC,
        info: new TextEncoder().encode("ENCRYPT"),
      },
      false,
      ["deriveKey"]
    );
    console.log("🔥  ENCRYPT: ", ENCRYPT);

    // SIGN from SECRET
    let SIGN = await window.crypto.subtle.deriveKey(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: SRC,
        info: new TextEncoder().encode("SIGN"),
      },
      SECRET,
      { name: "HMAC", hash: "SHA-256" },
      true,
      ["sign", "verify"]
    );

    SIGN = await window.crypto.subtle.exportKey("raw", SIGN);
    SIGN = await window.crypto.subtle.importKey(
      "raw",
      SIGN,
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: SRC,
        info: new TextEncoder().encode("SIGN"),
      },
      false,
      ["deriveKey"]
    );
    console.log("🔥  SIGN: ", SIGN);

    // here data has data.name as encrypted field and other unencrypted fields
    // state 1
    let CBOR = data;
    CBOR = cbor.encode(CBOR);
    console.log("🔥  CBOR for State 1: ", CBOR);

    // REED-SOLOMON /////////////////////////////////////////////////////////////////////

    let finalCBORArray = new Uint8Array(CBOR);

    let totalNShards = calculateNShards(finalCBORArray.length, numSevers);
    let parityNShards = Math.trunc(totalNShards / 2);
    let dataNShards = totalNShards - parityNShards;
    let numShardsPerServer = Math.trunc(totalNShards / numSevers);

    console.log("Test Reed-Solomon");
    console.log("totalNShards: ", totalNShards);
    console.log("parityNShards: ", parityNShards);
    console.log("dataNShards: ", dataNShards);
    console.log("numShardsPerServer: ", + numShardsPerServer);    

    let transactionShards = calculateReedSolomonShards(finalCBORArray, totalNShards, parityNShards, dataNShards);

    // END REED-SOLOMON /////////////////////////////////////////////////////////////////
  
    const n = totalNShards; // n is to set how many keys need to be drived

    // creating n encryption keys from ENCRYPT i.e ENCRYPTS
    const ENCRYPTS = await generateNKeys(n, SRC, "encrypt", ENCRYPT);
    console.log("🔥  ENCRYPTS: ", ENCRYPTS);

    // creating n SIGNS from SIGN
    const SIGNS = await generateNKeys(n, SRC, "sign", SIGN);
    console.log("🔥  SIGNS: ", SIGNS);

    let NAME = cbor.encode(data.name); // converstion of data.name to cbor
    console.log("🔥  NAME: ", NAME);

    // Encrypting the data.name i.e NAME with ENCRYPTS[0]
    //NAME = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: SRC }, ENCRYPTS[0], NAME);
    //console.log("🔥  Encrypted NAME: ", NAME);
    //data.name = NAME;

  
    // state 2
    const encoder = new TextEncoder();

    // Calculate HMAC for each key in SIGNS[1...n] and add the first 16 bytes to CBOR
    const hmacPromises = SIGNS.slice(1, n).map(async (key) => {
      const algo = { name: "HMAC", hash: "SHA-256" };

      const signature = await window.crypto.subtle.sign(algo, key, encoder.encode(CBOR));
      return new Uint8Array(signature).slice(0, 16);
    });

    await Promise.all(hmacPromises)
      .then((hmacResults) => {
        // Convert CBOR to a regular array
        const CBORArray = Array.from(new Uint8Array(CBOR));

        // Add the first 16 bytes of each HMAC result to CBORArray
        for (let i = 0; i < hmacResults.length; i++) {
          const hmacSlice = Array.from(new Uint8Array(hmacResults[i]));
          CBORArray.push(...hmacSlice);
        }

        // Encode the final CBOR string
        CBOR = cbor.encode(CBORArray);
        console.log("🔥 CBOR for State 2: ", CBOR);
      })
      .catch((error) => console.error("Error calculating HMAC:", error));

    // state 2 - end

    // state 3
    // Assuming you have the finalCBOR from the previous step
    // Assuming finalCBOR is the ArrayBuffer containing the signed CBOR string
    //const finalCBORArray = Array.from(new Uint8Array(CBOR));

    // Split the final CBOR array into two data shards
    //const shard1 = finalCBORArray.slice(0, finalCBORArray.length / 2);
    //const shard2 = finalCBORArray.slice(finalCBORArray.length / 2);

    // Calculate the parity shard by XORing the two data shards
    //let parityShard = shard1.map((byte, index) => byte ^ shard2[index]);

    // Convert data shards and parity shard back to ArrayBuffer
    //const dataShard1 = new Uint8Array(shard1).buffer;
    //const dataShard2 = new Uint8Array(shard2).buffer;
    //parityShard = new Uint8Array(parityShard).buffer;
    
    //console.log("Data Shard 1: ", dataShard1);
    //console.log("Data Shard 2: ", dataShard2);
    //console.log("Parity Shard: ", parityShard);

    // state 3 - end

    // state 4

    // Function to encrypt a shard with a given CryptoKey
    async function encryptShard(shard, cryptoKey) {
      const algo = { name: "AES-GCM", iv: SRC };
      const ciphertext = await crypto.subtle.encrypt(algo, cryptoKey, new Uint8Array(shard));
      return new Uint8Array(ciphertext).buffer;
    }

    // Encrypt each shard with the corresponding CryptoKey
    //const encryptedShard1 = await encryptShard(dataShard1, ENCRYPTS[1]);
    //const encryptedShard2 = await encryptShard(dataShard2, ENCRYPTS[2]);
    //const encryptedParityShard = await encryptShard(parityShard, ENCRYPTS[3]);

    let encryptedShards = [];
    for (let i = 0; i < transactionShards.length; i++) {
      const encryptedShard = await encryptShard(transactionShards[i], ENCRYPTS[i]);
      encryptedShards.push(encryptedShard);
    }

    // Create an array of encrypted shards
    //const encryptedShards = [encryptedShard1, encryptedShard2, encryptedParityShard];

    // Convert SRC to regular array
    const srcArray = Array.from(new Uint8Array(SRC));

    // Create CBOR for state 4 by combining encrypted shards and SRC
    CBOR = cbor.encode([...encryptedShards, srcArray]);
    console.log("CBOR for State 4: ", CBOR);

    // state 4 - end

    // state 5

    // Function to calculate HMAC using a given CryptoKey
    async function calculateHMAC(data, cryptoKey) {
      const algo = { name: "HMAC", hash: "SHA-256" };
      const signature = await crypto.subtle.sign(algo, cryptoKey, new Uint8Array(data));
      return new Uint8Array(signature).buffer;
    }

    // Calculate HMAC using SIGNS[0] and CBOR for State 5
    const hmacResult = await calculateHMAC(CBOR, SIGNS[0]);

    // Create CBOR for State 5 by combining CBORState4 and the HMAC
    CBOR = cbor.encode([CBOR, new Uint8Array(hmacResult)]);

    // Convert CBORState5 to a binary string
    const BINARY_STRING = String.fromCharCode.apply(null, new Uint8Array(CBOR));
    console.log("🔥  BINARY_STRING: ", BINARY_STRING);

    // Send the binary string to the backend using Axios
    await axios
      .post(endpoint, BINARY_STRING, {
        headers: {
          "Content-Type": "application/octet-stream",
        },
      })
      .then((response) => {
        console.log("Backend response:", response.data);
      })
      .catch((error) => {
        console.error("Error sending data to backend:", error);
      });
  } catch (error) {
    console.error("Error in encryptDataAndSendtoServer:", error.message);
  }
};
