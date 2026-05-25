import { useState } from "react";
import { CheckCircle, Eye, EyeOff, KeyRound, User } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name ?? "",
    username: user?.username ?? "",
  });
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    setProfileError("");
    setProfileSuccess(false);
  };

  const handleProfileSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!profileForm.full_name.trim()) {
      setProfileError("Full name is required");
      return;
    }
    if (!profileForm.username.trim()) {
      setProfileError("Username is required");
      return;
    }
    setIsSavingProfile(true);
    setProfileError("");
    try {
      await updateProfile(profileForm.full_name.trim(), profileForm.username.trim().toLowerCase());
      setProfileSuccess(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setProfileError(err.response?.data?.detail ?? "Failed to update profile");
      } else {
        setProfileError("Failed to update profile");
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordError("");
    setPasswordSuccess(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!passwordForm.current_password) {
      setPasswordError("Current password is required");
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("Passwords do not match");
      return;
    }
    setIsSavingPassword(true);
    setPasswordError("");
    try {
      await changePassword(passwordForm.current_password, passwordForm.new_password);
      setPasswordSuccess(true);
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPasswordError(err.response?.data?.detail ?? "Failed to change password");
      } else {
        setPasswordError("Failed to change password");
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Profile Settings</h2>

      {/* Profile info card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-emerald-100 rounded-full p-2">
            <User className="h-5 w-5 text-emerald-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-800">Account Info</h3>
        </div>

        {/* Email (read-only) */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
          <p className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm">
            {user?.email}
          </p>
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {profileError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Profile updated successfully
            </div>
          )}

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={profileForm.full_name}
              onChange={handleProfileChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={profileForm.username}
              onChange={handleProfileChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-2.5 px-6 rounded-xl transition-colors flex items-center gap-2"
            >
              {isSavingProfile && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isSavingProfile ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Change password card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-100 rounded-full p-2">
            <KeyRound className="h-5 w-5 text-amber-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-800">Change Password</h3>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {passwordError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Password changed successfully
            </div>
          )}

          {(
            [
              { id: "current_password", label: "Current Password", show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
              { id: "new_password", label: "New Password", show: showNew, toggle: () => setShowNew(!showNew) },
              { id: "confirm_password", label: "Confirm New Password", show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
            ] as const
          ).map(({ id, label, show, toggle }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <div className="relative">
                <input
                  id={id}
                  name={id}
                  type={show ? "text" : "password"}
                  value={passwordForm[id]}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={toggle}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingPassword}
              className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium py-2.5 px-6 rounded-xl transition-colors flex items-center gap-2"
            >
              {isSavingPassword && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isSavingPassword ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
