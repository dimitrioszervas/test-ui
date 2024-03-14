export function generateSecretAndCode() {
  const SECRET = window.crypto.getRandomValues(new Uint8Array(16)).toString();
  const CODE = window.crypto.getRandomValues(new Uint8Array(8)).toString();
  return { SECRET, CODE };
}

export async function derivePreSecret(code) {
  const encoder = new TextEncoder();
  const encodedCode = encoder.encode(code);
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encodedCode,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const preSecret = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return preSecret;
}

// Additional function to perform HKDF derivation
async function hkdfDerive(preSecret, info, length = 256) {
  const salt = new Uint8Array(32); 
  let keyMaterialInput = preSecret;
  if (typeof preSecret === 'string') {
    const encoder = new TextEncoder();
    keyMaterialInput = encoder.encode(preSecret);
  }
  const hkdfParams = {
    name: "HKDF",
    hash: "SHA-256",
    salt: salt,
    info: new TextEncoder().encode(info),
  };
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    keyMaterialInput,
    { name: "HKDF" },
    false,
    ["deriveKey", "deriveBits"]
  );
  return window.crypto.subtle.deriveBits(
    { ...hkdfParams, length },
    keyMaterial,
    length
  );
}

// Use PRESECRET to derive SRC on USER INVITE
async function deriveSrc(preSecret) {
  return hkdfDerive(preSecret, "SRC");
}

export async function sendInviteWithCodeAndRetrieveSecret(deviceId) {
  const { SECRET, CODE } = generateSecretAndCode();
  const preSecret = await derivePreSecret(CODE);
  console.log("PreSecret derived for further operations:", preSecret);

  // Derive SRC using PRESECRET as the unique device identifier
  const src = await deriveSrc(preSecret);
  console.log("SRC derived for user invite:", src);

  // Derive SIGN and ENCRYPT keys using SECRET and PRESECRET
  const signKey = await hkdfDerive(SECRET, "SIGN", 256); // Derive from SECRET for higher security
  const encryptKey = await hkdfDerive(preSecret, "ENCRYPT", 256); // Derive from PRESECRET
  console.log("SIGN key derived:", signKey);
  console.log("ENCRYPT key derived:", encryptKey);

   // Mock function to simulate connecting using PRESECRET to get encrypted SECRET
async function connectUsingPreSecret(preSecret) {
  // For demonstration, we're just creating a mock encrypted secret and iv
  const mockSecret = "MockSecret";
  const encoder = new TextEncoder();
  
  // Import preSecret as a CryptoKey for AES-GCM
  const key = await window.crypto.subtle.importKey(
    "raw",
    preSecret, // preSecret is an ArrayBuffer
    { name: "AES-GCM" },
    false, // whether the key is extractable (i.e., can be used in exportKey)
    ["encrypt"] // can only be used for these operations
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Initialization vector
  const encryptedSecret = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key, // Use the imported CryptoKey
    encoder.encode(mockSecret)
  );

  return { encryptedSecret, iv };
}


  // Function to decrypt SECRET using PRESECRET
  async function decryptSecret(encryptedSecret, preSecret, iv) {
    // Import preSecret as a CryptoKey for AES-GCM decryption
    const key = await window.crypto.subtle.importKey(
      "raw",
      preSecret, // preSecret is an ArrayBuffer
      { name: "AES-GCM" },
      false, // whether the key is extractable (i.e., can be used in exportKey)
      ["decrypt"] // can only be used for these operations
    );

    const decryptedSecret = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key, 
      encryptedSecret
    );

    return decryptedSecret; // This will be an ArrayBuffer
  }

  // Mock function to simulate sending the CODE to the user's device
  async function sendCodeToDevice(CODE) {
    console.log(`Simulating sending CODE: ${CODE} to device`);
  }

  // Simulate connecting using PRESECRET to get encrypted SECRET
  const { encryptedSecret, iv } = await connectUsingPreSecret(preSecret);
  console.log("Encrypted SECRET retrieved");

  // Decrypt SECRET using PRESECRET
  const decryptedSecretBytes = await decryptSecret(encryptedSecret, preSecret, iv);
  const decryptedSecret = new TextDecoder().decode(decryptedSecretBytes);
  console.log("SECRET decrypted for normal operations:", decryptedSecret);

  // Send the CODE to the user's device
  await sendCodeToDevice(CODE);

  return { SECRET: decryptedSecret, CODE, preSecret, SRC: src, SIGN: signKey, ENCRYPT: encryptKey };
}