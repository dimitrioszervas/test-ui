import { encryptDataAndSendtoServer } from "./protocol";
import { generateKeys } from "./CryptoUtils";
import { exportKey as exportCryptoKeyToRaw } from "./CryptoUtils";

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

    
    // A transaction that creates a folder - this for testing purposes not a real one in order to 
    // test the threshold for the new protocol
    /*
    let transanction = {
                bID:"9476185f6905e331", 
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
        
    */

                  
    const ownerCode = "1234";
    // generateKey cannot be used to create a key which will be used to drive other keys in future so using importKey function
    // creating n encryption keys from ENCRYPT i.e ENCRYPTS    
    // We have 3 servers 
    const numServers = 3;
    const [encrypts, signs, src] = await generateKeys(ownerCode, numServers);

    // Convet encrypts & signs CryptoKeys to raw binary
    let ENCRYPTS = [];
    let SIGNS = [];
    for (let i = 0; i <= numServers; i++) {
      ENCRYPTS.push(new Uint8Array(await exportCryptoKeyToRaw(encrypts[i])));
      SIGNS.push(new Uint8Array(await exportCryptoKeyToRaw(signs[i])));
    }

    let inviteTransanction = {
      bID:"9476185f6905e331", 
      dID:"9554b2d9ad46683b",
      tID:"bc4f006e946664c8",
      TS:"2024-03-03T06:13:00.56537918Z",
      RT:true,
      REQ:[
            {
              TYP: "InviteUser",
              ENCRYPTS: ENCRYPTS,
              SIGNS: SIGNS, 
              encKEY: new Uint8Array(encNodeKey)            
            }
          ]
        };  
                   
    console.log("Sent Data: ", inviteTransanction);

    const INVITE_USER_URL = "https://localhost:7125/api/Transactions/InviteUser";
    await encryptDataAndSendtoServer(encrypts, signs, src, INVITE_USER_URL, numServers, inviteTransanction);
  
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
