import axios from "axios";
import cbor from "cbor-js";

import { calculateReedSolomonShards } from "./ReedSolomon";
import { calculateNumberOfShardsPerServer } from "./ReedSolomon";
import { encrypt } from "./CryptoUtils";
import { calculateHMAC } from "./CryptoUtils";

/*
  data should be like this javascript object: 
  data = { id: string, name: string}
*/

function base64ToAarrayBuffer(base64) {
  var binaryString = atob(base64);
  var bytes = new Uint8Array(binaryString.length);
  for (var i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export const encryptDataAndSendtoServer = async (ENCRYPTS, SIGNS, SRC, endpoint, numSevers, transanctionData) => {
  try {

    console.log("deviceENCRYPTS: ", ENCRYPTS);
    console.log("deviceSIGNS: ", SIGNS);

    // Convert SRC to regular array
    const srcArray = new Uint8Array(SRC);//Array.from(new Uint8Array(SRC));
        
    // Shard the Encrypted Node Key using Reed-Solomon THRESHOLD ///////////////////////////////////////////
    /*
    // get the Reed-Solomon shards for the Threshold     
    let nodeKeyShards = calculateReedSolomonShards(new Uint8Array(transanctionData.REQ[0].encKEY), numSevers);
    let numNodeKeyShardsPerServer = calculateNumberOfShardsPerServer(nodeKeyShards, numSevers); 
    //console.log("transanctionData.REQ[0].encKEY: ", new Uint8Array(transanctionData.REQ[0].encKEY));
    
    // Encrypt each shard with the corresponding CryptoKey 
    // Create an array of encrypted shards
    // Threshold  
  
    let encryptedNodeKeyShards = [];   
    for (let i = 0; i < nodeKeyShards.length; i++) {    
      const encryptedNodeKeyShard = await encryptShard(nodeKeyShards[i], encrypts[Math.trunc(i / numNodeKeyShardsPerServer) + 1], src);           
      encryptedNodeKeyShards.push(encryptedNodeKeyShard);
    }

    let thresholdCBOR = cbor.encode([...encryptedNodeKeyShards, srcArray]);
    
    transanctionData.REQ[0].encKEY = new Uint8Array(thresholdCBOR);
    */
    //////////////////////////////////////////////////////////////////////////////////////////////////
        
    // here data has Node KEY
    // state 1
    let CBOR = transanctionData;
    CBOR = cbor.encode(CBOR);
    console.log("🔥  CBOR for State 1: ", CBOR);

    // Shard the TRANSACTION data using Reed-Solomon /////////////////////////////////////////////////

    let finalCBOR = CBOR; 
    let finalCBORArray = new Uint8Array(finalCBOR);   
    
    // get the Reed-Solomon shards for the transaction
    let transactionShards = calculateReedSolomonShards(finalCBORArray, numSevers);
    let numShardsPerServer = calculateNumberOfShardsPerServer(transactionShards, numSevers);  

    // END TRANSACTION REED-SOLOMON ///////////////////////////////////////////////////////////////// 
  
    // state 2
    const encoder = new TextEncoder();

    // Calculate HMAC for each key in SIGNS[1...n] and add the first 16 bytes to CBOR
    const hmacPromises = SIGNS.slice(1, numSevers).map(async (key) => {    
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
    
    // state 3 - end

    // state 4
   
    // Encrypt each shard with the corresponding CryptoKey 
    // Create an array of encrypted shards   
    let encryptedTransanctionShards = [];   
    for (let i = 0; i < transactionShards.length; i++) { 

      let encryptsIndex = Math.trunc(i / numShardsPerServer) + 1; 

      const encryptedTransactionShard = 
            await encrypt(transactionShards[i], ENCRYPTS[encryptsIndex], SRC);

      encryptedTransanctionShards.push(encryptedTransactionShard);
    }
    
    // Create CBOR for state 4 by combining encrypted shards and SRC
    CBOR = cbor.encode([...encryptedTransanctionShards, srcArray]);  
    console.log("🔥 CBOR for State 4: ", CBOR);

    // state 4 - end

    // state 5  

    // Calculate HMAC using SIGNS[0] and CBOR for State 5
    const hmacResult = await calculateHMAC(CBOR, SIGNS[0]);

    // Create CBOR for State 5 by combining CBORState4 and the HMAC
    CBOR = cbor.encode([new Uint8Array(CBOR), new Uint8Array(hmacResult)]);   

    // Convert CBORState5 to a binary string
    //const BINARY_STRING = String.fromCharCode.apply(null, new Uint8Array(CBOR)); // ORIGINAL
    const BINARY_STRING = new Uint8Array(CBOR); // Dimitrios modification
    //console.log("🔥  BINARY_STRING: ", BINARY_STRING);           
   
    // Send the binary string to the backend using Axios
    let responseData;   
    await axios
      .post(endpoint, BINARY_STRING, {
        headers: {
          "Content-Type": "application/octet-stream",
          'Access-Control-Allow-Credentials':true,
          "Access-Control-Allow-Origin": "*",
          "Accept" : "application/octet-stream",                   
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        //responseType: 'blob'
      })
      .then((response) => {         
        responseData = response.data;       
      })
      .catch((error) => {
        console.error("Error sending data to backend:", error);
      });
           
      CBOR = await cbor.decode(base64ToAarrayBuffer(responseData));      

      return CBOR;
    
      /*
      // Assuming you're using fetch API for making requests
      fetch(endpoint, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/octet-stream",
        "Accept" : "application/octet-stream"        
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: BINARY_STRING, // body data type must match "Content-Type" header
    })
    .then(response => {
      // Check if response is successful
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      // Check if response content type is octet-stream
      if (response.headers.get('content-type') === 'application/octet-stream') {
        // Read the response as array buffer
        //return response.arrayBuffer();
        responseData = response.arrayBuffer();
      } else {
        console.log(response.headers.get('content-type'));
        throw new Error('Response is not of type application/octet-stream');
      }
    })
    .then(arrayBuffer => {
      // Handle the binary data
      // For example, you can convert it to Blob, Uint8Array, etc.
      // Example:
      let uint8Array = new Uint8Array(arrayBuffer);
      console.log(uint8Array);
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
    });

    return responseData;
    */
  } catch (error) {
    console.error("Error in encryptDataAndSendtoServer:", error.message);
  } 
  
};
