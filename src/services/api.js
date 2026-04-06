// src/services/api.js

// Define base URLs for your microservices
import errorHandler from "./errorHandler";

const USER_SERVICE_URL = 'http://localhost:11301';
const ACCESS_SERVICE_URL = 'http://localhost:11302'; // Dashboard specific endpoints
const URL = 'http://localhost:11303';


//--------------------------------------------------------------------------------------------------------------------------------
// Generic fetch function adapted to accept a specific base URL
const fetchFunction = async (requestType, baseUrl, url, options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const config = {
        ...options,
        headers,
        credentials: 'include', // Ensures cookies are sent with requests
    };

    const TIMEOUT = 2000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
    config.signal = controller.signal;

    let response;
    try {
        response = await fetch(`${baseUrl}${url}`, config);
    } catch (err) {
        clearTimeout(timeoutId);
        // detect abort vs other network error
        if (err.name === 'AbortError') {
            const e = new Error('Request timed out — experiencing server issues, please try again later.');
            e.status = 0;
            throw e;
        }
        const e = new Error('Experiencing server issues, please try again later.');
        e.status = 0;
        throw e;
    }
    clearTimeout(timeoutId);


    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = await errorHandler(requestType, response.status, errorData) || "Unexpected error.";
        const err = new Error(error);
        err.status = response.status;
        throw err;
    }

    // Handle cases where response might be 204 No Content or no body
    // Check Content-Type header to ensure it's JSON before trying to parse
    const contentType = response.headers.get('content-type');
    if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
        return {}; // Return empty object for no content or non-JSON responses
    }

    return response.json();
};

//--------------------------------------------------------------------------------------------------------------------------------
// --- Auth Service API Calls ---

// login request
export const loginRequest = async (username, password) => {
    // Backend should return 200 OK and set HttpOnly cookie
    return await fetchFunction("loginRequest", URL, '/auth/login', {
        method: 'POST',
        body: JSON.stringify({username, password}),
    }); // May return user data, or just a success message (no token)
};

// backend deletes cookie
export const logoutRequest = async () => {
    await fetchFunction("logoutRequest", URL, '/auth/logout', {
        method: 'DELETE',
    });
    return true;
};

// request to update token, also used to verify if user has token
export const checkAuthSession = async () => {
    return await fetchFunction("updateTokenRequest", URL, '/auth/token', {
        method: 'PUT',
    }); // Returns user data if valid, or throws error if 401/403
};

//--------------------------------------------------------------------------------------------------------------------------------
// --- Access Service API Calls ---


export const requestDashboardAccess = async () => {
    // Assuming this endpoint requires a valid auth cookie to return dashboard-specific data
    return await fetchFunction("dashboardAccessRequest", ACCESS_SERVICE_URL, '/dashboard', {
        method: 'GET',
    });
};

export const requestAdminAccess = async () => {
    return await fetchFunction("adminAccessRequest", ACCESS_SERVICE_URL, '/admin', {
        method: 'GET',
    });
};

export const requestProfileAccess = async () => {
    return await fetchFunction("profileAccessRequest", ACCESS_SERVICE_URL, '/profile', {
        method: 'GET',
    });
};


//--------------------------------------------------------------------------------------------------------------------------------
// --- User Service API Calls ---

export const registerRequest = async (username, email, password) => {
    // Backend should return 200 OK and set HttpOnly cookie (if auto-login)
    return await fetchFunction("registerRequest", USER_SERVICE_URL, '/', {
        method: 'POST',
        body: JSON.stringify({username, email, password}),
    }); // May return user data, or just a success message (no token)
};

export const userListRequest = async () => {
    // Backend should return 200 OK and set HttpOnly cookie (if auto-login)
    return await fetchFunction("userListRequest", USER_SERVICE_URL, '/list', {
        method: 'GET'
    }); // May return user data, or just a success message (no token)
};

export const userProfileRequest = async () => {
    // Backend should return 200 OK and set HttpOnly cookie (if auto-login)
    return await fetchFunction("userProfileRequest", USER_SERVICE_URL, '/me', {
        method: 'GET'
    }); // May return user data, or just a success message (no token)
};
//--------------------------------------------------------------------------------------------------------------------------------