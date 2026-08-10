import userReducers from "./userReducer";
import selectedChatsReducer from "./selectedChatsReducer"
import chatReducer from "./chatReducer"
import notificatioReducer from "./notificatioReducer"


import userStatusesReducer from "./userStatusesReducer";

import { combineReducers } from "redux";

const rootReducer = combineReducers({
   user: userReducers,
   selectedChats: selectedChatsReducer,
   chats: chatReducer,
   notification: notificatioReducer,
   userStatuses: userStatusesReducer
})

export default rootReducer;