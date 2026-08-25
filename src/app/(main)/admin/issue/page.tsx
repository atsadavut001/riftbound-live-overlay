"use client";

import { useState, useEffect } from "react";

interface Issue {
  id: string;
  email: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function AdminIssuePage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const res = await fetch("/api/issues");
      if (res.ok) {
        const data = await res.json();
        setIssues(data);
      }
    } catch (error) {
      console.error("Failed to fetch issues", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/issues/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchIssues();
      }
    } catch (error) {
      console.error("Failed to update issue", error);
    }
  };

  const deleteIssue = async (id: string) => {
    if (!confirm("Are you sure you want to delete this issue?")) return;
    try {
      const res = await fetch(`/api/issues/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchIssues();
      }
    } catch (error) {
      console.error("Failed to delete issue", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "bg-green-500/20 text-green-400";
      case "in_progress": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-red-500/20 text-red-400";
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-[var(--primary)]">Issue Tracker</h1>
      
      {loading ? (
        <div className="text-gray-400">Loading issues...</div>
      ) : issues.length === 0 ? (
        <div className="text-gray-400 p-8 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-center">
          No issues found.
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map(issue => (
            <div key={issue.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-white">{issue.email}</h3>
                  <span className="text-xs text-gray-500">{new Date(issue.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <select 
                    value={issue.status}
                    onChange={(e) => updateStatus(issue.id, e.target.value)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border border-[var(--border)] outline-none cursor-pointer ${getStatusColor(issue.status)}`}
                  >
                    <option value="pending" className="bg-[#111] text-white">Pending</option>
                    <option value="in_progress" className="bg-[#111] text-white">In Progress</option>
                    <option value="resolved" className="bg-[#111] text-white">Resolved</option>
                  </select>
                  <button 
                    onClick={() => deleteIssue(issue.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="text-gray-300 whitespace-pre-wrap bg-[#111] p-4 rounded-lg border border-[var(--border)]/50">
                {issue.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}