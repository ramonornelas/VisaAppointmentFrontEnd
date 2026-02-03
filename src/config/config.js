// Environment configuration
// Reads from .env.local (or .env.development/production as fallback)

// Base API URL (without environment suffix)
// IMPORTANT: Must be set in .env.local or environment files
const BASE_API_URL = process.env.REACT_APP_API_URL;

if (!BASE_API_URL) {
  throw new Error(
    "REACT_APP_API_URL is not defined. Please check your .env.local file."
  );
}

// Environment identifier (test or production)
export const ENVIRONMENT = process.env.REACT_APP_ENVIRONMENT || "test";

// Build final URL: append /TEST for test environment, use base URL for production
export const BASE_URL =
  ENVIRONMENT.toLowerCase() === "test" ? `${BASE_API_URL}/TEST` : BASE_API_URL;

// Log configuration on load (helpful for debugging)
console.log("Environment Configuration:", {
  environment: ENVIRONMENT,
  baseUrl: BASE_API_URL,
  finalApiUrl: BASE_URL,
});
