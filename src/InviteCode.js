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

async function sendCodeToDevice(code) {
  console.log(`Sending code to user's device: ${code}`);
}

// Function to encrypt SECRET using PRESECRET
async function encryptSecret(secret, preSecret) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Initialization vector
  const preSecretKey = await window.crypto.subtle.importKey(
    "raw",
    preSecret,
    "AES-GCM",
    false,
    ["encrypt"]
  );
  const encryptedSecret = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    preSecretKey,
    secret
  );
  return { encryptedSecret, iv };
}

// Function to decrypt SECRET using PRESECRET
async function decryptSecret(encryptedSecret, preSecret, iv) {
  const preSecretKey = await window.crypto.subtle.importKey(
    "raw",
    preSecret,
    "AES-GCM",
    false,
    ["decrypt"]
  );
  const decryptedSecret = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    preSecretKey,
    encryptedSecret
  );
  return decryptedSecret;
}

// Simulate connecting using PRESECRET to get encrypted SECRET
async function connectUsingPreSecret(preSecret) {
  const { SECRET } = generateSecretAndCode();
  const secretBytes = new TextEncoder().encode(SECRET);
  const { encryptedSecret, iv } = await encryptSecret(secretBytes, preSecret);
  return { encryptedSecret, iv };
}

export async function sendInviteWithCodeAndRetrieveSecret(deviceId) {
  const { SECRET, CODE } = generateSecretAndCode();
  const preSecret = await derivePreSecret(CODE);
  console.log("PreSecret derived for further operations:", preSecret);

  // Simulate connecting using PRESECRET to get encrypted SECRET
  const { encryptedSecret, iv } = await connectUsingPreSecret(preSecret);
  console.log("Encrypted SECRET retrieved");

  // Decrypt SECRET using PRESECRET
  const decryptedSecretBytes = await decryptSecret(encryptedSecret, preSecret, iv);
  const decryptedSecret = new TextDecoder().decode(decryptedSecretBytes);
  console.log("SECRET decrypted for normal operations:", decryptedSecret);

  // Send the CODE to the user's device
  await sendCodeToDevice(CODE);

  return { SECRET: decryptedSecret, CODE, preSecret };
}