"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  image: string | null;
  isAdmin: boolean;
  createdAt: string;
}

export default function AdminUserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchUsers();
      } else {
        alert("Failed to delete user");
      }
    } catch (error) {
      console.error("Failed to delete user", error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingUser.name,
          isAdmin: editingUser.isAdmin,
        }),
      });
      
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      } else {
        alert("Failed to update user");
      }
    } catch (error) {
      console.error("Failed to update user", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[var(--primary)]">User Management</h1>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="flex-1 max-w-sm px-4 py-2 bg-[var(--background-lighter)] border border-gray-700 rounded-lg text-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
        />
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Search
        </button>
      </div>

      <div className="bg-[var(--background-lighter)] rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-800/50 text-gray-400 text-sm">
                <tr>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Joined</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">
                              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium">{user.name || "N/A"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-300">{user.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.isAdmin ? "bg-purple-500/20 text-purple-400" : "bg-gray-700 text-gray-300"
                        }`}>
                          {user.isAdmin ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="text-blue-400 hover:text-blue-300 mr-4 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-400 hover:text-red-300 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--background-lighter)] rounded-xl border border-gray-700 w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-white">Edit User</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-[var(--background)] border border-gray-700 rounded-lg text-white"
                  value={editingUser.name || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  disabled
                  className="w-full px-3 py-2 bg-[var(--background)] border border-gray-700 rounded-lg text-gray-500 cursor-not-allowed"
                  value={editingUser.email}
                />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="isAdmin"
                  className="w-4 h-4 rounded border-gray-700 bg-[var(--background)]"
                  checked={editingUser.isAdmin}
                  onChange={(e) => setEditingUser({ ...editingUser, isAdmin: e.target.checked })}
                />
                <label htmlFor="isAdmin" className="text-sm font-medium text-gray-300">
                  Is Admin
                </label>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
