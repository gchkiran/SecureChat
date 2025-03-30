// Function to hash email using SHA-256
async function hashEmail(email) {
    const encoder = new TextEncoder();
    const data = encoder.encode(email);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
}

async function deriveSeed(hashBuffer) {
    const salt = new Uint8Array(16); // Use a fixed salt for deterministic results
    const info = new TextEncoder().encode("key-generation");
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        hashBuffer,
        { name: "HKDF" },
        false,
        ["deriveBits"]
    );

    const seed = await crypto.subtle.deriveBits(
        {
            name: "HKDF",
            hash: "SHA-256",
            salt: salt,
            info: info,
        },
        keyMaterial,
        256 // Generate a 256-bit seed
    );

    return new Uint8Array(seed);
}



// Function to generate RSA key pair based on hashed email
export async function generateKeyPair(email) {
    // Step 1: Hash the email to get a consistent value
    const hashBuffer = await hashEmail(email);

    // Step 2: Derive a deterministic seed from the hashed value
    const seed = await deriveSeed(hashBuffer);

    // Check if the keys already exist in localStorage
    const existingPrivateKey = localStorage.getItem('privateKey');
    if (existingPrivateKey) {
        console.log('Keys already exist in localStorage.');
        return {
            privateKey: JSON.parse(localStorage.getItem('privateKey')),
            publicKey: JSON.parse(localStorage.getItem('publicKey')),
        };
    }


    // Generate RSA key pair (this part doesn't directly use the hash, but you could use the hash as a "seed" for your key)
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,  // Key length (2048 bits)
            publicExponent: new Uint8Array([1, 0, 1]),  // Common public exponent
            hash: "SHA-256",  // Hash algorithm,
            seed: seed, 
        },
        true,  // Whether the key can be exported
        ["encrypt", "decrypt"]  // Usages for the key (encryption and decryption)
    );

    // Export the public and private keys in JWK format (JSON Web Key)
    const publicKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const privateKey = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

    // Encrypt the private key
    const encryptedPrivateKey = await encryptPrivateKey(privateKey, 'user-passphrase');

    // Convert encrypted private key to Base64
    const encryptedPrivateKeyBase64 = arrayBufferToBase64(encryptedPrivateKey.encryptedPrivateKey);

    // Store the public key, Base64-encoded encrypted private key, salt, and IV in localStorage
    localStorage.setItem('privateKey', JSON.stringify(encryptedPrivateKeyBase64));
    localStorage.setItem('publicKey', JSON.stringify(publicKey));
    localStorage.setItem('salt', JSON.stringify(Array.from(encryptedPrivateKey.salt)));
    localStorage.setItem('iv', JSON.stringify(Array.from(encryptedPrivateKey.iv)));

    console.log('Keys generated and stored securely');
    return { privateKey: encryptedPrivateKey.encryptedPrivateKey, publicKey: publicKey };
}



// Encrypt private key using AES-GCM
async function encryptPrivateKey(privateKey, passphrase) {
    const encoder = new TextEncoder();
    const data = encoder.encode(passphrase);
    const key = await window.crypto.subtle.importKey(
      "raw",
      data,
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
  
    const salt = window.crypto.getRandomValues(new Uint8Array(16)); // Random salt
    const iv = window.crypto.getRandomValues(new Uint8Array(12));  // Initialization vector
  
    // Derive a symmetric AES key using the passphrase
    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      key,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  
    // Encrypt the private key using AES-GCM
    const privateKeyString = JSON.stringify(privateKey);
    const encodedPrivateKey = new TextEncoder().encode(privateKeyString);
    const encryptedPrivateKey = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      derivedKey,
      encodedPrivateKey
    );
    return { encryptedPrivateKey, salt, iv };
  }
  
  async function decryptPrivateKey(encryptedPrivateKey, passphrase, salt, iv) {
    try {
        if (!(salt instanceof Uint8Array)) {
            throw new Error("Salt must be a Uint8Array");
        }
        if (!(iv instanceof Uint8Array)) {
            throw new Error("IV must be a Uint8Array");
        }

        // Convert passphrase to Uint8Array
        const encoder = new TextEncoder();
        const passphraseBytes = encoder.encode(passphrase);

        // Import the passphrase to derive the AES key
        const key = await window.crypto.subtle.importKey(
            "raw",
            passphraseBytes, // Passphrase in Uint8Array format
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        // Derive the symmetric AES key using PBKDF2
        const derivedKey = await window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt, // Salt as Uint8Array
                iterations: 100000,
                hash: "SHA-256"
            },
            key, // The passphrase-derived key
            { name: "AES-GCM", length: 256 },
            false,
            ["decrypt"] // Key usage: decryption
        );

        // Decrypt the private key
        const decryptedPrivateKeyBytes = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv }, // AES-GCM decryption
            derivedKey, // Derived AES key
            encryptedPrivateKey // Encrypted private key (ArrayBuffer)
        );

        // Decode the decrypted bytes to string
        const decoder = new TextDecoder();
        const privateKeyString = decoder.decode(decryptedPrivateKeyBytes);

        // Return the parsed private key
        return JSON.parse(privateKeyString);

    } catch (error) {
        console.error("Error in decryptPrivateKey:", error);
        throw error;
    }
}

  
// Retrieve the encrypted private key from localStorage and decrypt
export default async function getPrivateKey(passphrase) {
    const encryptedPrivateKeyBase64 = JSON.parse(localStorage.getItem('privateKey'));
    const encryptedPrivateKey = base64ToArrayBuffer(encryptedPrivateKeyBase64);
    const salt = convertObjectToUint8Array(JSON.parse(localStorage.getItem('salt')));
    const iv = convertObjectToUint8Array(JSON.parse(localStorage.getItem('iv')));

    return decryptPrivateKey(
        encryptedPrivateKey,
        passphrase,
        salt,
        iv
    );
}

function convertObjectToUint8Array(object) {
    const array = Object.values(object); // Convert object to array of values
    return new Uint8Array(array); // Return as Uint8Array
}


// Function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
    const byteArray = new Uint8Array(buffer);
    let binaryString = '';
    for (let i = 0; i < byteArray.byteLength; i++) {
        binaryString += String.fromCharCode(byteArray[i]);
    }
    return window.btoa(binaryString); // Convert to Base64 string
}

// Function to convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64); // Decode Base64 to binary string
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer; // Return ArrayBuffer
}

  