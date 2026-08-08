// AES-256-GCM End-to-End Encryption & Ultra-fast GZIP Compression Utility

const ENCRYPTION_KEY_RAW = "AuraSecKey2026AES256GCM256BitSecurity!"; // Secret master salt key

async function getDerivedKey() {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(ENCRYPTION_KEY_RAW),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode("aura_salt_2026"),
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

export const encryptMessage = async (text) => {
    if (!text || typeof text !== 'string') return text;
    try {
        const key = await getDerivedKey();
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder();
        const encrypted = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            key,
            enc.encode(text)
        );
        const ivB64 = btoa(String.fromCharCode(...iv));
        const dataB64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
        return `[enc]${ivB64}:${dataB64}`;
    } catch (e) {
        return text;
    }
};

export const decryptMessage = async (text) => {
    if (!text || typeof text !== 'string' || !text.startsWith('[enc]')) return text;
    try {
        const raw = text.substring(5);
        const parts = raw.split(':');
        if (parts.length !== 2) return text;
        const [ivB64, dataB64] = parts;

        const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
        const data = Uint8Array.from(atob(dataB64), c => c.charCodeAt(0));

        const key = await getDerivedKey();
        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            data
        );
        const dec = new TextDecoder();
        return dec.decode(decrypted);
    } catch (e) {
        return text;
    }
};

export const compressData = async (text) => {
    if (!text || typeof text !== 'string') return text;
    try {
        const encrypted = await encryptMessage(text);
        if (encrypted.length < 50) return encrypted;
        const blob = new Blob([encrypted]);
        const stream = blob.stream().pipeThrough(new CompressionStream('gzip'));
        const response = new Response(stream);
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const b64 = btoa(binary);
        return '[gz]' + b64;
    } catch (e) {
        return await encryptMessage(text);
    }
};

export const decompressData = async (text) => {
    if (!text || typeof text !== 'string') return text;
    let payload = text;
    if (text.startsWith('[gz]')) {
        try {
            const b64 = text.substring(4);
            const binary = atob(b64);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([bytes]);
            const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
            const response = new Response(stream);
            payload = await response.text();
        } catch (e) {
            payload = text;
        }
    }
    if (payload.startsWith('[enc]')) {
        return await decryptMessage(payload);
    }
    return payload;
};
