import React, { useEffect, useRef } from "react";

const GoogleLogin = ({ onSuccess, onError, theme = "filled_dark", shape = "circle", width = "340" }) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    let active = true;

    const initializeGsi = () => {
      if (!active) return;
      if (!window.google) {
        console.warn("[GoogleLogin] window.google is not available.");
        return;
      }

      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1055743493407-dummyid.apps.googleusercontent.com";

      // Strict-mode safe single initialization
      if (!window.googleAccountsInitialized) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            if (response.credential) {
              onSuccess({ credential: response.credential });
            } else {
              onError && onError();
            }
          },
        });
        window.googleAccountsInitialized = true;
      }

      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme,
          shape,
          width: parseInt(width, 10) || 340,
        });
      }
    };

    if (window.google) {
      initializeGsi();
    } else {
      // Check periodically for script availability if not immediately loaded
      const interval = setInterval(() => {
        if (window.google) {
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
  }, [onSuccess, onError, theme, shape, width]);

  return <div ref={buttonRef} id="google-login-button-container" className="flex justify-center" />;
};

export default GoogleLogin;
