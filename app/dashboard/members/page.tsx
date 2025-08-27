// app/dashboard/members/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FiUsers,
  FiLogOut,
  FiEdit3,
  FiTrash2,
  FiSave,
  FiXCircle,
  FiChevronRight,
  FiCheck,
  FiInfo,
  FiAlertCircle,
  FiBell,
  FiPlusCircle,
  FiSearch,
  FiEye,
  FiEyeOff,
  FiRotateCcw,
  FiLoader, // For loading spinner
  FiClock, // For timestamps
} from "react-icons/fi";
import AuthBg from "@/components/Authbg";
import { isAuthenticated } from "@/lib/auth"; // Import isAuthenticated

interface Member {
  _id: string;
  username: string;
  // In a real application, NEVER store or display raw passwords.
  // This is purely for demonstration of form functionality.
  // Passwords should be hashed on the backend and never sent to the frontend.
  password: string;
  createdAt?: string; // Optional: Added timestamp for creation
  updatedAt?: string; // Optional: Added timestamp for last update
}

type NotificationType = "success" | "info" | "error";

export default function MembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
    active: boolean;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState(true); // Changed to 'true' to show password by default
  const [isApiLoading, setIsApiLoading] = useState(false); // Global loading for API calls
  const [isPageLoading, setIsPageLoading] = useState(true); // New state for initial page load

  const showNotification = useCallback((message: string, type: NotificationType) => {
    setNotification({ message, type, active: true });
    setTimeout(() => {
      setNotification(prev => prev ? { ...prev, active: false } : null);
    }, 3000); // Duration before starting to close
    setTimeout(() => {
      setNotification(null); // Fully remove after animation
    }, 3300); // 3000ms + 300ms (exit animation duration)
  }, []); // Memoize for useCallback dependency

  const fetchMembers = useCallback(async () => {
    setIsApiLoading(true);
    try {
      const res = await fetch("/api/members");
      if (!res.ok) {
        // If unauthorized or forbidden, redirect to login
        if (res.status === 401 || res.status === 403) {
          router.push("/login");
          showNotification("Session expired or unauthorized. Please log in.", "error");
          return; // Stop execution to prevent further rendering/errors
        }
        throw new Error(`HTTP error: ${res.status}`);
      }
      const data: Member[] = await res.json();
      setMembers(data);
    } catch (err) {
      console.error("Fetch members error:", err);
      showNotification("Failed to load members. Please try again.", "error");
    } finally {
      setIsApiLoading(false);
    }
  }, [router, showNotification]); // Dependencies for useCallback

  // Initial authentication check on page load
  useEffect(() => {
    const checkAuthenticationAndLoad = async () => {
      const authed = await isAuthenticated(); // Check if authenticated
      if (!authed) {
        router.push('/login'); // Redirect to login if not authenticated
        showNotification("You need to log in to access this page.", "error");
      } else {
        await fetchMembers(); // Only fetch members if authenticated
      }
      setIsPageLoading(false); // Stop page loading animation
    };

    checkAuthenticationAndLoad();
  }, [router, fetchMembers, showNotification]); // Dependencies for useEffect

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsApiLoading(true);

    if (!username.trim() || !password.trim()) {
      showNotification("Username and password cannot be empty.", "info");
      setIsApiLoading(false);
      return;
    }

    // New: Duplicate username validation (client-side check for immediate feedback)
    const isDuplicate = members.some(m =>
      m.username.toLowerCase() === username.toLowerCase() && m._id !== editingId
    );
    if (isDuplicate) {
      showNotification("Username already exists. Please choose a different one.", "error");
      setIsApiLoading(false);
      return;
    }

    try {
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/members/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) throw new Error("Failed to update");
        showNotification("Member updated successfully!", "success");
      } else {
        res = await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // In a real app, send ONLY the plaintext password for hashing on backend.
          // Or, better, hash on client-side before sending (e.g., with bcrypt.js) then send hash.
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          if (res.status === 409) { // Conflict status code for duplicate
            throw new Error(errorData.error || "Duplicate username.");
          }
          throw new Error("Failed to add member.");
        }
        showNotification("Member added successfully!", "success");
      }
      setUsername("");
      setPassword("");
      setEditingId(null);
      await fetchMembers(); // Refresh list after successful operation
    } catch (err: any) {
      console.error("Save member error:", err);
      showNotification(err.message || "Failed to save member. Please try again.", "error");
    } finally {
      setIsApiLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this member? This action cannot be undone.")) return;
    setIsApiLoading(true);
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchMembers();
      showNotification("Member deleted successfully!", "success");
    } catch (err: any) {
      console.error("Delete member error:", err);
      showNotification(err.message || "Failed to delete member. Please try again.", "error");
    } finally {
      setIsApiLoading(false);
    }
  };

  const handleEdit = (member: Member) => {
    setEditingId(member._id);
    setUsername(member.username);
    setPassword(member.password); // Again, in a real app, avoid pre-filling passwords.
    showNotification(`Editing "${member.username}"...`, "info");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setUsername("");
    setPassword("");
    showNotification("Edit cancelled.", "info");
  };

  const handleClearForm = () => {
    setUsername("");
    setPassword("");
    setEditingId(null);
    showNotification("Form cleared.", "info");
  };

  const handleLogout = async () => {
    setIsApiLoading(true);
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
        showNotification("Logged out successfully.", "info");
      } else {
        throw new Error("Logout failed.");
      }
    } catch (err: any) {
      console.error("Logout error:", err);
      showNotification(err.message || "Logout failed. Please try again.", "error");
    } finally {
      setIsApiLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter((member) =>
      member.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [members, searchTerm]);

  // Helper to format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    // Use toLocaleString with specific options for consistent date and time display
    return date.toLocaleString('en-IN', { // 'en-IN' for Indian English locale (date/time format)
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true, // Use 12-hour format with AM/PM
    });
  };

  // Helper to mask password with asterisks
  const maskPassword = (password: string) => '*'.repeat(password.length);

  // Display a loading spinner until authentication check is complete
  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen font-sans antialiased p-4 sm:p-6 lg:p-8 overflow-hidden bg-black md:bg-transparent">
      {/* AuthBackground for desktop and tablet views */}
      <div className="hidden md:block absolute inset-0 z-0">
        <AuthBg />
      </div>

      {/* Global Loading Overlay */}
      {isApiLoading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center animate-fade-in">
          <div className="text-center text-white">
            <FiLoader className="w-16 h-16 animate-spin-slow mx-auto text-blue-400 mb-4" />
            <p className="text-lg font-semibold tracking-wide">Processing...</p>
          </div>
        </div>
      )}

      {/* Main wrapper for content */}
      <div className="relative z-10 min-h-screen text-light-text mx-auto max-w-7xl">
        {/* Dynamic Island style Notification */}
        {notification && (
          <div
            className={`
              fixed top-4 left-1/2 -translate-x-1/2 z-50
              w-max min-w-[36px] max-w-[calc(100vw-32px)] md:max-w-[320px]
              h-10 px-4 py-2
              rounded-full shadow-2xl
              flex items-center gap-2
              backdrop-filter backdrop-blur-lg
              bg-white/10 border border-white/20
              text-sm font-medium whitespace-nowrap overflow-hidden
              ${notification.active ? 'animate-dynamic-island-appear-in' : 'animate-dynamic-island-appear-out'}
            `}
          >
            <div className={`flex-shrink-0 text-xl
              ${notification.type === "success" ? "text-accent-green" : ""}
              ${notification.type === "info" ? "text-accent-blue" : ""}
              ${notification.type === "error" ? "text-accent-red" : ""}
            `}>
              {notification.type === "success" && <FiCheck />}
              {notification.type === "info" && <FiInfo />}
              {notification.type === "error" && <FiAlertCircle />}
            </div>
            <span
              className={`flex-grow text-center truncate
                ${notification.type === "success" ? "text-green-300" : ""}
                ${notification.type === "info" ? "text-blue-300" : ""}
                ${notification.type === "error" ? "text-red-300" : ""}
                text-base
              `}
            >
              {notification.message}
            </span>
            <div className="relative flex-shrink-0">
              <FiBell className="text-xl text-subtle-text" />
              {notification.type === "success" && (
                <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-green-500 ring-1 ring-white/50"></span>
              )}
            </div>
          </div>
        )}

        {/* Top bar - Modernized with gradients and subtle effects */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 sm:mb-12 pb-6 border-b border-white/10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex flex-col sm:flex-row items-center gap-2 mb-4 sm:mb-0 text-center sm:text-left text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-purple font-bebas-neue">
            <FiUsers className="text-3xl sm:text-4xl text-accent-blue" /> SSI Studios
            <span className="text-subtle-text text-lg sm:text-xl font-normal flex items-center gap-1 mt-1 sm:mt-0 sm:ml-3">
              <FiChevronRight className="text-xl sm:text-2xl" /> Member Management
            </span>
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gradient-to-br from-red-500 to-red-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-800 transition-all duration-300 ease-in-out text-base font-semibold transform hover:scale-105"
            disabled={isApiLoading} // Disable during API calls
          >
            <FiLogOut className="text-lg" /> Logout
          </button>
        </div>

        {/* Add/Edit form - Frosted glass effect, subtle border, improved spacing */}
        <div className="
          bg-dark-card backdrop-blur-lg border border-dark-border
          rounded-2xl p-6 sm:p-8 lg:p-10 shadow-2xl
          max-w-full lg:max-w-5xl mx-auto mb-10 sm:mb-14
          transform hover:scale-[1.005] transition-transform duration-300 ease-out
        ">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-6 sm:mb-8 flex items-center gap-3 border-b border-white/15 pb-4 text-accent-blue">
            {editingId ? (
              <>
                <FiEdit3 className="text-2xl text-accent-purple" /> Edit Member
              </>
            ) : (
              <>
                <FiPlusCircle className="text-2xl text-accent-green" /> Add New Member
              </>
            )}
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-subtle-text mb-2"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                autoComplete="username"
                placeholder="Enter username"
                className="w-full bg-white/5 border border-white/15 p-3 sm:p-4 rounded-lg text-light-text placeholder-subtle-text focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-300 ease-in-out text-base"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isApiLoading} // Disable during API calls
              />
            </div>
            <div className="relative">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-subtle-text mb-2"
              >
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="new-password"
                placeholder="Enter password"
                className="w-full bg-white/5 border border-white/15 p-3 sm:p-4 rounded-lg text-light-text placeholder-subtle-text focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-300 ease-in-out text-base pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isApiLoading} // Disable during API calls
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-subtle-text hover:text-light-text"
                disabled={isApiLoading} // Disable during API calls
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <div className="flex items-end gap-4 col-span-1 md:col-span-2 lg:col-span-1 mt-2 md:mt-0">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white px-5 py-3 rounded-lg shadow-md hover:shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 ease-in-out text-base font-semibold transform hover:scale-105"
                disabled={isApiLoading} // Disable during API calls
              >
                {editingId ? (
                  <>
                    <FiSave className="text-lg" /> Update
                  </>
                ) : (
                  <>
                    <FiPlusCircle className="text-lg" /> Add Member
                  </>
                )}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-600/40 border border-gray-500/50 text-gray-200 px-5 py-3 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-700/50 transition-all duration-300 ease-in-out text-base font-semibold transform hover:scale-105"
                  disabled={isApiLoading} // Disable during API calls
                >
                  <FiXCircle className="text-lg" /> Cancel
                </button>
              )}
                <button
                type="button"
                onClick={handleClearForm}
                className="flex-shrink-0 flex items-center justify-center gap-2 bg-gray-700/40 border border-gray-600/50 text-gray-300 p-3 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-700/50 transition-all duration-300 ease-in-out transform hover:scale-105"
                disabled={isApiLoading} // Disable during API calls
              >
                <FiRotateCcw className="text-lg" />
              </button>
            </div>
          </form>
        </div>

        {/* Members table - Frosted glass effect, subtle borders, improved hover */}
        <div className="overflow-hidden bg-dark-card backdrop-blur-lg border border-dark-border
          rounded-2xl shadow-2xl
          max-w-full lg:max-w-5xl mx-auto
          transform hover:scale-[1.005] transition-transform duration-300 ease-out
        ">
          <div className="p-6 sm:p-8 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-xl sm:text-2xl font-semibold text-light-text flex items-center gap-2">
              <FiUsers className="text-xl text-accent-blue" /> All Members ({filteredMembers.length})
            </h3>
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/15 rounded-lg text-light-text placeholder-subtle-text focus:ring-2 focus:ring-accent-blue focus:border-transparent text-sm sm:text-base"
                disabled={isApiLoading} // Disable during API calls
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle-text" />
            </div>
          </div>

          <div className="overflow-x-auto"> {/* Added for responsive table scroll */}
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-subtle-text uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-subtle-text uppercase tracking-wider">
                    Password
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-subtle-text uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <FiClock /> Created At
                    </span>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-subtle-text uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <FiClock /> Updated At
                    </span>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-subtle-text uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((m) => (
                    <tr
                      key={m._id}
                      className={`transition-all duration-300 ease-in-out ${
                        editingId === m._id
                          ? "bg-blue-600/20"
                          : "hover:bg-white/10"
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-light-text text-base">
                        {m.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-light-text text-base">
                        {/* The change is here: conditionally display masked or unmasked password */}
                        {showPassword ? m.password : maskPassword(m.password)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-subtle-text text-sm">
                        {formatDate(m.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-subtle-text text-sm">
                        {formatDate(m.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base space-x-3">
                        <button
                          className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-200 px-4 py-2 rounded-lg hover:bg-blue-600/30 hover:text-white shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105"
                          onClick={() => handleEdit(m)}
                          disabled={isApiLoading} // Disable during API calls
                        >
                          <FiEdit3 className="text-base" /> Edit
                        </button>
                        <button
                          className="inline-flex items-center gap-2 bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-2 rounded-lg hover:bg-red-600/30 hover:text-white shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105"
                          onClick={() => handleDelete(m._id)}
                          disabled={isApiLoading} // Disable during API calls
                        >
                          <FiTrash2 className="text-base" /> Delete
                        </button>
                      </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5} // Adjusted colspan to match new columns
                      className="text-center py-8 text-subtle-text text-base italic"
                    >
                      {members.length > 0 && searchTerm ? (
                        "No matching members found."
                      ) : (
                        "No members registered yet."
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div> {/* End of overflow-x-auto */}
        </div>
      </div>
    </div>
  );
}
