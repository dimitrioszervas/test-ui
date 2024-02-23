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
