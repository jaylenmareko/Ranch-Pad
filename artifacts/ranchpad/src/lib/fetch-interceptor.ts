/**
 * Monkey-patches the global fetch to automatically inject the JWT token
 * into requests destined for our /api. This ensures generated hooks from
 * @workspace/api-client-react inherently use auth without modification.
 */
const originalFetch = window.fetch;

window.fetch = async (...args) => {
  const [input, init] = args;
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

  // Only intercept /api calls
  if (url.includes("/api/")) {
    const token = localStorage.getItem("ranchpad_token");
    
    if (token) {
      const newInit = init || {};
      const headers = new Headers(newInit.headers || {});
      
      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      
      newInit.headers = headers;
      args[1] = newInit;
    }
  }

  const response = await originalFetch(...args);

  // If we hit a 401 on an API route AND we had a token, auto-logout.
  // Guests (no token) hitting 401 are expected — don't fire auth-expired.
  if (response.status === 401 && url.includes("/api/") && !url.includes("/api/auth/login")) {
    const hadToken = !!localStorage.getItem("ranchpad_token");
    if (hadToken) {
      localStorage.removeItem("ranchpad_token");
      window.dispatchEvent(new Event("auth-expired"));
    }
  }

  return response;
};

export {};
