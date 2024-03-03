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
    //let data = {id: "b00a2bffc8e932e2", name: "dimitri@sealstone.uk"};
    let data = {bID:"9476185f6905e331", dID:"9554b2d9ad46683b",tID:"bc4f006e946664c8",TS:"2024-03-03T06:13:00.56537918Z",RT:true,REQ:[{TYP:"GetUserActions",ID:"98bee93f0ef0fa1e"}]}

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
