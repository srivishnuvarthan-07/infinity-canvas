const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET; // Must be 32 characters
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypts plain text using AES-256-CBC
 * @param {string} text 
 * @returns {string} - format: iv:encryptedData
 */
function encryptKey(text) {
    if (!text) return null;
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypts encrypted text using AES-256-CBC
 * @param {string} text - format: iv:encryptedData
 * @returns {string}
 */
function decryptKey(text) {
    if (!text) return null;

    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return decrypted.toString();
    } catch (error) {
        console.error('Decryption failed:', error.message);
        return null;
    }
}

module.exports = {
    encryptKey,
    decryptKey
};
