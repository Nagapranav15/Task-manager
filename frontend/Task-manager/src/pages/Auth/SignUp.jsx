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

const Signup = () => {
  const [profilePic,setProfilePic]=useState(null);
  const[fullName, setFullName]=useState("");
  const[email, setEmail]=useState("");
  const[password, setPassword]=useState("");
  const[adminTokenInvite,setAdminTokenInvite]=useState("");
  const [error,setError]=useState(null);

  const {updateUser}=useContext(UserContext);

  const navigate = useNavigate();


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
          profileImageUrl,
          adminInviteToken: adminTokenInvite
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
      <div className="lg:w-[100%] h-auto mt-10 md:mt-0 flex flex-col justify-center">
        <h3 className="text-xl font-semibold text-white">Create an account</h3>
        <p className="text-xs text-slate-700 mt-[5px] mb-6">
          Please enter your details below
        </p>
        <form onSubmit={handleSignUp}>
        
            <ProfilePhotoSelector image={profilePic} setImage={setProfilePic}/>
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
            <Inputs
              value={adminTokenInvite}
              onChange={({ target }) => setAdminTokenInvite(target.value)}
              label="Admin Invite token"
              placeholder="Provide Admin Invite token"
              type="text"
            />
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </div>
          <button
            type="submit"
            className="btn-primary"
          >
            SIGNUP
          </button>
          

          <p className="text-[13px] text-slate-700 mt-2">
            Already have an account?{" "}
            <Link className="font-medium text-primary underline" to="/login">
              Login
              </Link>
          </p>
            
        </form>



      </div>
    </AuthLayout>
  )
}

export default Signup
