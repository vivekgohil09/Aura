// Ultra-fast GZIP Compression & Decompression for overall document / image encoding

export const compressData = async (text) => {
    if (!text || typeof text !== 'string' || text.length < 50) return text;
    try {
        const blob = new Blob([text]);
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
        console.warn('Compression fallback:', e);
        return text;
    }
};

export const decompressData = async (text) => {
    if (!text || typeof text !== 'string' || !text.startsWith('[gz]')) return text;
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
        return await response.text();
    } catch (e) {
        console.warn('Decompression fallback:', e);
        return text;
    }
};
