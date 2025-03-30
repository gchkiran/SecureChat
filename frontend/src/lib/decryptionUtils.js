// Decryption Utility Functions (decryptionUtils.js)

// Function to import the private key from JWK format (if it is in JWK format)
export async function importPrivateKey(jwkPrivateKey) {
  try {

    if (!jwkPrivateKey || !jwkPrivateKey.d) {
      throw new Error("Invalid private key format.");
    }

    const privateKey = await window.crypto.subtle.importKey(
      "jwk", // The format of the key
      jwkPrivateKey, // The private key in JWK format
      {
        name: "RSA-OAEP", // Algorithm name
        hash: "SHA-256", // Hash algorithm used in RSA-OAEP
      },
      false, // The key is for decryption only
      ["decrypt"] // Usages for the key (decryption)
    );

    return privateKey;
  } catch (error) {
    console.error("Error in importPrivateKey:", error.message);
    throw error; // Rethrow the error for further handling
  }
}

// Function to decrypt the encrypted message using the receiver's private key
export async function decryptMessage(encryptedMessage, privateKeyJwk) {
  try {

    if (encryptedMessage.byteLength === 0) {
      throw new Error("Encrypted message is empty.");
    }

    // Import the private key
    const privateKey = await importPrivateKey(privateKeyJwk);

    // Decrypt the encrypted message using the private key
    const decryptedMessage = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP", // RSA decryption with OAEP padding
      },
      privateKey, // The receiver's private key (CryptoKey)
      encryptedMessage // The encrypted message (ArrayBuffer)
    );

    // Convert the decrypted message back to a string (UTF-8 encoded)
    const decoder = new TextDecoder();
    const decodedMessage = decoder.decode(decryptedMessage);

    return decodedMessage; // Return the decrypted plain text message
  } catch (error) {
    console.error("Error in decryptMessage:", error.message);
    throw error; // Rethrow the error to handle it in the caller function
  }
}


// Function to convert Base64 string to ArrayBuffer
export function base64ToArrayBuffer(base64) {
  try {
    const binaryString = window.atob(base64); // Decode from Base64 to binary string
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer; // Return as ArrayBuffer
  } catch (error) {
    console.error("Error in base64ToArrayBuffer:", error.message);
    throw error; // Rethrow the error to handle it in the caller function
  }
}
