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

function base64ToArrayBuffer(base64) {
  var binaryString = atob(base64);
  var bytes = new Uint8Array(binaryString.length);
  for (var i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function App() {  

  async function handleClick() {
  
    ////////////////////////////////////////////////////////////////////////////
    // TEST CODE    

    let encNodeKey = base64ToArrayBuffer("U5PwRpgCmk/30vkWA9QsX02\u002B8thW00qGBr16fLkdu\u002B7l5\u002B5O/RodIQ==");

    let numSevers = 3;
    //let data = {id: "b00a2bffc8e932e2", name: "dimitri@sealstone.uk"};
    let data = {bID:"9476185f6905e331", 
                dID:"9554b2d9ad46683b",
                tID:"bc4f006e946664c8",
                TS:"2024-03-03T06:13:00.56537918Z",
                RT:true,
                REQ:[
                      {
                        TYP: "CreateFolder",
                        ID: "98bee93f0ef0fa1e",
                        pID: "b527ea8a72ad83f9", 
                        encKEY: encNodeKey,
                        encNAM: "HxFhcnlK5RGp9NXyiHkwAaa0PkkN24dCTnr7175z1IQ="
                      }
                  ]
                }

    console.log("Sent data: ", data);

    await encryptDataAndSendtoServer("","","", "https://localhost:7125/api/Transactions/PostTransaction", data, numSevers);
  
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
