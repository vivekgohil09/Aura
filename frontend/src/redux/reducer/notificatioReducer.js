const notificatioReducer = (state = [], action) => {
    switch (action.type) {
        case "SET_NOTIFICATION": {
            const incoming = action.payload?.data;
            if (!incoming || !Array.isArray(incoming)) return [];

            // Strict deduplication by message ID, request ID, or chat ID
            const uniqueNotifs = [];
            const seenKeys = new Set();

            for (const item of incoming) {
                if (!item) continue;
                const id = item._id || item.id || item.clientMessageId;
                const senderId = item.senderId || (item.sender ? (item.sender._id || item.sender.id) : null);
                const chatId = item.chat ? (item.chat._id || item.chat.id) : (item.chatId || null);

                const key = item.isChatRequest
                    ? `req_${senderId}`
                    : id
                    ? `msg_${id}`
                    : `chat_${chatId}_${item.createdAt || Date.now()}`;

                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    uniqueNotifs.push(item);
                }
            }

            return uniqueNotifs;
        }
        default:
            return state;
    }
};

export default notificatioReducer;
