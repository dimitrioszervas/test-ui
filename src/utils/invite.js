async function deriveKeys(ownerCode = "1234") {
  const encoder = new TextEncoder();
  const ownerCodeBuffer = encoder.encode(ownerCode);
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    ownerCodeBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // Derive a signing key
  const signKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("signSalt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    true,
    ["sign", "verify"]
  );

  // Derive an encryption key
  const encryptKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("encryptSalt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  return { signKey, encryptKey };
}

async function signAndEncryptData(data, signKey, encryptKey) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Sign the data
  const signature = await window.crypto.subtle.sign(
    { name: "HMAC" },
    signKey,
    dataBuffer
  );

  // Concatenate data and signature
  const dataAndSignature = new Uint8Array(dataBuffer.byteLength + signature.byteLength);
  dataAndSignature.set(new Uint8Array(dataBuffer), 0);
  dataAndSignature.set(new Uint8Array(signature), dataBuffer.byteLength);

  // Encrypt the concatenated data and signature
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // AES-GCM needs an IV
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    encryptKey,
    dataAndSignature
  );

  // Return encrypted data and IV for decryption
  return {
    encryptedData,
    iv,
  };
}

async function sendInvite(data, serverUrl) {
  const encryptedDataB64 = btoa(String.fromCharCode(...new Uint8Array(data.encryptedData)));
  const ivB64 = btoa(String.fromCharCode(...new Uint8Array(data.iv)));

  try {
    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        encryptedData: encryptedDataB64,
        iv: ivB64,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    return await response.json(); // Assuming the server responds with JSON
  } catch (error) {
    console.error('Error sending invite:', error);
    throw error; // Rethrow to handle it in the calling function
  }
}

async function createAndSendInvite() {
  const ownerCode = "1234";
  const inviteCode = "INVITE123";
  const serverUrl = "https://example.com/invite";

  const { signKey, encryptKey } = await deriveKeys(ownerCode);
  const signedAndEncryptedData = await signAndEncryptData(inviteCode, signKey, encryptKey);
  const response = await sendInvite(signedAndEncryptedData, serverUrl);

  if (response.ok) {
    console.log('Invite sent successfully');
    // Share the invite code with the new user
  } else {
    console.error('Failed to send invite');
  }
}

  
  /*const encoder = new TextEncoder();
  const ownerCodeBuffer = encoder.encode(ownerCode);
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    ownerCodeBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // Derive a signing key
  const signKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("signSalt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    true,
    ["sign", "verify"]
  );

  // Derive an encryption key
  const encryptKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("encryptSalt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  return { signKey, encryptKey };
  }*/