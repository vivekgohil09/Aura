const initialState = {};

const userStatusesReducer = (state = initialState, action) => {
    switch (action.type) {
        case "SET_USER_STATUSES":
            return action.payload.data || {};
        case "UPDATE_USER_STATUS":
            return {
                ...state,
                [action.payload.userId]: {
                    isOnline: action.payload.isOnline,
                    lastSeen: action.payload.lastSeen
                }
            };
        case "LOGOUT_USER":
            return initialState;
        default:
            return state;
    }
};

export default userStatusesReducer;
