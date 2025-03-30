
export async function importPublicKey(jwkPublicKey) {
  try {

    if (!jwkPublicKey || !jwkPublicKey.n || !jwkPublicKey.e) {
      throw new Error("Invalid public key structure. It must contain 'n' and 'e'.");
    }

    if (!jwkPublicKey.kty) {
      jwkPublicKey.kty = "RSA";
    }

    const publicKey = await window.crypto.subtle.importKey(
      "jwk", 
      jwkPublicKey,  // The public key in JWK format (no need to call JSON.parse)
      {
        name: "RSA-OAEP", // RSA encryption with OAEP padding
        hash: "SHA-256",   // Hash algorithm for OAEP padding
      },
      false, // The key is only for encryption, not for signing
      ["encrypt"] // The key can be used only for encryption
    );
    
    return publicKey;

  } catch (error) {
    console.error("Error in importPublicKey:", error.message);
    throw error; 
  }
}

// Function to encrypt a message using the public key
export async function encryptMessage(message, publicKey) {
  try {

    // Check if the message and publicKey are valid
    if (!message || typeof message !== 'string' || !publicKey) {
      throw new Error("Invalid message or public key");
    }

    // Encode the message into a Uint8Array
    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(message); // Convert message to bytes


    // Encrypt the message using the public key
    const encryptedMessage = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP", // RSA Encryption with OAEP padding
      },
      publicKey, // The imported public key
      encodedMessage // The message to encrypt
    );


    return encryptedMessage;

  } catch (error) {
    console.error("Error in encryptMessage:", error.message);
    throw error;
  }
}

export function arrayBufferToBase64(buffer) {
  try {

    if (!(buffer instanceof ArrayBuffer)) {
      throw new Error("Input is not an ArrayBuffer");
    }

    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    const base64String = window.btoa(binary);

    return base64String;

  } catch (error) {
    console.error("Error in arrayBufferToBase64:", error.message);
    throw error;
  }
}
