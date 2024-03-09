import axios from "axios";
import cbor from "cbor-js";
import { calculateNShards } from "./ReedSolomon";
import { calculateReedSolomonShards } from "./ReedSolomon";
import { generateKeys } from "./KeyDerivation";


/*
  data should be like this javascript object: 
  data = { id: string, name: string}
*/

export const encryptDataAndSendtoServer = async (ctx, src, req, endpoint, data, numSevers) => {
  try {
    // generateKey cannot be used to create a key which will be used to drive other keys in future so using importKey function
    const n = numSevers;
    let [encrypts, signs, src] = await generateKeys("secret", n);

    console.log("encrypts: ");
    for (let i=0; i < encrypts.length; i++) {
      let raw = new Uint8Array(await window.crypto.subtle.exportKey("raw", encrypts[i]));
      console.log("encrypt[", i, "]: ", raw);
    }

    console.log("signs: ");
    for (let i=0; i < signs.length; i++) {
      let raw = new Uint8Array(await window.crypto.subtle.exportKey("raw", signs[i]));
      console.log("sign[", i, "]: ", raw);
    }

    // here data has data.name as encrypted field and other unencrypted fields
    // state 1
    let CBOR = data;
    CBOR = cbor.encode(CBOR);
    console.log("🔥  CBOR for State 1: ", CBOR);

    // REED-SOLOMON /////////////////////////////////////////////////////////////////////
    // Shard the data using Reed-Solomon

    let finalCBOR = CBOR; 
    let finalCBORArray = new Uint8Array(finalCBOR);

    // calculates number of total Reed-Solomon shards depending on the number
    // of servers
    let totalNShards = calculateNShards(finalCBORArray.length, numSevers);
    // calculate number of parity shards
    let parityNShards = Math.trunc(totalNShards / 2);
    // calculate number of data shards
    let dataNShards = totalNShards - parityNShards;
    // calculate number of shards per server
    let numShardsPerServer = Math.trunc(totalNShards / numSevers);  

    // get the Reed-Solomon shards for the transaction
    let dataShards = calculateReedSolomonShards(finalCBORArray, totalNShards, parityNShards, dataNShards);

    // END REED-SOLOMON /////////////////////////////////////////////////////////////////
     
    // creating n encryption keys from ENCRYPT i.e ENCRYPTS
    
    //let NAME = cbor.encode(data.name); // converstion of data.name to cbor
    //console.log("🔥  NAME: ", NAME);

    // Encrypting the data.name i.e NAME with ENCRYPTS[0]
    //NAME = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: SRC }, ENCRYPTS[0], NAME);
    //console.log("🔥  Encrypted NAME: ", NAME);
    //data.name = NAME;
  
    // state 2
    const encoder = new TextEncoder();

    // Calculate HMAC for each key in SIGNS[1...n] and add the first 16 bytes to CBOR
    const hmacPromises = signs.slice(1, n).map(async (key) => {
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
    console.log("🔥 CBOR for State 3: ", finalCBOR);

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
    
    // DIMITRIOS CHANGE to use Reed-Solomon shards 
    console.log("Total Number of shards: ", totalNShards);
    console.log("Number of Data shards: ", dataNShards);
    console.log("Number of Parity shards: ", parityNShards);
    console.log("numShardsPerServer: ", + numShardsPerServer);  

    // Prints out for debugging the shards 
    for (let i = 0; i < dataShards.length; i++) {
      if (i < dataNShards) {
        console.log("Data Shard ", i + 1, ": ", dataShards[i]);
      }
      else {
        console.log("Parity Shard ", i - parityNShards, ": ", dataShards[i]);
      }      
    }

    // END DIMITRIOS Reed-Solomon
    
    // state 3 - end

    // state 4

    // Function to encrypt a shard with a given CryptoKey
    async function encryptShard(shard, cryptoKey, srcIn) {
      let iv = new Uint8Array(12);
      for (let i = 0; i < srcIn.length; i++) {
        iv[i] = srcIn[i];
      }
      const algo = { name: "AES-GCM", iv: iv, tagLength: 128 };
      const ciphertext = await crypto.subtle.encrypt(algo, cryptoKey, shard);
      return new Uint8Array(ciphertext);
    }

    // Encrypt each shard with the corresponding CryptoKey
    //const encryptedShard1 = await encryptShard(dataShard1, ENCRYPTS[1]);
    //const encryptedShard2 = await encryptShard(dataShard2, ENCRYPTS[2]);
    //const encryptedParityShard = await encryptShard(parityShard, ENCRYPTS[3]);
    
    // Create an array of encrypted shards
    //const encryptedShards = [encryptedShard1, encryptedShard2, encryptedParityShard];
    let encryptedShards = [];   
    for (let i = 0; i < dataShards.length; i++) {
      // Here we just adding unecrypted shards for testing DIMITRIOS CHANGE
      //const encryptedShard = transactionShards[i];
      const encryptedShard = await encryptShard(dataShards[i], encrypts[i+1], src);//Math.trunc(i / numShardsPerServer)]); // original (correct)           
      encryptedShards.push(encryptedShard);
    }

    // Convert SRC to regular array
    //const srcArray = Array.from(new Uint8Array(SRC)); // original
    
    // DIMITRIOS CHANGE? (not sure) but it is easier to extract it from backend if is Uint8Array
    // as the shards are also the same type a binary string
    const srcArray = new Uint8Array(src); 

    // Create CBOR for state 4 by combining encrypted shards and SRC
    CBOR = cbor.encode([...encryptedShards, srcArray]);  
    console.log("🔥 CBOR for State 4: ", CBOR);

    // state 4 - end

    // state 5

    // Function to calculate HMAC using a given CryptoKey
    async function calculateHMAC(data, cryptoKey) {
      const algo = { name: "HMAC", hash: "SHA-256" };
      const signature = await crypto.subtle.sign(algo, cryptoKey, new Uint8Array(data));
      return new Uint8Array(signature).buffer;
    }

    // Calculate HMAC using SIGNS[0] and CBOR for State 5
    const hmacResult = await calculateHMAC(CBOR, signs[0]);

    // Create CBOR for State 5 by combining CBORState4 and the HMAC
    CBOR = cbor.encode([new Uint8Array(CBOR), new Uint8Array(hmacResult)]);   

    // Convert CBORState5 to a binary string
    const BINARY_STRING = String.fromCharCode.apply(null, new Uint8Array(CBOR));
    console.log("🔥  BINARY_STRING: ", BINARY_STRING);
           
    // Send the binary string to the backend using Axios
    await axios
      .post(endpoint, BINARY_STRING, {
        headers: {
          "Content-Type": "application/octet-stream",
          'Access-Control-Allow-Credentials':true,
          "Access-Control-Allow-Origin": "*"
        },
      })
      .then((response) => { 
        console.log("Received data: ", response.data);
      })
      .catch((error) => {
        console.error("Error sending data to backend:", error);
      });
  } catch (error) {
    console.error("Error in encryptDataAndSendtoServer:", error.message);
  }
  
};
