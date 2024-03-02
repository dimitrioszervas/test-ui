import axios from "axios";
import { ReedSolomon } from "./ReedSolomon";
import { ReceivedShards} from "./ReedSolomon";
import { calculateNShards } from "./ReedSolomon";
import { calculateReedSolomonShards } from "./ReedSolomon";
import { calculateDataPadding } from "./ReedSolomon";
import { StripPadding } from "./ReedSolomon";
import { encryptDataAndSendtoServer } from "./protocol";
import cbor from "cbor-js";
 
import './App.css';

function App() {  

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
    let data = { id: "b00a2bffc8e932e2", name: "dimitri@sealstone.uk"};

    await encryptDataAndSendtoServer("","","", "https://localhost:7125/api/Transactions/PostTransaction", data, numSevers);
    /*
    // convert string to bytes
    let transactionBytes = new TextEncoder().encode(txt);
 
    
    // Converting binary data into Blob
    var blobObj = new Blob([transactionBytes], {type: 'application/octet-stream'});
 
    // Creating FormData object
    var obj = new FormData();
 
    // Add data to the object
    // Here myfile is the name of the form field
    obj.append("myfile", blobObj);

    // Sending data using POST request
    await fetch("https://localhost:7125/api/Transactions/PostTransaction", {
       // Adding POST request
       method: "POST",
       mode: 'no-cors',
       // Adding body which we want to send
       body: obj
    })
    // Handling the response
    .then(response =>{
      console.log(response.status);
      if (response.ok) {
          console.log("Binary data send Successfully: ", response.body);
      }
    })
    // Handling the error
    .catch(err=>{
       console.log("Found error:", err)
    });
   */
    /*
    // Send the binary string to the backend using Axios
    await axios
    .post("https://localhost:7125/api/Transactions/PostTransaction", binaryData, {
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
