import posthog from 'posthog-js';

// Initialize PostHog
posthog.init('phc_kp0LaAb4na9k8vD0lwdsLsK8QCzPAklDjPa9T2Pal3K', {
    api_host: 'https://eu.i.posthog.com',
    autocapture: true, // Automatically capture clicks, etc.
    capture_pageview: true,
    persistence: 'localStorage',
});

export { posthog };
