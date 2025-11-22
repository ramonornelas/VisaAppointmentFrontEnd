// FastVisa Metrics Tracker
// This file provides utilities to track user interactions and page views

class FastVisaMetrics {
    constructor(apiEndpoint) {
        this.apiEndpoint = apiEndpoint || 'https://w3a0pdhqul.execute-api.us-west-1.amazonaws.com/metrics';
        this.sessionId = this.getOrCreateSessionId();
        this.userId = null;
    }

    /**
     * Get or create a session ID for the user
     * Session ID persists in sessionStorage for the browser session
     */
    getOrCreateSessionId() {
        let sessionId = sessionStorage.getItem('fastVisa_sessionId');
        if (!sessionId) {
            sessionId = this.generateUUID();
            sessionStorage.setItem('fastVisa_sessionId', sessionId);
        }
        return sessionId;
    }

    /**
     * Generate a simple UUID v4
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = (Math.random() * 16) | 0;
                const v = c === 'x' ? r : ((r & 0x3) | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Set the user ID for authenticated users
     */
    setUserId(userId) {
        this.userId = userId;
    }

    /**
     * Clear the user ID (for logout)
     */
    clearUserId() {
        this.userId = null;
    }

    /**
     * Record a metric event
     * @param {string} eventType - Type of event (page_view, button_click, form_submit, etc.)
     * @param {object} data - Additional data for the event
     */
    async recordEvent(eventType, data = {}) {
        try {
            const payload = {
                eventType: eventType,
                pageUrl: window.location.pathname,
                userAgent: navigator.userAgent,
                referrer: document.referrer,
                sessionId: this.sessionId,
                metadata: {
                    screenWidth: window.screen.width,
                    screenHeight: window.screen.height,
                    language: navigator.language,
                    ...data
                }
            };

            // Add userId if available
            if (this.userId) {
                payload.userId = this.userId;
            }

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.warn('Failed to record metric:', response.statusText);
            }

            return await response.json();
        } catch (error) {
            console.error('Error recording metric:', error);
        }
    }

    /**
     * Record a page view
     */
    async trackPageView() {
        return this.recordEvent('page_view', {
            title: document.title,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Record a button click
     * @param {string} buttonId - ID of the button
     * @param {string} buttonText - Text of the button
     */
    async trackButtonClick(buttonId, buttonText) {
        return this.recordEvent('button_click', {
            buttonId,
            buttonText,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Record a form submission
     * @param {string} formId - ID of the form
     * @param {boolean} success - Whether the submission was successful
     */
    async trackFormSubmit(formId, success = true) {
        return this.recordEvent('form_submit', {
            formId,
            success,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Record a custom event
     * @param {string} eventName - Name of the custom event
     * @param {object} customData - Custom data for the event
     */
    async trackCustomEvent(eventName, customData = {}) {
        return this.recordEvent(eventName, {
            ...customData,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Initialize automatic page view tracking
     * Tracks page views on initial load and navigation
     */
    initAutoTracking() {
        // Track initial page load
        if (document.readyState === 'complete') {
            this.trackPageView();
        } else {
            window.addEventListener('load', () => this.trackPageView());
        }

        // Track navigation in Single Page Applications (SPA)
        // This works with modern browsers that support the History API
        const originalPushState = window.history.pushState;
        const originalReplaceState = window.history.replaceState;
        const self = this;

        window.history.pushState = function(...args) {
            originalPushState.apply(this, args);
            self.trackPageView();
        };

        window.history.replaceState = function(...args) {
            originalReplaceState.apply(this, args);
            self.trackPageView();
        };

        // Track back/forward navigation
        window.addEventListener('popstate', () => this.trackPageView());
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FastVisaMetrics;
}

export default FastVisaMetrics;

// Example usage:
/*

// Initialize the metrics tracker
const metrics = new FastVisaMetrics();

// Enable automatic page view tracking
metrics.initAutoTracking();

// Set user ID when user logs in
metrics.setUserId('user-12345');

// Track a button click
document.getElementById('appointment-button').addEventListener('click', () => {
    metrics.trackButtonClick('appointment-button', 'Schedule Appointment');
});

// Track a form submission
document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // ... handle form submission ...
    
    const success = true; // or false if submission failed
    await metrics.trackFormSubmit('contact-form', success);
});

// Track a custom event
metrics.trackCustomEvent('video_played', {
    videoId: 'intro-video',
    duration: 120,
    position: 'homepage'
});

// Clear user ID on logout
function logout() {
    metrics.clearUserId();
    // ... rest of logout logic ...
}

*/
