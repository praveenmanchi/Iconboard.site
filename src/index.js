import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { PostHogProvider } from 'posthog-js/react';

const root = ReactDOM.createRoot(document.getElementById("root"));

// Only enable PostHog in production to avoid development console noise
const AppWithAnalytics = process.env.NODE_ENV === "production" && process.env.REACT_APP_POSTHOG_API_KEY ? (
  <PostHogProvider
    apiKey={process.env.REACT_APP_POSTHOG_API_KEY}
    options={{
      api_host: process.env.REACT_APP_POSTHOG_HOST || 'https://app.posthog.com',
      defaults: '2025-05-24',
      capture_exceptions: true,
      debug: false,
    }}
  >
    <App />
  </PostHogProvider>
) : <App />;

root.render(
  <React.StrictMode>
    {AppWithAnalytics}
  </React.StrictMode>,
);