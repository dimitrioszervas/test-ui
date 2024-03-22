import React, { useState } from 'react';
import './App.css';
import { generateOwn, generateInvite } from './utils/InviteUtils';

function App() {
  const [ownerCode, setOwnerCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleGenerateAndShareInvite = async () => {
    setStatusMessage('Generating keys and invite...');
    try {

      const ownerDetails = await generateOwn(ownerCode);
      console.log("Generated owner details:", ownerDetails);

      // Generate invite details
      const inviteDetails = await generateInvite(inviteCode || 'INVITE123'); // Use a default invite code if none is provided
      console.log("Generated invite details:", inviteDetails);

      setStatusMessage(`Invite generated successfully! Invite Code: ${inviteDetails.id}`);
      
      console.log(`Sharing invite code: ${inviteDetails.id}`);
      alert(`Shared invite code: ${inviteDetails.id}`);
    } catch (error) {
      console.error("Failed to generate or share invite:", error);
      setStatusMessage("Failed to generate or share invite. Check the console for more details.");
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
          placeholder="Enter Invite Code (optional)"
        />
        <button onClick={handleGenerateAndShareInvite}>Generate and Share Invite</button>
        <p>{statusMessage}</p>
      </header>
    </div>
  );
}

export default App;
