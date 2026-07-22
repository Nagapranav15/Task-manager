import React, { useState, useContext, useEffect } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { UserContext } from "../../context/userContext";
import Inputs from "../../components/Inputs/Inputs";
import ProfilePhotoSelector from "../../components/Inputs/ProfilePhotoSelector";
import uploadImage from "../../utils/uploadImage";
import axiosInstance from "../../utils/axiosInstance";
import API_PATHS, { getSecureUrl } from "../../utils/apiPaths";
import { toast } from "react-hot-toast";

const ProfileSettings = () => {
  const { user, updateUser } = useContext(UserContext);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setProfilePic(getSecureUrl(user.profileImageUrl) || null);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.error("Name cannot be empty.");
    }
    if (password && password !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    try {
      setLoading(true);
      let profileImageUrl = typeof profilePic === "string" ? profilePic : "";

      // If profilePic is a new File object, upload it
      if (profilePic && typeof profilePic !== "string") {
        const uploadRes = await uploadImage(profilePic);
        profileImageUrl = uploadRes?.imageUrl || "";
      }

      const updatePayload = {
        name,
        profileImageUrl,
      };

      if (password) {
        updatePayload.password = password;
      }

      const response = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, updatePayload);
      
      // Update local context user data
      updateUser(response.data);
      
      // Clear password inputs
      setPassword("");
      setConfirmPassword("");
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile", error);
      toast.error(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout activeMenu="profile">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Account Settings</h2>
          <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
            Update your profile details, avatar image, and security password.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white dark:bg-slate-900/45 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-lg shadow-slate-100/10 dark:shadow-none">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Avatar Selector */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Profile Photo</span>
              <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} />
            </div>

            {/* General Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Inputs
                label="Full Name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
              />
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-slate-100 dark:bg-[#070a13]/70 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl px-4 py-3 text-xs font-semibold outline-none cursor-not-allowed"
                />
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-1.5 ml-1">Email cannot be changed</span>
              </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-800/80 my-4" />

            {/* Security Section */}
            <div>
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-4">Update Password (Optional)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Inputs
                  label="New Password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                />
                <Inputs
                  label="Confirm New Password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/10 active:scale-[0.98]"
              >
                {loading ? "Saving Changes..." : "Save Profile"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfileSettings;
