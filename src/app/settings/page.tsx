"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Lock,
  Bell,
  Eye,
  EyeOff,
  Shield,
  HelpCircle,
  Globe,
  Moon,
  Smartphone,
  Download,
  Trash2,
  ChevronRight,
  Check,
  LogOut,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { Session } from "next-auth";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("account");

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "privacy", label: "Privacy", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "preferences", label: "Preferences", icon: Globe },
    { id: "help", label: "Help & Support", icon: HelpCircle },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
    toast.success("Logged out successfully");
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-20 text-white md:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Settings</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-pink-500 to-cyan-400 text-white"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="mt-4 flex w-full items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-400 transition-all hover:bg-red-500/20"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Log Out</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              {activeTab === "account" && <AccountSettings session={session} />}
              {activeTab === "privacy" && <PrivacySettings />}
              {activeTab === "notifications" && <NotificationSettings />}
              {activeTab === "security" && <SecuritySettings />}
              {activeTab === "preferences" && <PreferenceSettings />}
              {activeTab === "help" && <HelpSettings />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function AccountSettings({ session }: { session: Session | null }) {
  const utils = api.useUtils();
  const { update } = useSession();
  
  const [username, setUsername] = useState(session?.user?.username ?? "");
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [displayName, setDisplayName] = useState(session?.user?.name ?? "");
  const [bio, setBio] = useState(session?.user?.bio ?? "");

  const updateProfileMutation = api.user.updateProfile.useMutation({
    onSuccess: async (data) => {
      toast.success("Account information updated successfully!");
      // Update the session with new data
      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
          username: data.username,
          email: data.email,
        },
      });
      // Invalidate queries to refresh data
      await utils.user.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSaveChanges = () => {
    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }
    if (username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Email is invalid");
      return;
    }

    updateProfileMutation.mutate({
      name: displayName.trim() || undefined,
      username: username.trim(),
      email: email.trim(),
      bio: bio.trim() || undefined,
    });
  };

  const handleDeleteAccount = () => {
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      toast.error(
        "Account deletion initiated. You will receive a confirmation email.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Account Information</h2>
        <p className="mb-6 text-gray-400">Update your account details</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Username</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Display Name</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter display name"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            maxLength={150}
            className="h-24 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 focus:ring-2 focus:ring-pink-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-400">
            {bio.length}/150 characters
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button 
          variant="primary" 
          onClick={handleSaveChanges}
          isLoading={updateProfileMutation.isPending}
          disabled={updateProfileMutation.isPending}
        >
          Save Changes
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setUsername(session?.user?.username ?? "");
            setEmail(session?.user?.email ?? "");
            setDisplayName(session?.user?.name ?? "");
            setBio("");
            toast("Changes discarded");
          }}
        >
          Cancel
        </Button>
      </div>

      <div className="border-t border-white/10 pt-6">
        <h3 className="mb-4 text-lg font-semibold text-red-400">Danger Zone</h3>
        <div className="space-y-3">
          <button
            onClick={handleDeleteAccount}
            className="flex w-full items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 p-4 transition-colors hover:bg-red-500/20"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-red-400" />
              <div className="text-left">
                <p className="font-medium text-red-400">Delete Account</p>
                <p className="text-sm text-gray-400">
                  Permanently delete your account and all data
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PrivacySettings() {
  const [privateAccount, setPrivateAccount] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [allowDuets, setAllowDuets] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Privacy Settings</h2>
        <p className="mb-6 text-gray-400">Control who can see your content</p>
      </div>

      <div className="space-y-4">
        <SettingToggle
          icon={Lock}
          title="Private Account"
          description="Only approved followers can see your videos"
          checked={privateAccount}
          onChange={setPrivateAccount}
        />
        <SettingToggle
          icon={Eye}
          title="Show Activity Status"
          description="Let others see when you're online"
          checked={showActivity}
          onChange={setShowActivity}
        />
        <SettingToggle
          icon={Bell}
          title="Allow Comments"
          description="Let others comment on your videos"
          checked={allowComments}
          onChange={setAllowComments}
        />
        <SettingToggle
          icon={User}
          title="Allow Duets"
          description="Let others create duets with your videos"
          checked={allowDuets}
          onChange={setAllowDuets}
        />
      </div>

      <div className="pt-4">
        <Button variant="primary">Save Privacy Settings</Button>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [likeNotifications, setLikeNotifications] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Notifications</h2>
        <p className="mb-6 text-gray-400">
          Manage how you receive notifications
        </p>
      </div>

      <div className="space-y-4">
        <SettingToggle
          icon={Smartphone}
          title="Push Notifications"
          description="Receive notifications on your device"
          checked={pushNotifications}
          onChange={setPushNotifications}
        />
        <SettingToggle
          icon={Bell}
          title="Email Notifications"
          description="Receive notifications via email"
          checked={emailNotifications}
          onChange={setEmailNotifications}
        />
        <SettingToggle
          icon={User}
          title="Likes"
          description="Get notified when someone likes your video"
          checked={likeNotifications}
          onChange={setLikeNotifications}
        />
        <SettingToggle
          icon={Bell}
          title="Comments"
          description="Get notified when someone comments"
          checked={commentNotifications}
          onChange={setCommentNotifications}
        />
      </div>

      <div className="pt-4">
        <Button variant="primary">Save Notification Settings</Button>
      </div>
    </div>
  );
}

function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2)
      return { strength, label: "Weak", color: "text-red-500" };
    if (strength <= 3)
      return { strength, label: "Fair", color: "text-yellow-500" };
    if (strength <= 4)
      return { strength, label: "Good", color: "text-blue-500" };
    return { strength, label: "Strong", color: "text-green-500" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleUpdatePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    // API call here
    toast.success("Password updated successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleToggle2FA = () => {
    if (twoFactorEnabled) {
      if (
        confirm("Are you sure you want to disable Two-Factor Authentication?")
      ) {
        setTwoFactorEnabled(false);
        toast.success("Two-Factor Authentication disabled");
      }
    } else {
      toast.success("Two-Factor Authentication setup initiated");
      setTwoFactorEnabled(true);
    }
  };

  const handleEndAllSessions = () => {
    if (confirm("This will log you out from all devices. Continue?")) {
      toast.success("All sessions ended. Please sign in again.");
    }
  };

  // Mock login activity data
  const loginActivity = [
    {
      device: "Windows PC",
      location: "New York, USA",
      time: "2 hours ago",
      current: true,
    },
    {
      device: "iPhone 14",
      location: "New York, USA",
      time: "1 day ago",
      current: false,
    },
    {
      device: "Chrome Browser",
      location: "Los Angeles, USA",
      time: "3 days ago",
      current: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Security</h2>
        <p className="mb-6 text-gray-400">Keep your account secure</p>
      </div>

      {/* Change Password */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Change Password</h3>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Current Password
          </label>
          <div className="relative">
            <Input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-white"
              aria-label={
                showCurrentPassword ? "Hide password" : "Show password"
              }
            >
              {showCurrentPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">New Password</label>
          <div className="relative">
            <Input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-white"
              aria-label={showNewPassword ? "Hide password" : "Show password"}
            >
              {showNewPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {newPassword && (
            <div className="mt-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-gray-400">Password Strength</span>
                <span
                  className={`text-xs font-semibold ${passwordStrength.color}`}
                >
                  {passwordStrength.label}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordStrength.strength <= 2
                      ? "bg-red-500"
                      : passwordStrength.strength <= 3
                        ? "bg-yellow-500"
                        : passwordStrength.strength <= 4
                          ? "bg-blue-500"
                          : "bg-green-500"
                  }`}
                  style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                />
              </div>
              <div className="mt-2 space-y-1">
                <p
                  className={`text-xs ${newPassword.length >= 8 ? "text-green-500" : "text-gray-400"}`}
                >
                  ✓ At least 8 characters
                </p>
                <p
                  className={`text-xs ${/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? "text-green-500" : "text-gray-400"}`}
                >
                  ✓ Upper and lowercase letters
                </p>
                <p
                  className={`text-xs ${/\d/.test(newPassword) ? "text-green-500" : "text-gray-400"}`}
                >
                  ✓ At least one number
                </p>
                <p
                  className={`text-xs ${/[^a-zA-Z0-9]/.test(newPassword) ? "text-green-500" : "text-gray-400"}`}
                >
                  ✓ At least one special character
                </p>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Confirm New Password
          </label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-white"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="mt-1 text-xs text-red-500">Passwords don't match</p>
          )}
        </div>
      </div>

      <div className="pt-4">
        <Button variant="primary" onClick={handleUpdatePassword}>
          Update Password
        </Button>
      </div>

      {/* Two-Factor Authentication */}
      <div className="border-t border-white/10 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
            <p className="mt-1 text-sm text-gray-400">
              Add an extra layer of security to your account
            </p>
          </div>
          <button
            onClick={handleToggle2FA}
            className={`relative h-6 w-12 rounded-full transition-colors ${
              twoFactorEnabled
                ? "bg-gradient-to-r from-pink-500 to-cyan-400"
                : "bg-white/20"
            }`}
          >
            <motion.div
              animate={{ x: twoFactorEnabled ? 24 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 h-4 w-4 rounded-full bg-white"
            />
          </button>
        </div>

        {twoFactorEnabled && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
              <div>
                <p className="font-medium text-green-500">2FA is enabled</p>
                <p className="mt-1 text-sm text-gray-400">
                  Your account is protected with two-factor authentication
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="border-t border-white/10 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Active Sessions</h3>
            <p className="mt-1 text-sm text-gray-400">
              Manage devices where you're currently logged in
            </p>
          </div>
          <Button variant="secondary" onClick={handleEndAllSessions}>
            End All Sessions
          </Button>
        </div>

        <div className="space-y-3">
          {loginActivity.map((session, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                  <Smartphone className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{session.device}</p>
                    {session.current && (
                      <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-500">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {session.location} • {session.time}
                  </p>
                </div>
              </div>
              {!session.current && (
                <button
                  onClick={() => toast.success("Session ended")}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  End Session
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Login Alerts */}
      <div className="border-t border-white/10 pt-6">
        <h3 className="mb-4 text-lg font-semibold">Login Alerts</h3>
        <SettingToggle
          icon={Bell}
          title="Email Login Alerts"
          description="Get notified when someone logs into your account"
          checked={true}
          onChange={() => toast.success("Login alerts updated")}
        />
      </div>

      {/* Security Recommendations */}
      <div className="border-t border-white/10 pt-6">
        <h3 className="mb-4 text-lg font-semibold">Security Recommendations</h3>
        <div className="space-y-3">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
              <div>
                <p className="font-medium text-blue-500">
                  Enable Two-Factor Authentication
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Protect your account with an extra layer of security
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-500" />
              <div>
                <p className="font-medium text-yellow-500">
                  Use a Strong Password
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  Your password should be at least 12 characters with mixed
                  case, numbers, and symbols
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreferenceSettings() {
  const { theme, setTheme } = useTheme();
  const [autoplay, setAutoplay] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [language, setLanguage] = useState("en");
  const [videoQuality, setVideoQuality] = useState("auto");

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast.success(
      `Theme changed to ${newTheme === "dark" ? "Dark" : "Light"} mode`,
    );
  };

  const handleSavePreferences = () => {
    // Save preferences to localStorage or API
    localStorage.setItem("autoplay", autoplay.toString());
    localStorage.setItem("dataSaver", dataSaver.toString());
    localStorage.setItem("language", language);
    localStorage.setItem("videoQuality", videoQuality);
    toast.success("Preferences saved successfully!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Preferences</h2>
        <p className="mb-6 text-gray-400">Customize your experience</p>
      </div>

      {/* Theme Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Appearance</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleThemeChange("dark")}
            className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all ${
              theme === "dark"
                ? "border-pink-500 bg-pink-500/10"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
            aria-label="Select dark theme"
          >
            <div className="flex h-16 w-full items-center justify-center rounded-lg bg-[#0a0a0a]">
              <Moon className="h-8 w-8 text-white" />
            </div>
            <span className="font-medium">Dark</span>
            {theme === "dark" && (
              <div className="absolute top-2 right-2">
                <Check className="h-5 w-5 text-pink-500" />
              </div>
            )}
          </button>

          <button
            onClick={() => handleThemeChange("light")}
            className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all ${
              theme === "light"
                ? "border-pink-500 bg-pink-500/10"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            <div className="flex h-16 w-full items-center justify-center rounded-lg bg-white">
              <Moon className="h-8 w-8 text-gray-800" />
            </div>
            <span className="font-medium">Light</span>
            {theme === "light" && (
              <div className="absolute top-2 right-2">
                <Check className="h-5 w-5 text-pink-500" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Video Settings */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Video</h3>
        <SettingToggle
          icon={User}
          title="Autoplay Videos"
          description="Automatically play videos in feed"
          checked={autoplay}
          onChange={setAutoplay}
        />
        <SettingToggle
          icon={Download}
          title="Data Saver"
          description="Reduce data usage by lowering video quality"
          checked={dataSaver}
          onChange={setDataSaver}
        />

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
              <Eye className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="font-medium">Video Quality</p>
              <p className="text-sm text-gray-400">
                Choose default video quality
              </p>
            </div>
          </div>
          <select
            value={videoQuality}
            onChange={(e) => setVideoQuality(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
            aria-label="Video quality"
          >
            <option value="auto">Auto (Recommended)</option>
            <option value="1080p">1080p (High)</option>
            <option value="720p">720p (Medium)</option>
            <option value="480p">480p (Low)</option>
          </select>
        </div>
      </div>

      {/* Language */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Language & Region</h3>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
              <Globe className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="font-medium">App Language</p>
              <p className="text-sm text-gray-400">
                Choose your preferred language
              </p>
            </div>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
            aria-label="App language"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="pt">Português</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
            <option value="zh">中文</option>
          </select>
        </div>
      </div>

      <div className="pt-4">
        <Button variant="primary" onClick={handleSavePreferences}>
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

function HelpSettings() {
  const helpItems = [
    {
      icon: HelpCircle,
      title: "Help Center",
      description: "Find answers to common questions",
      action: () => toast("Opening Help Center..."),
    },
    {
      icon: Bell,
      title: "Report a Problem",
      description: "Let us know if something isn't working",
      action: () => toast("Opening problem report form..."),
    },
    {
      icon: Shield,
      title: "Community Guidelines",
      description: "Learn about our community standards",
      action: () => toast("Opening Community Guidelines..."),
    },
    {
      icon: Lock,
      title: "Privacy Policy",
      description: "Read our privacy policy",
      action: () => toast("Opening Privacy Policy..."),
    },
    {
      icon: User,
      title: "Terms of Service",
      description: "View our terms and conditions",
      action: () => toast("Opening Terms of Service..."),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Help & Support</h2>
        <p className="mb-6 text-gray-400">
          Get help and learn more about bip bop
        </p>
      </div>

      <div className="space-y-3">
        {helpItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={item.action}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                  <Icon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-2 text-lg font-semibold">App Version</h3>
        <p className="text-sm text-gray-400">bip bop v1.0.0</p>
        <p className="mt-4 text-xs text-gray-500">
          © 2025 bip bop. All rights reserved.
        </p>
      </div>
    </div>
  );
}

function SettingToggle({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-12 rounded-full transition-colors ${
          checked ? "bg-gradient-to-r from-pink-500 to-cyan-400" : "bg-white/20"
        }`}
      >
        <motion.div
          animate={{ x: checked ? 24 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 h-4 w-4 rounded-full bg-white"
        />
      </button>
    </div>
  );
}
