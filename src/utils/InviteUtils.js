const ownerCode = '1234';

async function generateOwn(ownerCode) {
    const encoder = new TextEncoder();
    const ownerCodeBuffer = encoder.encode(ownerCode);

    // Derive a baseKey using PBKDF2 from ownerCode
    const baseKey = await window.crypto.subtle.importKey(
        "raw",
        ownerCodeBuffer,
        { name: "PBKDF2" },
        false, // not extractable
        ["deriveKey", "deriveBits"]
    );

    // Derive bits for owner.secret using PBKDF2
    const secretBits = await window.crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: encoder.encode("ownerSecretSalt"),
            iterations: 100000,
            hash: "SHA-256",
        },
        baseKey,
        256 // Number of bits
    );

    // Convert secretBits to a format that can be used as a key
    const secretKey = await window.crypto.subtle.importKey(
        "raw",
        secretBits,
        { name: "PBKDF2" },
        false, // not extractable
        ["deriveKey", "deriveBits"]
    );

    // Use the secretKey to derive owner.sign and owner.encrypt keys
    const ownerSignKey = await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encoder.encode("ownerSignSalt"),
            iterations: 100000,
            hash: "SHA-256",
        },
        secretKey,
        { name: "HMAC", hash: "SHA-256" },
        true, // extractable
        ["sign", "verify"]
    );

    const ownerEncryptKey = await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encoder.encode("ownerEncryptSalt"),
            iterations: 100000,
            hash: "SHA-256",
        },
        secretKey,
        { name: "AES-GCM", length: 256 },
        true, // extractable
        ["encrypt", "decrypt"]
    );

    // Optionally, hash ownerCode to generate an ID
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', ownerCodeBuffer);
    const id = new Uint8Array(hashBuffer);

    return {
        secret: Array.from(new Uint8Array(secretBits)),
        id: Array.from(id),
        ownerSignKey,
        ownerEncryptKey
    };
}

async function generateInvite(inviteCode) {
    const encoder = new TextEncoder();
    const inviteCodeBuffer = encoder.encode(inviteCode);

    // Derive a baseKey using PBKDF2 from inviteCode
    const baseKey = await window.crypto.subtle.importKey(
        "raw",
        inviteCodeBuffer,
        { name: "PBKDF2" },
        false, // not extractable
        ["deriveKey", "deriveBits"]
    );

    // Derive bits for invite.secret using PBKDF2
    const secretBits = await window.crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: encoder.encode("inviteSecretSalt"),
            iterations: 100000,
            hash: "SHA-256",
        },
        baseKey,
        256 // Number of bits
    );

    // Convert secretBits to a format that can be used as a key
    const secretKey = await window.crypto.subtle.importKey(
        "raw",
        secretBits,
        { name: "PBKDF2" },
        false, // not extractable
        ["deriveKey", "deriveBits"]
    );

    // Derive a signing key from the secretKey
    const inviteSignKey = await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encoder.encode("inviteSignSalt"),
            iterations: 100000,
            hash: "SHA-256",
        },
        secretKey,
        { name: "HMAC", hash: "SHA-256" },
        true, // extractable
        ["sign", "verify"]
    );

    // Derive an encryption key from the secretKey
    const inviteEncryptKey = await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encoder.encode("inviteEncryptSalt"),
            iterations: 100000,
            hash: "SHA-256",
        },
        secretKey,
        { name: "AES-GCM", length: 256 },
        true, // extractable
        ["encrypt", "decrypt"]
    );

    // Optionally, hash inviteCode to generate an ID
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', inviteCodeBuffer);
    const id = new Uint8Array(hashBuffer);

    return {
        secret: Array.from(new Uint8Array(secretBits)), // Convert ArrayBuffer to Array for easier handling
        id: Array.from(id),
        inviteSignKey,
        inviteEncryptKey
    };
}

(async () => {
    const ownerDetails = await generateOwn(ownerCode);
    console.log("Owner Secret as byte array:", ownerDetails.secret);
    console.log("ID as byte array:", ownerDetails.id);
    console.log("Owner Sign Key:", ownerDetails.ownerSignKey);
    console.log("Owner Encrypt Key:", ownerDetails.ownerEncryptKey);

    const inviteCode = 'INVITECODE123';
    const inviteDetails = await generateInvite(inviteCode);
    console.log("Invite Secret as byte array:", inviteDetails.secret);
    console.log("Invite ID as byte array:", inviteDetails.id);
    console.log("Invite Sign Key:", inviteDetails.inviteSignKey);
    console.log("Invite Encrypt Key:", inviteDetails.inviteEncryptKey);
})();

export { generateOwn, generateInvite };