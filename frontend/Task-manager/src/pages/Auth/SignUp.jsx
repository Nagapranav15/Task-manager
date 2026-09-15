import React, { useState, useContext } from 'react';
import AuthLayout from '../../components/layouts/AuthLayout';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import API_PATHS from '../../utils/apiPaths';
import { UserContext } from '../../context/userContext';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-hot-toast';

const Signup = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isDummyClientId = !googleClientId || googleClientId.includes("dummyid") || googleClientId.includes("1055743493407");

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Signup] Submitting Google OAuth token to backend');
      const response = await axiosInstance.post(API_PATHS.AUTH.GOOGLE, {
        token: credentialResponse.credential,
      });
      const { token, role } = response.data || {};
      if (token) {
        localStorage.setItem("token", token);
        updateUser(response.data);
        toast.success(`Welcome, ${response.data.name}! Account created successfully.`);
        if (role === "admin") {
          navigate("/admin/dashboard");
        } else if (role === "manager") {
          navigate("/manager/dashboard");
        } else {
          navigate("/user/dashboard");
        }
      } else {
        setError("Invalid response from server. Please try again.");
      }
    } catch (err) {
      console.error("[Signup] Google Auth error:", err);
      if (err.response && err.response.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === "ECONNABORTED") {
        setError("Request timed out. Please check your internet connection.");
      } else {
        setError("Google signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full flex flex-col justify-center items-center py-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-3 shadow-inner">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Create your account
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
            Sign up exclusively using your official organization Google Workspace account.
          </p>
        </div>

        {/* Organization restriction pill */}
        <div className="w-full max-w-sm mb-6 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15 dark:bg-indigo-500/10 dark:border-indigo-500/20 text-center">
          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Allowed Domain: <code className="font-bold bg-indigo-100 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded text-indigo-800 dark:text-indigo-200">@thinklabdigitalsolutions.com</code>
          </span>
        </div>

        {/* Google OAuth Section */}
        <div className="w-full max-w-sm flex flex-col items-center justify-center gap-4">
          {error && (
            <div className="w-full p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold text-center leading-relaxed animate-fadeIn">
              {error}
            </div>
          )}

          <div className="w-full flex justify-center py-2">
            {isDummyClientId ? (
              <button
                type="button"
                onClick={() => {
                  toast.error(
                    "Google OAuth Configuration Required: Please create a valid Client ID in Google Cloud Console and set VITE_GOOGLE_CLIENT_ID inside your frontend .env file.",
                    { duration: 7500 }
                  );
                }}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/80 px-4 py-3 rounded-2xl cursor-pointer text-xs font-bold transition-all active:scale-[0.98] shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.68 14.93 1 12 1 7.37 1 3.4 3.66 1.45 7.54l3.85 3C6.22 7.55 8.92 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.99 3.7-8.62z" />
                  <path fill="#FBBC05" d="M5.3 14.54c-.24-.72-.38-1.5-.38-2.3 0-.8.14-1.58.38-2.3L1.45 6.94C.52 8.88 0 11.08 0 13.4s.52 4.52 1.45 6.46l3.85-3.32z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.73-2.89c-1.03.69-2.35 1.1-4.23 1.1-3.08 0-5.78-2.51-6.7-5.5l-3.85 3C3.4 19.34 7.37 23 12 23z" />
                </svg>
                <span>Sign up with Google</span>
              </button>
            ) : (
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    setError("Google authentication was canceled or failed.");
                  }}
                  useOneTap={false}
                  theme="filled_dark"
                  shape="pill"
                  size="large"
                  text="signup_with"
                  width="340"
                />
              </div>
            )}
          </div>

          {loading && (
            <p className="text-xs text-indigo-500 font-medium animate-pulse">
              Authenticating with Google...
            </p>
          )}
        </div>

        {/* Footer link */}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-8 text-center">
          Already have an account?{" "}
          <Link
            className="font-bold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
            to="/login"
          >
            Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Signup;
