import React, { useState, useContext } from "react";
import { Link,useNavigate } from "react-router-dom"; // needed import
import AuthLayout from "../../components/layouts/AuthLayout";
import Inputs from "../../components/Inputs/Inputs";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/userContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const {updateUser}=useContext(UserContext);

  const navigate = useNavigate(); // now defined

  const handleLogin = async (e) => {
    e.preventDefault();
    

    if(!validateEmail(email)){
      setError("Please enter valid Email address");
      return;
    }
    if(!password)
    {
      setError("Please enter valid Password");
      return;
    }
    setError("");

    try{
      console.log("[Login] Submitting login request", { email });
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN,{email,password});
      console.log("[Login] Response", { status: response.status, data: response.data });
      const { token, role } = response.data || {};
      if (token) {
        localStorage.setItem("token", token);
        updateUser(response.data);
        if (role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/user/dashboard");
        }
      } else {
        console.error("[Login] Missing token in response");
        setError("Invalid response from server. Please try again.");
      }
    }
    catch(error){
      console.error("[Login] Error", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
      });
      if(error.response && error.response.data?.message){
        setError(error.response.data.message);
      } else if (error.code === "ECONNABORTED") {
        setError("Request timed out. Please try again.");
      } else {
        setError("Something went wrong. Please try again later");
      }
    }
    
  };

  return (
    <AuthLayout>
      <div className="lg:w-[70%] h-3/4 md:w-full flex flex-col justify-center">
        <h3 className="text-xl font-semibold text-white">Welcome back</h3>
        <p className="text-xs text-slate-700 mt-[5px] mb-6">
          Please enter your details to login
        </p>


        <form onSubmit={handleLogin} >
          <Inputs
           value={email}
          onChange={({ target }) => setEmail(target.value)}
          label="Email Address"
          placeholder="Enter your Email"
          type="email"
          />
          <Inputs
              value={password}
              onChange={({ target }) => setPassword(target.value)}
              label="Password"
              placeholder="Enter your Password"
              type="password"
            />
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          <button
            type="submit"
            className="btn-primary"
          >
            Login
          </button>
          

          <p className="text-[13px] text-slate-700 mt-2">
            Don't have an account?{" "}
            <Link className="font-medium text-primary underline" to="/signup">
              Sign Up
              </Link>
          </p>

        </form>





      </div>
    </AuthLayout>
  );
};

export default Login;
