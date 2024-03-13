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
  // Code to send the code to the user's device
  console.log(`Sending code to user's device: ${code}`);
}

export async function sendInviteWithCode(email) {
  const { SECRET, CODE } = generateSecretAndCode();
  const preSecret = await derivePreSecret(CODE);
  console.log("PreSecret derived for further operations:", preSecret);

  // Send the CODE to the user's device
  await sendCodeToDevice(CODE);

  return { SECRET, CODE, preSecret };
}