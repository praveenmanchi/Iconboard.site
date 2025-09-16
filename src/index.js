import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { PostHogProvider } from 'posthog-js/react';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={process.env.REACT_APP_POSTHOG_KEY}
      options={{
        api_host: process.env.REACT_APP_POSTHOG_HOST,
        defaults: '2025-05-24',
        capture_exceptions: true,
        debug: process.env.NODE_ENV === "development",
      }}
    >
      <App />
    </PostHogProvider>
  </React.StrictMode>,
);