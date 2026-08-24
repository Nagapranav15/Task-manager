import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthLayout from "../../components/layouts/AuthLayout";
import Inputs from "../../components/Inputs/Inputs";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/userContext";
import GoogleLogin from "../../components/GoogleLogin";
import { toast } from "react-hot-toast";
import { sparkle, checkDraw, shake } from "../../utils/celebrate";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  // OTP Login states
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSendingOtp, setForgotSendingOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [forgotCountdown, setForgotCountdown] = useState(0);

  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle Google OAuth redirect callback
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const googleAuth = params.get("google_auth");
    const authError = params.get("error");

    if (googleAuth) {
      try {
        const userData = JSON.parse(decodeURIComponent(googleAuth));
        if (userData && userData.token) {
          localStorage.setItem("token", userData.token);
          updateUser(userData);
          sparkle(null, "#6366f1", { count: 16 });
          toast.success("Welcome back!");
          // Clean URL before navigating
          window.history.replaceState({}, "", "/login");
          if (userData.role === "admin") {
            navigate("/admin/dashboard");
          } else if (userData.role === "manager") {
            navigate("/manager/dashboard");
          } else {
            navigate("/user/dashboard");
          }
        }
      } catch (err) {
        console.error("[Login] Failed to parse Google auth redirect data:", err);
        setError("Google Login failed. Please try again.");
        window.history.replaceState({}, "", "/login");
      }
    } else if (authError) {
      const errorMessages = {
        missing_credential: "Google authentication failed. No credential received.",
        invalid_token: "Google authentication failed. Invalid token.",
        unauthorized_domain: "Access denied. Only official organization emails are permitted.",
        server_error: "Server error during Google authentication. Please try again.",
      };
      setError(errorMessages[authError] || "Google authentication failed. Please try again.");
      window.history.replaceState({}, "", "/login");
    }
  }, [location.search]);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isDummyClientId = !googleClientId || googleClientId.includes("dummyid") || googleClientId.includes("1055743493407");

  // Login countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Forgot password countdown timer
  useEffect(() => {
    if (forgotCountdown > 0) {
      const timer = setTimeout(() => setForgotCountdown(forgotCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [forgotCountdown]);

  const handleSendOtp = async () => {
    if (!validateEmail(email)) {
      setError("Please enter a valid Email address");
      return;
    }

    const isOrgEmail = email.toLowerCase().endsWith("@thinklabdigitalsolutions.com") || email.toLowerCase() === "karanam.nagapranav@gmail.com";
    if (!isOrgEmail) {
      setError("Access denied. Only official organization emails (@thinklabdigitalsolutions.com) are permitted.");
      return;
    }

    setError("");
    setSendingOtp(true);

    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN_OTP_REQUEST, { email });
      setOtpSent(true);
      setCountdown(60);
      toast.success(response.data.message || "OTP sent successfully. Check your email!");
    } catch (err) {
      console.error("[Login OTP Request Error]", err);
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSendResetOtp = async () => {
    if (!validateEmail(forgotEmail)) {
      setForgotError("Please enter a valid Email address");
      return;
    }

    setForgotError("");
    setForgotSendingOtp(true);

    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.FORGOT_PASSWORD, { email: forgotEmail });
      setForgotOtpSent(true);
      setForgotCountdown(60);
      toast.success(response.data.message || "OTP sent successfully. Check your email!");
    } catch (err) {
      console.error("[Forgot Password OTP Error]", err);
      setForgotError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setForgotSendingOtp(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validateEmail(forgotEmail)) {
      setForgotError("Please enter a valid Email address");
      return;
    }
    if (!forgotOtp) {
      setForgotError("Please enter the verification code");
      return;
    }
    if (!newPassword) {
      setForgotError("Please enter new password");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError("Passwords do not match");
      return;
    }

    setForgotError("");
    setResettingPassword(true);

    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.RESET_PASSWORD, {
        email: forgotEmail,
        otp: forgotOtp,
        newPassword
      });
      checkDraw("#10b981", "PASSWORD RESET");
      toast.success(response.data.message || "Password reset successful!");
      setShowForgotModal(false);
      // Reset forgot states
      setForgotEmail("");
      setForgotOtp("");
      setForgotOtpSent(false);
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      console.error("[Reset Password Error]", err);
      setForgotError(err.response?.data?.message || "Failed to reset password. Please verify your OTP code.");
    } finally {
      setResettingPassword(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("Please enter a valid Email address");
      return;
    }

    const isOrgEmail = email.toLowerCase().endsWith("@thinklabdigitalsolutions.com") || email.toLowerCase() === "karanam.nagapranav@gmail.com";
    if (!isOrgEmail) {
      setError("Access denied. Only official organization emails (@thinklabdigitalsolutions.com) are permitted.");
      return;
    }

    if (isOtpMode) {
      if (!otp) {
        setError("Please enter the verification OTP code");
        return;
      }
      setError("");

      try {
        console.log("[Login] Submitting OTP verification request", { email });
        const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN_OTP_VERIFY, { email, otp });
        const { token, role } = response.data || {};
        if (token) {
          localStorage.setItem("token", token);
          updateUser(response.data);
          sparkle(null, "#6366f1", { count: 16 });
          toast.success("Welcome back!");
          if (role === "admin") {
            navigate("/admin/dashboard");
          } else if (role === "manager") {
            navigate("/manager/dashboard");
          } else {
            navigate("/user/dashboard");
          }
        }
      } catch (err) {
        console.error("[Login] OTP Verification Error", err);
        setError(err.response?.data?.message || "Invalid or expired OTP. Please try again.");
      }
    } else {
      if (!password) {
        setError("Please enter your password");
        return;
      }
      setError("");

      try {
        console.log("[Login] Submitting password login request", { email });
        const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, { email, password });
        const { token, role } = response.data || {};
        if (token) {
          localStorage.setItem("token", token);
          updateUser(response.data);
          sparkle(null, "#6366f1", { count: 16 });
          toast.success("Welcome back!");
          if (role === "admin") {
            navigate("/admin/dashboard");
          } else if (role === "manager") {
            navigate("/manager/dashboard");
          } else {
            navigate("/user/dashboard");
          }
        }
      } catch (err) {
        console.error("[Login] Password Login Error", err);
        // A rejected sign-in shakes the form. Never a celebration.
        shake(document.querySelector("form"));
        setError(err.response?.data?.message || "Invalid email or password");
      }
    }
  };

  return (
    <AuthLayout>
      <div className="w-full flex flex-col justify-center">
        <h3 className="text-xl font-black text-slate-800 tracking-tight">
          {isOtpMode ? "OTP Passwordless Login" : "Welcome back"}
        </h3>
        <p className="text-xs text-slate-550 mt-1.5 mb-8">
          {isOtpMode
            ? "Enter your official email to receive a secure login verification code"
            : "Please enter your details to login"}
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-4">
            <div className="relative">
              <Inputs
                value={email}
                onChange={({ target }) => setEmail(target.value)}
                label="Email Address"
                placeholder="Enter your Email"
                type="email"
              />
              {isOtpMode && (
                <button
                  type="button"
                  disabled={sendingOtp || countdown > 0}
                  onClick={handleSendOtp}
                  className="absolute right-2 top-8 text-xs font-bold text-indigo-500 hover:text-indigo-650 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  {sendingOtp ? (
                    <span className="flex items-center gap-1">
                      <svg className="animate-spin h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : countdown > 0 ? (
                    `Resend in ${countdown}s`
                  ) : (
                    "Send OTP"
                  )}
                </button>
              )}
            </div>

            {isOtpMode ? (
              <div className="transition-all duration-300 opacity-100 transform translate-y-0">
                <Inputs
                  value={otp}
                  onChange={({ target }) => setOtp(target.value)}
                  label="OTP Code"
                  placeholder="Enter 6-digit OTP code"
                  type="text"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Inputs
                  value={password}
                  onChange={({ target }) => setPassword(target.value)}
                  label="Password"
                  placeholder="Enter your Password"
                  type="password"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotError("");
                      setForgotEmail(email);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] font-bold text-indigo-500 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-rose-500 text-xs font-semibold mt-1">{error}</p>}

          <button type="submit" className="btn-primary mt-2">
            {isOtpMode ? "Verify & Login" : "Login"}
          </button>

          {/* Toggle Login Mode */}
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={() => {
                setIsOtpMode(!isOtpMode);
                setError("");
                setOtp("");
                setOtpSent(false);
              }}
              className="text-xs font-bold text-indigo-500 hover:text-indigo-650 transition-colors"
            >
              {isOtpMode ? "Or Login with Password" : "Or Login with OTP code"}
            </button>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 mt-6">
            <div className="relative flex items-center justify-center w-full my-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <span className="relative px-3 bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-widest transition-colors duration-300">
                Or Continue With
              </span>
            </div>

            <div className="w-full flex justify-center">
              {isDummyClientId ? (
                <button
                  type="button"
                  onClick={() => {
                    toast.error(
                      "Google OAuth Configuration Required: Please create a valid Client ID in Google Cloud Console and set VITE_GOOGLE_CLIENT_ID inside your frontend .env file.",
                      { duration: 7500 }
                    );
                  }}
                  className="w-full max-w-[340px] flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-full cursor-pointer text-xs font-bold transition-all active:scale-[0.98] shadow-sm"
                >
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.68 14.93 1 12 1 7.37 1 3.4 3.66 1.45 7.54l3.85 3C6.22 7.55 8.92 5.04 12 5.04z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.99 3.7-8.62z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.3 14.54c-.24-.72-.38-1.5-.38-2.3 0-.8.14-1.58.38-2.3L1.45 6.94C.52 8.88 0 11.08 0 13.4s.52 4.52 1.45 6.46l3.85-3.32z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.73-2.89c-1.03.69-2.35 1.1-4.23 1.1-3.08 0-5.78-2.51-6.7-5.5l-3.85 3C3.4 19.34 7.37 23 12 23z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              ) : (
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    try {
                      const response = await axiosInstance.post(API_PATHS.AUTH.GOOGLE, {
                        token: credentialResponse.credential,
                      });
                      const { token, role } = response.data;
                      if (token) {
                        localStorage.setItem("token", token);
                        updateUser(response.data);
                        sparkle(null, "#6366f1", { count: 16 });
          toast.success("Welcome back!");
                        if (role === "admin") {
                          navigate("/admin/dashboard");
                        } else if (role === "manager") {
                          navigate("/manager/dashboard");
                        } else {
                          navigate("/user/dashboard");
                        }
                      }
                    } catch (err) {
                      console.error("Google Auth failed", err);
                      setError("Google Login failed. Please try again.");
                    }
                  }}
                  onError={() => {
                    setError("Google authentication encountered an error.");
                  }}
                  theme="filled_dark"
                  shape="circle"
                  width="340"
                />
              )}
            </div>
          </div>

          <p className="text-xs text-slate-550 mt-4 text-center">
            Don't have an account?{" "}
            <Link
              className="font-bold text-indigo-500 hover:text-indigo-650 transition-colors"
              to="/signup"
            >
              Sign Up
            </Link>
          </p>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-all duration-300 animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-2xl transition-all scale-100">
            {/* Close Button */}
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              &times;
            </button>

            <h3 className="text-lg font-black text-slate-800 tracking-tight">
              Reset Password
            </h3>
            <p className="text-xs text-slate-550 mt-1 mb-6">
              Verify your official email address and request an OTP to create a new password.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="relative">
                <Inputs
                  value={forgotEmail}
                  onChange={({ target }) => setForgotEmail(target.value)}
                  label="Email Address"
                  placeholder="Enter your Email"
                  type="email"
                />
                <button
                  type="button"
                  disabled={forgotSendingOtp || forgotCountdown > 0}
                  onClick={handleSendResetOtp}
                  className="absolute right-2 top-8 text-xs font-bold text-indigo-500 hover:text-indigo-650 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  {forgotSendingOtp ? (
                    <span className="flex items-center gap-1">
                      <svg className="animate-spin h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : forgotCountdown > 0 ? (
                    `Resend in ${forgotCountdown}s`
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </div>

              {forgotOtpSent && (
                <div className="space-y-4 transition-all duration-300 animate-slideDown">
                  <Inputs
                    value={forgotOtp}
                    onChange={({ target }) => setForgotOtp(target.value)}
                    label="OTP Code"
                    placeholder="Enter 6-digit OTP code"
                    type="text"
                  />
                  <Inputs
                    value={newPassword}
                    onChange={({ target }) => setNewPassword(target.value)}
                    label="New Password"
                    placeholder="Create new password"
                    type="password"
                  />
                  <Inputs
                    value={confirmNewPassword}
                    onChange={({ target }) => setConfirmNewPassword(target.value)}
                    label="Confirm New Password"
                    placeholder="Verify new password"
                    type="password"
                  />
                </div>
              )}

              {forgotError && <p className="text-rose-500 text-xs font-semibold mt-1">{forgotError}</p>}

              <button
                type="submit"
                disabled={resettingPassword || !forgotOtpSent}
                className="btn-primary mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resettingPassword ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Resetting...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};

export default Login;
