import * as CryptoUtils from '../CryptoUtils';

describe('CryptoUtils', () => {
  describe('generateECDSAKeyPair', () => {
    it('should generate an ECDSA key pair with public and private keys', async () => {
      const keyPair = await CryptoUtils.generateECDSAKeyPair();
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
    });
  });

  describe('generateECDHKeyPair', () => {
    it('should generate an ECDH key pair with public and private keys', async () => {
      const keyPair = await CryptoUtils.generateECDHKeyPair();
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
    });
  });

  describe('deriveID', () => {
    it('should derive an ID from a given code', async () => {
      const code = "testCode";
      const id = await CryptoUtils.deriveID(code);
      expect(id).toBeDefined();
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('importRawAESGCMEcryptAndDecryptKey', () => {
    it('should import a raw AES-GCM key for encryption and decryption', async () => {
      const keyData = new Uint8Array(16).fill(1); // Example key data
      const importedKey = await CryptoUtils.importRawAESGCMEcryptAndDecryptKey(keyData);
      expect(importedKey).toBeDefined();
      // Further assertions can be made based on the properties of the importedKey
    });
  });

  describe('ECDHDeriveEncrypt', () => {
    it('should derive an encryption key from ECDH key pair and encrypt data', async () => {
      // This test would require generating an ECDH key pair and then using one of the keys with ECDHDeriveEncrypt
      // Due to the complexity of setting up valid ECDH keys here, this example will be more conceptual
      const privateKey = await CryptoUtils.generateECDHKeyPair().then(kp => kp.privateKey);
      const publicKey = await CryptoUtils.generateECDHKeyPair().then(kp => kp.publicKey);
      const encryptedData = await CryptoUtils.ECDHDeriveEncrypt(privateKey, publicKey);
      expect(encryptedData).toBeDefined();
      // Further assertions can be made based on the properties of the encryptedData
    });
  });
});