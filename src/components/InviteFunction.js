import React, { useEffect, useState } from 'react';
import { generateOwn, generateInvite } from '../utils/InviteUtils';

const Invite = () => {
    const [statusMessage, setStatusMessage] = useState('Initializing...');
    const [inviteCode, setInviteCode] = useState('');

    useEffect(() => {
        const ownerCode = '1234'; // This should be securely obtained or generated

        const sendTransactionToServer = async (ownerDetails, inviteDetails) => {
            // Assuming ownerDetails and inviteDetails include ENCRYPTS and SIGNS
            let inviteTransaction = {
                ENCRYPTS: inviteDetails.ownerEncryptKey, // Example, adjust based on actual structure
                SIGNS: ownerDetails.ownerSignKey, 
                deviceID: inviteDetails.id 
            };

            // Here, use your method to send the transaction to the server
            // For example, using a function similar to encryptDataAndSendtoServer from protocol.js
            let response = await encryptDataAndSendtoServer(
                ownerDetails.ownerEncryptKey, 
                ownerDetails.ownerSignKey, 
                SRC, // This needs to be defined or obtained
                INVITE_URL, // Your server's invite endpoint
                numServers, // The number of servers you're distributing shards to, if applicable
                inviteTransaction
            );

            console.log("Response: ", response);
            // Handle the response
        };

        const generateAndSendKeys = async () => {
            try {
                const ownerDetails = await generateOwn(ownerCode);
                console.log("Generated owner details:", ownerDetails);

                const inviteDetails = await generateInvite('INVITECODE123');
                console.log("Generated invite details:", inviteDetails);

                // Send the transaction to the server
                await sendTransactionToServer(ownerDetails, inviteDetails);
                setStatusMessage(`Invite generated and sent successfully! Invite Code: ${inviteDetails.id}`);
                
                setInviteCode(inviteDetails.id); // Assuming id is used as the invite code
                console.log(`Sharing invite code: ${inviteDetails.id}`);
                alert(`Shared invite code: ${inviteDetails.id}`);
            } catch (error) {
                setStatusMessage(`Error: ${error}`);
            }
        };

        generateAndSendKeys();
    }, []);

    const handleShareClick = () => {
        // Implement sharing functionality
        // For demonstration, we'll just log to the console
        console.log(`Sharing invite code: ${inviteCode}`);
        alert(`Shared invite code: ${inviteCode}`);
    };

    return (
        <div>
            <h2>Invite Functionality</h2>
            <p>Status: {statusMessage}</p>
            {inviteCode && (
                <>
                    <p>Invite Code: {inviteCode}</p>
                    <button onClick={handleShareClick}>Share Invite Code</button>
                </>
            )}
        </div>
    );
};

export default Invite;
