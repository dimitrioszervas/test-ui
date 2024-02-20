import CryptoJS from "crypto-js";

class Encryption {
  static encrypt(data, key) {
    const iv = CryptoJS.lib.WordArray.random(16); // 16 bytes for AES
    const encryptedData = CryptoJS.AES.encrypt(data, key, { iv });
    return { iv: iv.toString(CryptoJS.enc.Base64), encryptedData: encryptedData.toString() };
  }

  static decrypt(encryptedData, key, iv) {
    const decryptedData = CryptoJS.AES.decrypt(encryptedData, key, { iv });
    return decryptedData.toString(CryptoJS.enc.Utf8);
  }
}

export default Encryption;



// import CryptoJS from "crypto-js";
// import ECDSA from "crypto-js/elliptic";

// class Encryption {
//   // AES Encryption using GCM mode
//   static encrypt(data, key) {
//     const iv = CryptoJS.lib.WordArray.random(16); // 16 bytes for AES
//     const encryptedData = CryptoJS.AES.encrypt(data, key, { iv, mode: CryptoJS.mode.GCM });
//     return {
//       iv: iv.toString(CryptoJS.enc.Base64),
//       encryptedData: encryptedData.toString(),
//       tag: encryptedData.salt.toString(CryptoJS.enc.Base64),
//     };
//   }

//   // AES Decryption using GCM mode
//   static decrypt(encryptedData, key, iv, tag) {
//     const decryptedData = CryptoJS.AES.decrypt(
//       { ciphertext: CryptoJS.enc.Base64.parse(encryptedData), salt: CryptoJS.enc.Base64.parse(tag) },
//       key,
//       { iv, mode: CryptoJS.mode.GCM }
//     );
//     return decryptedData.toString(CryptoJS.enc.Utf8);
//   }

//   // UNWRAP using SHA-256
//   static UNWRAP(key, data) {
//     return CryptoJS.SHA256(key + data).toString();
//   }

//   // ECDSA Signature
//   static ECDSASignature(data, privateKey) {
//     const key = new ECDSA.ECDSAKey(CryptoJS.SHA256(privateKey).toString());
//     const signature = CryptoJS.elliptic.sign(data, key, { hash: "SHA-256" });
//     return signature.toString();
//   }

//   // HMAC Signature using SHA-256
//   static HMACSignature(data, key) {
//     const signature = CryptoJS.HmacSHA256(data, key);
//     return signature.toString(CryptoJS.enc.Base64);
//   }
// }

// export default Encryption;
