import React from 'react'
import AuthLayout from '../../components/layouts/AuthLayout'
import { useState, useContext } from 'react'
import { validateEmail } from '../../utils/helper';
import ProfilePhotoSelector from '../../components/Inputs/ProfilePhotoSelector';
import Inputs from '../../components/Inputs/Inputs';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import API_PATHS from '../../utils/apiPaths';
import { UserContext } from '../../context/userContext';
import uploadImage from '../../utils/uploadImage';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-hot-toast';

const Signup = () => {
  const [profilePic,setProfilePic]=useState(null);
  const[fullName, setFullName]=useState("");
  const[email, setEmail]=useState("");
  const[password, setPassword]=useState("");
  const [error,setError]=useState(null);

  const {updateUser}=useContext(UserContext);
  const navigate = useNavigate();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isDummyClientId = !googleClientId || googleClientId.includes("dummyid") || googleClientId.includes("1055743493407");

  const handleSignUp = async (e) => {
      e.preventDefault();
      
      let profileImageUrl="";
      
  
      if(!fullName){
        setError("Please enter Full Name");
        return;
      }
      if(!validateEmail(email)){
        setError("Please enter valid Email address");
        return;
      }

      const isOrgEmail = email.toLowerCase().endsWith("@thinklabdigitalsolutions.com") || email.toLowerCase() === "karanam.nagapranav@gmail.com";
      if(!isOrgEmail){
        setError("Only official organization emails (@thinklabdigitalsolutions.com) are allowed to sign up.");
        return;
      }

      if(!password)
      {
        setError("Please enter valid Password");
        return;
      }
      setError("");

      try {
        console.log('[Signup] Submitting signup request', { email });

        if(profilePic)
        {
          const imgUploadRes = await uploadImage(profilePic);
          profileImageUrl = imgUploadRes?.imageUrl || "";
          console.log('[Signup] Image uploaded', { profileImageUrl });
        }



        const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER,{
          name:fullName,
          email,
          password,
          profileImageUrl
        });
        console.log('[Signup] Response', { status: response.status, data: response.data });
        
        const {token,role}=response.data;

        if(token)
        {
          localStorage.setItem("token",token);
          updateUser(response.data);
          if(role==="admin")
          {
            navigate("/admin/dashboard");
          }
          else
          {
            navigate("/user/dashboard");
          }
        } else {
          console.error('[Signup] Missing token in response');
          setError('Invalid response from server. Please try again.');
        }


      } catch (error) {
        console.error('[Signup] Error', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          data: error.response?.data,
        });
        if(error.response && error.response.data?.message){
          setError(error.response.data.message);
        } else if (error.code === 'ECONNABORTED') {
          setError('Request timed out. Please try again.');
        } else {
          setError("Something went wrong. Please try again later");
        }  
      }
    };

  return (
    <AuthLayout>
      <div className="w-full flex flex-col justify-center">
        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Create an account</h3>
        <p className="text-xs text-slate-550 dark:text-slate-400 mt-1.5 mb-6">
          Please enter your details below
        </p>

        <form onSubmit={handleSignUp} className="space-y-5">
          <div className="flex justify-center mb-2">
            <ProfilePhotoSelector image={profilePic} setImage={setProfilePic}/>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Inputs
              value={fullName}
              onChange={({ target }) => setFullName(target.value)}
              label="Full Name"
              placeholder="Enter your Full Name"
              type="text"
            />
            <Inputs
              value={email}
              onChange={({target}) => setEmail(target.value)}
              label="Email Address"
              placeholder="Enter your Email"
              type="email"
            />
            <Inputs
              value={password}
              onChange={({target}) => setPassword(target.value)}
              label="Password"
              placeholder="Enter your Password"
              type="password"
            />
          </div>

          {error && <p className="text-rose-500 text-xs font-semibold mt-1">{error}</p>}

          <button
            type="submit"
            className="btn-primary mt-2"
          >
            Create Account
          </button>

          <div className="flex flex-col items-center justify-center gap-4 mt-6">
            <div className="relative flex items-center justify-center w-full my-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <span className="relative px-3 bg-slate-50 dark:bg-[#070a13] text-[9px] font-bold text-slate-500 uppercase tracking-widest transition-colors duration-300">
                Or Continue With
              </span>
            </div>

            <div className="w-full flex justify-center">
              {isDummyClientId ? (
                <button
                  type="button"
                  onClick={() => {
                    toast.error("Google OAuth Configuration Required: Please create a valid Client ID in Google Cloud Console and set VITE_GOOGLE_CLIENT_ID inside your frontend .env file.", { duration: 7500 });
                  }}
                  className="w-full max-w-[340px] flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/80 px-4 py-2.5 rounded-full cursor-pointer text-xs font-bold transition-all active:scale-[0.98] shadow-sm"
                >
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.68 14.93 1 12 1 7.37 1 3.4 3.66 1.45 7.54l3.85 3C6.22 7.55 8.92 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.99 3.7-8.62z" />
                    <path fill="#FBBC05" d="M5.3 14.54c-.24-.72-.38-1.5-.38-2.3 0-.8.14-1.58.38-2.3L1.45 6.94C.52 8.88 0 11.08 0 13.4s.52 4.52 1.45 6.46l3.85-3.32z" />
                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.73-2.89c-1.03.69-2.35 1.1-4.23 1.1-3.08 0-5.78-2.51-6.7-5.5l-3.85 3C3.4 19.34 7.37 23 12 23z" />
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
                        if (role === "admin") {
                          navigate("/admin/dashboard");
                        } else {
                          navigate("/user/dashboard");
                        }
                      }
                    } catch (err) {
                      console.error("Google Auth failed", err);
                      setError("Google Signup failed. Please try again.");
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
          
          <p className="text-xs text-slate-550 dark:text-slate-400 mt-4 text-center">
            Already have an account?{" "}
            <Link className="font-bold text-indigo-500 dark:text-indigo-400 hover:text-indigo-650 dark:hover:text-indigo-300 transition-colors" to="/login">
              Login
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  )
}

export default Signup;


