import React, { useState, useEffect } from "react";
import { User, Mail, Lock, Phone, LogOut, TriangleAlert } from 'lucide-react';
import authService from '../../services/AuthService';
import { useAuth } from "../../context/AuthContext";
import toast from 'react-hot-toast';
import Spinner from "../../components/common/Spinner";
import Modal from "../../components/common/Modal";

const InputField = ({ label, icon: Icon, type = "text", value, onChange, placeholder, readOnly }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
        <div className="flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-xl bg-white focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
            <Icon className="w-4 h-4 text-slate-400 shrink-0" />
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                readOnly={readOnly}
                className={`flex-1 text-sm text-slate-800 outline-none bg-transparent ${readOnly ? 'text-slate-500' : ''}`}
            />
        </div>
    </div>
);

const ProfilePage = () => {
    const { user, logout, updateUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await authService.getProfile();
                const profile = data?.data || data;
                setUsername(profile.username || user?.username || "");
                setEmail(profile.email || user?.email || "");
                setPhone(profile.phoneNumber || user?.phoneNumber || "");
            } catch {
                setUsername(user?.username || "");
                setEmail(user?.email || "");
                setPhone(user?.phoneNumber || "");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSaveChanges = async () => {
        if (!username.trim()) {
            toast.error("Username cannot be empty.");
            return;
        }
        setSaving(true);
        try {
            await authService.updateProfile({ username, phoneNumber: phone });
            updateUser({ username, phoneNumber: phone });
            toast.success("Profile updated successfully.");

        } catch {
            toast.error("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            toast.error("Please fill in all password fields.");
            return;
        }
        if (newPassword !== confirmNewPassword) {
            toast.error("New passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("New password must be at least 6 characters.");
            return;
        }
        setChangingPassword(true);
        try {
            await authService.changePassword({ currentPassword, newPassword, confirmPassword: confirmNewPassword });
            toast.success("Password changed successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        } catch {
            toast.error("Failed to change password. Check your current password.");
        } finally {
            setChangingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            await authService.deleteAccount();
            toast.success("Account deleted.");
            logout();
        } catch {
            toast.error("Failed to delete account.");
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
                <button
                    onClick={logout}
                    className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>

            {/* User Information */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-800">User Information</h2>

                <InputField
                    label="Username"
                    icon={User}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="Email Address"
                        icon={Mail}
                        type="email"
                        value={email}
                        readOnly
                        placeholder="Email address"
                    />
                    <InputField
                        label="Phone Number"
                        icon={Phone}
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Phone number"
                    />
                </div>
            </div>

            {/* Change Password */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-800">Change Password</h2>

                <InputField
                    label="Current Password"
                    icon={Lock}
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                />
                <InputField
                    label="New Password"
                    icon={Lock}
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                />
                <InputField
                    label="Confirm New Password"
                    icon={Lock}
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                />

                <div className="flex justify-end pt-2">
                    <button
                        onClick={handleChangePassword}
                        disabled={changingPassword}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"
                    >
                        {changingPassword ? "Updating..." : "Update Password"}
                    </button>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pb-6">
                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-5 py-2.5 border border-red-300 text-red-500 hover:bg-red-50 text-sm font-semibold rounded-xl transition-all"
                >
                    Delete My Account
                </button>
                <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"
                >
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>
            {/* Delete Account Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Account Confirmation"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                        <TriangleAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-red-700">This action cannot be undone</p>
                            <p className="text-sm text-red-600 mt-1">
                                All your documents, quizzes, flashcards, and progress data will be permanently deleted.
                            </p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-600">Are you sure you want to delete your account?</p>
                    <div className="flex justify-end gap-3 pt-1">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteAccount}
                            disabled={deleting}
                            className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 rounded-xl transition-all"
                        >
                            {deleting ? "Deleting..." : "Yes, Delete My Account"}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ProfilePage;
