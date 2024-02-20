import axios from "axios";
import { ReedSolomon } from "./ReedSolomon";
import { ReceivedShards} from "./ReedSolomon";
//import cbor from "cbor-js";

import './App.css';

function App() {


  let jsonData = {
    "users": [
        {
            "name": "alan", 
            "age": 23,
            "username": "aturing"
        },
        {
            "name": "john", 
            "age": 29,
            "username": "john"
        }
    ]
  }
  
  function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  }

  function str2ab(str) {
    var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }
 
  // Helper functions

  // Calculate padding for data
  function calculateDataPadding(dataSize, numShards)
  {
      if (dataSize < numShards)
      {
          return numShards;
      }
      let rem = dataSize % numShards;
      if (rem != 0)
      {
          let newSize = numShards * Math.trunc((dataSize / numShards) + 0.9);
          if (newSize < dataSize)
          {
              newSize += numShards;
          }
          return dataSize + (newSize - dataSize);
      }
      else
      {
          return dataSize;
      }
  }

  // calculate number of shards
  function calculateNShards(dataSize, nServers)
  {

      let nShards = (1 + Math.trunc(dataSize / 256)) * nServers;

      if (nShards > 255)
      {
          nShards = 255;
      }

      return nShards;
  }

  // calculate Reed-Solomon shards a 2D array named dataShards
  function calculateReedSolomonShards(
      dataBytes,
      totalNShards,
      parityNShards,
      dataNShards)
  {

    let paddedDataSize = calculateDataPadding(dataBytes.length + 1, dataNShards);

    let dataShardLength = Math.trunc(paddedDataSize / dataNShards);

    let dataShards = [];
    for (let i = 0; i < totalNShards; i++)
    {
        dataShards[i] = new Uint8Array(dataShardLength);
    }

    let paddedDataBytes = [];
    for (let i = 0; i < dataBytes.length; i++) {
        paddedDataBytes[i] = dataBytes[i];
    }
    paddedDataBytes[dataBytes.length] = 1;

    let shardNo = 0;
    let metadataOffset = 0;

    for (let i = 1; i <= dataNShards; i++)
    {
        for (let j = 0; j < dataShardLength; j++) {
            dataShards[shardNo][j] =  paddedDataBytes[metadataOffset + j];
        }

        metadataOffset += dataShardLength;

        shardNo++;
    }

    let reedSolomon = new ReedSolomon(dataNShards, parityNShards);

    reedSolomon.encodeParity(dataShards, 0, dataShardLength);

    return dataShards;
  }

  function StripPadding(paddedData)
  {  
      let padding = 1;
      for (let i = paddedData.length - 1; i >= 0; i--)
      {
          if (paddedData[i] === 0)
          {
              padding++;
          }
          else
          {
              break;
          }
      }

      let strippedData = new Uint8Array(paddedData.length - padding); 
     
      for (let i = 0; i < strippedData.length; i++) {
        strippedData[i] = paddedData[i];
      }

      return strippedData;    
  }

  async function handleClick() {
  
    ////////////////////////////////////////////////////////////////////////////
    // TEST CODE

    let txt = "The Thirty Years' War[m] was a conflict fought largely within the Holy Roman Empire from 1618 " +
    "to 1648. Considered one of the most destructive wars in European history, estimates of military and " +
    "civilian deaths range from 4.5 to 8 million, while up to 60% of the population may have died in some" +
    " areas of Germany.[19] Related conflicts include the Eighty Years' War, the War of the Mantuan " +
    "Succession, the Franco-Spanish War, and the Portuguese Restoration War.\r\n\r\n" +
    "Until the 20th century," +
    " historians considered it a continuation of the German religious struggle initiated by the Reformation " +
    "and ended by the 1555 Peace of Augsburg. This divided the Empire into Lutheran and Catholic states," +
    " but over the next 50 years the expansion of Protestantism beyond these boundaries gradually " +
    "destabilised Imperial authority. While a significant factor in the war that followed, " +
    "it is generally agreed its scope and extent was driven by the contest for European " +
    "dominance between Habsburgs in Austria and Spain, and the French House of Bourbon.[20]\r\n\r\n" +
    "The war began in 1618 when Ferdinand II was deposed as King of Bohemia and replaced by Frederick V " +
    "of the Palatinate. Although the Bohemian Revolt was quickly suppressed, fighting expanded into the " +
    "Palatinate, whose strategic importance drew in the Dutch Republic and Spain, then engaged in the " +
    "Eighty Years War. Since ambitious external rulers like Christian IV of Denmark and Gustavus Adolphus " +
    "also held territories within the Empire, what began as an internal dynastic dispute was transformed " +
    "into a far more destructive European conflict.";

    let numSevers = 3;

    // convert string to bytes
    let transactionBytes = new TextEncoder().encode(txt);

    let totalNShards = calculateNShards(transactionBytes.length, numSevers);
    let parityNShards = Math.trunc(totalNShards / 2);
    let dataNShards = totalNShards - parityNShards;
    let numShardsPerServer = Math.trunc(totalNShards / numSevers);

    console.log("Test Reed-Solomon");
    console.log("totalNShards: " + totalNShards);
    console.log("parityNShards: " + parityNShards);
    console.log("dataNShards: " + dataNShards);
    console.log("numShardsPerServer: " + numShardsPerServer + "\n");
    let numReceivedShards = Math.trunc(totalNShards / 2) + 1;
    console.log("numReceivedShards: " + numReceivedShards + "\n");

    let transactionShards = calculateReedSolomonShards(transactionBytes, totalNShards, parityNShards, dataNShards);

    
    // Code that rebuilds the original using Reed-Solomon
    let paddedDataSize = calculateDataPadding(transactionBytes.length, dataNShards);

    let dataShardLength = Math.trunc(paddedDataSize / dataNShards);
    
    let shardsPresent = [];

    for (let i = 0; i < totalNShards; i++)
    {
        shardsPresent[i] = false;
    }

    for (let i = 0; i < numReceivedShards; i++)
    {
        shardsPresent[i] = true;
    }

    // Replicate the other shards using Reeed-Solomom.
    let reedSolomon = new ReedSolomon(shardsPresent.length - parityNShards, parityNShards);
    reedSolomon.decodeMissing(transactionShards, shardsPresent, 0, dataShardLength);

    // Write the Reed-Solomon matrix of shards to a 1D array of bytes
    let metadataBytes = new Uint8Array(transactionShards.length * dataShardLength);
    let offset = 0;

    for (let j = 0; j < transactionShards.length - parityNShards; j++)
    {
        for (let i = 0; i < dataShardLength; i++) {
            metadataBytes[offset + i] = transactionShards[j][i];
        }    

        offset += dataShardLength;
    }

    // convert bytes to string
    // encoding can be specfied, defaults to utf-8 which is ascii.
    let rebuildedText = new TextDecoder().decode(StripPadding(metadataBytes)); 
    
    console.log(rebuildedText);
   
    
    // Converting binary data into Blob
    var blobObj = new Blob([transactionShards[0]], {type: 'application/octet-stream'});
 
    // Creating FormData object
    var obj = new FormData();
 
    // Add data to the object
    // Here myfile is the name of the form field
    obj.append("myfile", blobObj);

    // Sending data using POST request
    await fetch("https://localhost:7125/api/Transactions/PostTransaction/", {
       // Adding POST request
       method: "POST",
       mode: 'no-cors',
       // Adding body which we want to send
       body: obj
    })
    // Handling the response
    .then(response =>{
      console.log(response.status);
      if (response.ok){
          console.log("Binary data send Successfully: ", response.body);
      }
    })
    // Handling the error
    .catch(err=>{
       console.log("Found error:", err)
    });
 
    /*
    // Send the binary string to the backend using Axios
    await axios
    .post("https://localhost:7125/api/Transactions/PostTransaction/", binaryData, {
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
    */
    
  }

  return (
    <div onClick={handleClick} style={{
      textAlign: 'center',
      width: '100px',
      border: '1px solid gray',
      borderRadius: '5px'
    }}>
      Send data to backend
    </div>
  );
}

export default App;
