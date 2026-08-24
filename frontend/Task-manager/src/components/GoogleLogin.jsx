import React, { useEffect, useRef } from "react";
import { BASE_URL } from "../utils/apiPaths";

const GoogleLogin = ({ onSuccess, onError, theme = "filled_dark", shape = "circle", width = "340" }) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    let active = true;

    const initializeGsi = () => {
      if (!active) return;
      if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        console.warn("[GoogleLogin] Google Identity Services SDK is not fully loaded yet.");
        return;
      }

      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "598311786240-o6ab6900trav4483i1emsb4m32dmfmib.apps.googleusercontent.com";

      // Use redirect mode to completely avoid popup/postMessage COOP issues.
      // Google redirects to our backend callback, which verifies the credential
      // and redirects back to the frontend with a JWT token in the URL.
      const loginUri = `${BASE_URL}/api/auth/google/login-callback`;

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          ux_mode: "redirect",
          login_uri: loginUri,
        });
      } catch (err) {
        console.warn("[GoogleLogin] Error initializing GSI:", err);
      }

      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme,
          shape,
          width: parseInt(width, 10) || 340,
        });
      }
    };

    if (window.google && window.google.accounts && window.google.accounts.id) {
      initializeGsi();
    } else {
      // Check periodically for script availability if not immediately loaded
      const interval = setInterval(() => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
          clearInterval(interval);
          initializeGsi();
        }
      }, 100);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }

    return () => {
      active = false;
    };
  }, [theme, shape, width]);

  return <div ref={buttonRef} id="google-login-button-container" className="flex justify-center" />;
};

export default GoogleLogin;
