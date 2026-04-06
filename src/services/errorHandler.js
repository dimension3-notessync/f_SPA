
export default async function errorHandler(requestType, status, errorData) {
    console.log(errorData)
    let errorMessage = 'An unexpected error occurred.';
    if (errorData && typeof errorData === 'object') {
        if (errorData.message) errorMessage = errorData.message;
    }

// Network-level / no-response
    if (status === 0) {
        return 'Experiencing server issues, please try again later.';
    }

// Standard status-based overrides
    if (status === 401) {
        return 'Unauthorized: Your session is invalid. Please log in again.';
    }
    if (status === 403) {
        return 'Forbidden: You do not have permission to access this resource.';
    }
    if (status === 404) {
        return 'Not found: The requested resource does not exist.';
    }
    if (status === 500) {
        return 'An internal error occurred. Please try again later.';
    }

// Request-type specific messages (fall back to server message if present)
    switch (requestType) {
        case 'loginRequest':
            return errorData?.message || 'Login failed. Check credentials and try again.';
        case 'logoutRequest':
            return errorData?.message || 'Logout failed. Please try again.';
        case 'updateTokenRequest': // checkAuthSession
            return errorData?.message || 'Failed to refresh session. Please log in again.';
        case 'dashboardAccessRequest':
            return errorData?.message || 'Unable to access dashboard. Please try again later.';
        case 'registerRequest':
            return errorData?.message || 'Registration failed. Please check your input and try again.';
        // Add other specific request types here if you introduce more
        default:
            return errorMessage;
    }
}