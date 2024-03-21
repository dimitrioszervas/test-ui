import React, { useState } from 'react';
import './App.css';
import { createAndSendInvite } from './components/invitefront';

function App() {
  const [ownerCode, setOwnerCode] = useState('');
  const [inviteCode, setInviteCode] = useState('INVITE123'); // Assuming a default or a separate input for invite code

  const handleSendInvite = async () => {
    const serverUrl = "https://example.com/invite";

    try {
      // Send the invite, passing the owner code and invite code
      const response = await createAndSendInvite(serverUrl, ownerCode, inviteCode);
      alert("Invite sent successfully!");
      console.log("Server response:", response);
    } catch (error) {
      console.error("Failed to send invite:", error);
      alert("Failed to send invite. Check the console for more details.");
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <input
          type="text"
          value={ownerCode}
          onChange={(e) => setOwnerCode(e.target.value)}
          placeholder="Enter Owner Code"
        />
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="Enter Invite Code"
        />
        <button onClick={handleSendInvite}>Send Invite</button>
      </header>
    </div>
  );
}

export default App;

