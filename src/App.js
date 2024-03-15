import { encryptDataAndSendtoServer } from "./protocol";
 
import './App.css';

function base64ToByteArray(base64) {
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
    // test encrypted node key
    let encNodeKey = new Uint8Array(base64ToByteArray("U5PwRpgCmk/30vkWA9QsX02\u002B8thW00qGBr16fLkdu\u002B7l5\u002B5O/RodIQ=="));

    console.log("encNodeKey", encNodeKey);

    // We have 3 servers 
    let numSevers = 3;   

    // A transaction that creates a folder - this for testing purposes not a real one in order to 
    // test the threshold for the new protocol
    let transanction = {bID:"9476185f6905e331", 
                dID:"9554b2d9ad46683b",
                tID:"bc4f006e946664c8",
                TS:"2024-03-03T06:13:00.56537918Z",
                RT:true,
                REQ:[
                      {
                        TYP: "CreateFolder",
                        ID: "98bee93f0ef0fa1e",
                        pID: "b527ea8a72ad83f9", 
                        encKEY: new Uint8Array(encNodeKey),
                        encNAM: "HxFhcnlK5RGp9NXyiHkwAaa0PkkN24dCTnr7175z1IQ="
                      }
                  ]
                };

    console.log("Sent data: ", transanction);

    let secret = "secret";
    await encryptDataAndSendtoServer("","","", "https://localhost:7125/api/Transactions/PostTransaction", numSevers, secret, transanction);
  
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
