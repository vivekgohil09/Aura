export const getJwtToken = () => {
  let token = localStorage.getItem("jwt");
  if (!token) return "";
  try {
    const parsed = JSON.parse(token);
    if (typeof parsed === "string") token = parsed;
  } catch (e) {
    // raw string
  }
  return token.replace(/^"+|"+$/g, '').trim();
};

export const handleAuthError = (error, history) => {
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    console.warn("Auth warning:", error.response.status);
    return false;
  }
  return false;
};
