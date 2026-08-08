const chatReducer = (state = null, action) => {
    switch (action.type) {
        case "SET_CHATS":
            const { data } = action.payload;
            if (Array.isArray(data)) {
                const uniqueChats = [];
                const seenIds = new Set();
                for (const chat of data) {
                    const chatId = String(chat.id || chat._id);
                    if (!seenIds.has(chatId)) {
                        seenIds.add(chatId);
                        uniqueChats.push(chat);
                    }
                }
                return uniqueChats;
            }
            return data;
        case "DEL_CHAT":
            return null;
        default: return state;
    }
}

export default chatReducer;