import React from "react";
import { deriveKeys, signAndEncryptData, sendInvite } from "../utils/invite";

// This function is adjusted to directly use the imported utilities
async function createAndSendInvite(serverUrl) {
  // Hardcoded owner and invite codes
  const ownerCode = "1234"; // Default owner cod
  const inviteCode = "INVITE123"; 

  try {
    // Step 1: Derive keys from the owner code
    const { signKey, encryptKey } = await deriveKeys(ownerCode);

    // Step 2: Sign and encrypt the invite code
    const signedAndEncryptedData = await signAndEncryptData({inviteid, invitesignKeys, inviteencryptKeys}, 
     ownersignKeys, ownerencryptKeys);
     
    // Step 3: Send the encrypted and signed invite code to the server
    const response = await sendInvite(signedAndEncryptedData, serverUrl);// send invite sing instead of invite code at server

    console.log("Invite sent successfully:", response);
  } catch (error) {
    console.error("Error sending invite:", error);
  }
}

export { createAndSendInvite };