// src/services/api.js

// Define base URLs for your microservices
import errorHandler from "./errorHandler";

const URL = 'https://notessync.lobes.it/api'
export const files_URL = `${URL}`;

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
    return await fetchFunction("loginRequest", `${URL}/auth`, '', {
        method: 'POST',
        body: JSON.stringify({username, password}),
    }); // May return user data, or just a success message (no token)
};

// backend deletes cookie
export const logoutRequest = async () => {
    await fetchFunction("logoutRequest", `${URL}/auth`, '', {
        method: 'DELETE',
    });
    return true;
};

// request to update token, also used to verify if user has token
export const checkAuthSession = async () => {
    return await fetchFunction("updateTokenRequest", `${URL}/auth`, '/token', {
        method: 'PUT',
    }); // Returns user data if valid, or throws error if 401/403
};

//--------------------------------------------------------------------------------------------------------------------------------
// --- Access Service API Calls ---


export const requestDashboardAccess = async () => {
    // Assuming this endpoint requires a valid auth cookie to return dashboard-specific data
    return await fetchFunction("dashboardAccessRequest", `${URL}/access`, '/dashboard', {
        method: 'GET',
    });
};

export const requestAdminAccess = async () => {
    return await fetchFunction("adminAccessRequest", `${URL}/access`, '/admin', {
        method: 'GET',
    });
};

export const requestProfileAccess = async () => {
    return await fetchFunction("profileAccessRequest", `${URL}/access`, '/profile', {
        method: 'GET',
    });
};
export const systemHealthRequest = async () => {
    return await fetchFunction("systemHealthRequest", `${URL}/access`, '/health/check', {
        method: 'GET',
    });
};

//--------------------------------------------------------------------------------------------------------------------------------
// --- User Service API Calls ---

export const registerRequest = async (username, email, password) => {
    // Backend should return 200 OK and set HttpOnly cookie (if auto-login)
    return await fetchFunction("registerRequest", `${URL}/user`, '', {
        method: 'POST',
        body: JSON.stringify({username, email, password})
    }); // May return user data, or just a success message (no token)
};

export const userListRequest = async () => {
    // Backend should return 200 OK and set HttpOnly cookie (if auto-login)
    return await fetchFunction("userListRequest", `${URL}/user`, '/list', {
        method: 'GET'
    }); // May return user data, or just a success message (no token)
};

export const userProfileRequest = async () => {
    // Backend should return 200 OK and set HttpOnly cookie (if auto-login)
    return await fetchFunction("userProfileRequest", `${URL}/user`, '/me', {
        method: 'GET'
    }); // May return user data, or just a success message (no token)
};
export const changePasswordRequest = async (password, newPassword) => {
    // Backend should return 200 OK and set HttpOnly cookie (if auto-login)
    return await fetchFunction("changePasswordRequest", `${URL}/user`, '/password-change', {
        method: 'PUT',
        body: JSON.stringify({password, newPassword})
    });
};


// CORRECTED: To match backend's expectation of (username, permissionLevel) in body
// and endpoint /change/permissionLevel
export const updateUserPermission = async (username, newPermissionLevel) => {
    // Backend expects PUT http://localhost:11301/change/permissionLevel with { username, permissionLevel } in body
    return await fetchFunction("updateUserPermission", `${URL}/user`, `/permission`, {
        method: 'PUT',
        body: JSON.stringify({ username: username, permissionLevel: newPermissionLevel }),
    });
};
//--------------------------------------------------------------------------------------------------------------------------------
// --- Lectures Service API Calls ---

// Function to get upcoming lectures with a specified count
export const getUpcomingLectures = async (count = 2) => {
    try {
        // Use the common fetchFunction with the correct base URL and endpoint
        const data = await fetchFunction("getUpcomingLectures", `${URL}/lectures`, `/next/${count}`, {
            method: 'GET',
        });
        // fetchFunction returns the parsed JSON directly.
        // Assuming your backend response for upcoming lectures has a 'data' key.
        return data.data || [];
    } catch (error) {
        // fetchFunction already throws an error with a user-friendly message.
        // Re-throw it so the Dashboard component can catch and display it.
        throw error;
    }
};

export const addLectureRequest = async (lectureData) => {
    console.log(lectureData);
    return await fetchFunction("addLectureRequest", `${URL}/lectures`, '/add', {
        method: 'POST',
        body: JSON.stringify(lectureData),
    });
};

export const editLectureRequest = async (lectureId, updatedData) => {
    const payload = {
        id: lectureId, // The backend expects the ID in the body
        ...updatedData,
        // Explicitly convert boolean values to strings as per backend's editHandler
        start: updatedData.start.toString(),
        online: updatedData.online.toString(),
    };

    return await fetchFunction("editLectureRequest", `${URL}/lectures`, `/edit`, { // Route is just /edit
        method: 'PUT',
        body: JSON.stringify(payload),
    });
};
//--------------------------------------------------------------------------------------------------------------------------------
// --- Subscription Service API Calls ---

export const subscribeToLecture = async () => {
    return await fetchFunction("subscribeToLecture", `${URL}/subscriptions`, '/lectures', {
        method: 'POST'
    });
};
export const unsubscribeFromLecture = async () => {
    return await fetchFunction("unsubscribeFromLecture", `${URL}/subscriptions`, '/lectures', {
        method: 'DELETE'
    });
};
export const subscribeToAuthor = async (authorId) => {
    return await fetchFunction("subscribeToAuthor", `${URL}/subscriptions`, '/author/name', {
        method: 'POST',
        body: JSON.stringify({ authorname: authorId.toString() }), // Backend expects string representation of author ID
    });
};
export const unsubscribeFromAuthor = async (authorUsername) => { // Expect username as argument
    return await fetchFunction("unsubscribeFromAuthor", `${URL}/subscriptions`, `/author/${authorUsername}`, {
        method: 'DELETE',
    });
};
//--------------------------------------------------------------------------------------------------------------------------------
// Function to get all uploaded files
export const getAllFiles = async () => {
    try {
        // Use the common fetchFunction with the correct base URL and endpoint
        const data = await fetchFunction("getAllFiles", files_URL, `/notes`, { // Assuming GET / returns all files
            method: 'GET',
        });
        // fetchFunction returns the parsed JSON directly.
        // Assuming your backend response for files has a 'files' key.
        return data.files || [];
    } catch (error) {
        // fetchFunction already throws an error with a user-friendly message.
        // Re-throw it so the Dashboard component can catch and display it.
        throw error;
    }
};

export const uploadFileRequest = async (noteFile, lectureID, subject) => {
    const formData = new FormData();
    formData.append('noteFile', noteFile);
    formData.append('lectureID', lectureID);
    formData.append('subject', subject);

    // We use a modified version of fetchFunction or a direct fetch here
    // because fetchFunction sets 'Content-Type': 'application/json' by default
    const response = await fetch(`${files_URL}/upload`, {
        method: 'POST',
        body: formData,
        // No headers needed, browser sets multipart/form-data
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to upload file');
    }
    return response.json();
};
//--------------------------------------------------------------------------------------------------------------------------------