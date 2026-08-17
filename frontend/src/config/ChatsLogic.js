export const getSender = (loggedUser, users) => {
    if (!users || users.length === 0) return "User";
    
    let x = {};
    try {
        x = JSON.parse(localStorage.getItem("userInfo") || "{}");
    } catch (e) {}
    
    const currentUser = x.userLogin || x.data || x || loggedUser?.userLogin || loggedUser || {};
    const loggedId = currentUser._id || currentUser.id || currentUser.userId;
    const loggedEmail = currentUser.email ? currentUser.email.toLowerCase() : "";

    if (users.length === 1) {
        return users[0]?.name ? `${users[0].name} (You)` : "Saved Messages (You)";
    }

    const otherUser = users.find(u => {
        const uId = u._id || u.id || u.userId;
        const uEmail = u.email ? u.email.toLowerCase() : "";
        if (loggedId && uId) {
            return String(uId) !== String(loggedId);
        }
        if (loggedEmail && uEmail) {
            return uEmail !== loggedEmail;
        }
        return false;
    });

    if (otherUser && otherUser.name) {
        return otherUser.name;
    }

    // Fallback: iterate users to find recipient
    for (let u of users) {
        const uId = u._id || u.id || u.userId;
        const uEmail = u.email ? u.email.toLowerCase() : "";
        if (loggedId && uId && String(uId) !== String(loggedId) && u.name) {
            return u.name;
        }
        if (loggedEmail && uEmail && uEmail !== loggedEmail && u.name) {
            return u.name;
        }
        if (u.name && u.name !== "User") {
            return u.name;
        }
    }

    return users[0]?.name || "User";
};

export const getSenderUser = (loggedUser, users) => {
    if (!users || users.length === 0) return null;
    let x = {};
    try {
        x = JSON.parse(localStorage.getItem("userInfo") || "{}");
    } catch (e) {}
    const currentUser = x.userLogin || x.data || x || loggedUser?.userLogin || loggedUser || {};
    const loggedId = currentUser._id || currentUser.id || currentUser.userId;
    const loggedEmail = currentUser.email ? currentUser.email.toLowerCase() : "";

    const otherUser = users.find(u => {
        const uId = u._id || u.id || u.userId;
        const uEmail = u.email ? u.email.toLowerCase() : "";
        if (loggedId && uId) {
            return String(uId) !== String(loggedId);
        }
        if (loggedEmail && uEmail) {
            return uEmail !== loggedEmail;
        }
        return false;
    });

    return otherUser || users[0] || null;
};

export const getPicture = (loggedUser, users) => {
    const defaultPic = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    if (!users || users.length === 0) return defaultPic;
    
    let x = {};
    try {
        x = JSON.parse(localStorage.getItem("userInfo") || "{}");
    } catch (e) {}
    
    const currentUser = x.userLogin || x.data || x || loggedUser?.userLogin || loggedUser || {};
    const loggedId = currentUser._id || currentUser.id || currentUser.userId;
    const loggedEmail = currentUser.email ? currentUser.email.toLowerCase() : "";

    let targetUser = users.find(u => {
        const uId = u._id || u.id || u.userId;
        const uEmail = u.email ? u.email.toLowerCase() : "";
        if (loggedId && uId) {
            return String(uId) !== String(loggedId);
        }
        if (loggedEmail && uEmail) {
            return uEmail !== loggedEmail;
        }
        return false;
    });

    if (!targetUser && users.length > 0) {
        targetUser = users[0];
    }
    
    let rawPic = targetUser?.pic || targetUser?.avatar || targetUser?.picture || targetUser?.profilePic || targetUser?.photo || targetUser?.image;
    if (!rawPic || rawPic.trim() === "" || rawPic.includes("icon-library.com") || rawPic.includes("flaticon.com")) {
        return "";
    }
    return rawPic;
};

export const isSameSender = (messages, m, i) => {
    let x = {};
    try {
        x = JSON.parse(localStorage.getItem("userInfo") || "{}");
    } catch (e) {}
    const currentUser = x.userLogin || x.data || x || {};
    const loggedId = currentUser._id || currentUser.id || currentUser.userId;
    
    const senderId = m?.sender?._id || m?.sender?.id || m?.sender;
    const nextSenderId = messages[i + 1]?.sender?._id || messages[i + 1]?.sender?.id || messages[i + 1]?.sender;
    return (
        i < messages.length - 1 &&
        (String(nextSenderId) !== String(senderId) || nextSenderId === undefined) &&
        String(senderId) !== String(loggedId)
    );
};

export const isLastMessage = (messages, i) => {
    let x = {};
    try {
        x = JSON.parse(localStorage.getItem("userInfo") || "{}");
    } catch (e) {}
    const currentUser = x.userLogin || x.data || x || {};
    const loggedId = currentUser._id || currentUser.id || currentUser.userId;
    
    const lastSenderId = messages[messages.length - 1]?.sender?._id || messages[messages.length - 1]?.sender?.id || messages[messages.length - 1]?.sender;
    return (
        i === messages.length - 1 &&
        String(lastSenderId) !== String(loggedId) &&
        Boolean(lastSenderId)
    );
};

export const isSameSenderMargin = (messages, m, i) => {
    let x = {};
    try {
        x = JSON.parse(localStorage.getItem("userInfo") || "{}");
    } catch (e) {}
    const currentUser = x.userLogin || x.data || x || {};
    const loggedId = currentUser._id || currentUser.id || currentUser.userId;
    
    const senderId = m?.sender?._id || m?.sender?.id || m?.sender;
    const nextSenderId = messages[i + 1]?.sender?._id || messages[i + 1]?.sender?.id || messages[i + 1]?.sender;
    if (
        i < messages.length - 1 &&
        String(nextSenderId) === String(senderId) &&
        String(senderId) !== String(loggedId)
    )
        return 33;
    else if (
        (i < messages.length - 1 &&
            String(nextSenderId) !== String(senderId) &&
            String(senderId) !== String(loggedId)) ||
        (i === messages.length - 1 && String(senderId) !== String(loggedId))
    )
        return 0;
    else return 0;
};

export const isSameUser = (messages, m, i) => {
    const senderId = m?.sender?._id || m?.sender?.id || m?.sender;
    const prevSenderId = messages[i - 1]?.sender?._id || messages[i - 1]?.sender?.id || messages[i - 1]?.sender;
    return i > 0 && String(prevSenderId) === String(senderId);
};