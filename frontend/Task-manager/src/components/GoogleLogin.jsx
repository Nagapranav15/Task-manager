import React, { useEffect, useRef } from "react";

const GoogleLogin = ({ onSuccess, onError, theme = "filled_dark", shape = "circle", width = "340" }) => {
  const buttonRef = useRef(null);

  // Use a ref to store callbacks so inline functions do not trigger useEffect re-runs
  const callbacksRef = useRef({ onSuccess, onError });
  useEffect(() => {
    callbacksRef.current = { onSuccess, onError };
  }, [onSuccess, onError]);

  useEffect(() => {
    let active = true;

    const initializeGsi = () => {
      if (!active) return;
      if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        console.warn("[GoogleLogin] Google Identity Services SDK is not fully loaded yet.");
        return;
      }

      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "598311786240-o6ab6900trav4483i1emsb4m32dmfmib.apps.googleusercontent.com";

      // Initialize Google Identity Services with FedCM support (fallback to popup)
      const initConfig = {
        client_id: googleClientId,
        ux_mode: "popup",
        callback: (response) => {
          if (response && response.credential) {
            callbacksRef.current.onSuccess?.({ credential: response.credential });
          } else {
            callbacksRef.current.onError?.();
          }
        },
      };

      try {
        // Try with FedCM first (modern browsers — avoids popup/postMessage entirely)
        window.google.accounts.id.initialize({
          ...initConfig,
          use_fedcm_for_prompt: true,
        });
      } catch (err) {
        console.warn("[GoogleLogin] FedCM init failed, falling back to legacy popup mode:", err);
        try {
          // Fallback: disable FedCM for browsers that don't support it
          window.google.accounts.id.initialize({
            ...initConfig,
            use_fedcm_for_prompt: false,
          });
        } catch (fallbackErr) {
          console.warn("[GoogleLogin] Error initializing GSI:", fallbackErr);
        }
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

