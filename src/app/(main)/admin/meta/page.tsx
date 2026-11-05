"use client";

import { useCallback, useEffect, useState } from "react";

interface SyncResult {
  total?: number;
  created?: number;
  updated?: number;
  skipped?: number;
  errors?: string[];
}

interface SyncLog {
  id: string;
  status: string;
  trigger: string;
  format: string;
  last: number;
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  durationMs: number;
  createdAt: string;
}

export default function AdminMetaSyncPage() {
  const [last, setLast] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<SyncLog[]>([]);

  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/meta/sync/logs");
      if (res.ok) setLogs(await res.json());
    } catch {
      // ignore: the log list is informational
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const runSync = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/meta/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ last }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sync failed");
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      loadLogs();
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Meta Sync (TopDeck.gg)</h1>
      <p className="text-sm text-gray-400 mb-6">
        ดึงผลทัวร์นาเมนต์ Riftbound ที่จบแล้วจาก TopDeck.gg เข้าสู่ระบบเพื่อใช้ในหน้า Meta Report
        ต้องตั้งค่า <code className="text-amber-400">TOPDECK_API_KEY</code> ใน .env.local ก่อน (ขอ key ฟรีที่ topdeck.gg)
      </p>

      <div className="bg-[#111] border border-[var(--border)] rounded-lg p-6 mb-6">
        <label className="block text-xs text-gray-400 mb-2">ดึงย้อนหลัง</label>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={last}
            onChange={(e) => setLast(parseInt(e.target.value))}
            className="bg-[#1a1a1a] border border-[#333] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          >
            <option value={7}>7 วัน</option>
            <option value={30}>30 วัน</option>
            <option value={90}>90 วัน</option>
          </select>
          <button
            onClick={runSync}
            disabled={loading}
            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {loading ? "กำลังซิงก์..." : "เริ่มซิงก์"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-400 rounded-lg p-4 text-sm mb-6">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-[#111] border border-[var(--border)] rounded-lg p-6">
          <h2 className="font-semibold mb-3 text-green-400">ผลลัพธ์</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-xl font-bold">{result.total ?? 0}</div>
              <div className="text-xs text-gray-400">พบทั้งหมด</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-400">{result.created ?? 0}</div>
              <div className="text-xs text-gray-400">เพิ่มใหม่</div>
            </div>
            <div>
              <div className="text-xl font-bold text-blue-400">{result.updated ?? 0}</div>
              <div className="text-xs text-gray-400">อัปเดต</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-400">{result.skipped ?? 0}</div>
              <div className="text-xs text-gray-400">ข้าม</div>
            </div>
          </div>
          {Array.isArray(result.errors) && result.errors.length > 0 && (
            <div className="text-xs text-red-400 border-t border-[#333] pt-3">
              {result.errors.map((e: string, i: number) => (
                <div key={i}>{e}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-[#111] border border-[var(--border)] rounded-lg p-6 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">ประวัติการซิงก์</h2>
          <button onClick={loadLogs} className="text-xs text-gray-400 hover:text-white">
            รีเฟรช
          </button>
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500">ยังไม่มีประวัติการซิงก์</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-gray-400 border-b border-[#333]">
                <tr>
                  <th className="py-2 pr-3">เวลา</th>
                  <th className="py-2 pr-3">สถานะ</th>
                  <th className="py-2 pr-3">ที่มา</th>
                  <th className="py-2 pr-3">ย้อนหลัง</th>
                  <th className="py-2 pr-3">พบ</th>
                  <th className="py-2 pr-3">ใหม่</th>
                  <th className="py-2 pr-3">อัปเดต</th>
                  <th className="py-2 pr-3">ข้าม</th>
                  <th className="py-2 pr-3">ใช้เวลา</th>
                  <th className="py-2">ข้อผิดพลาด</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[#222] align-top">
                    <td className="py-2 pr-3 whitespace-nowrap">{new Date(log.createdAt).toLocaleString("th-TH")}</td>
                    <td className={`py-2 pr-3 ${log.status === "success" ? "text-green-400" : "text-red-400"}`}>
                      {log.status === "success" ? "สำเร็จ" : "ล้มเหลว"}
                    </td>
                    <td className="py-2 pr-3">{log.trigger === "cron" ? "อัตโนมัติ" : "กดเอง"}</td>
                    <td className="py-2 pr-3">{log.last} วัน</td>
                    <td className="py-2 pr-3">{log.total}</td>
                    <td className="py-2 pr-3">{log.created}</td>
                    <td className="py-2 pr-3">{log.updated}</td>
                    <td className="py-2 pr-3">{log.skipped}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{(log.durationMs / 1000).toFixed(1)} วิ</td>
                    <td className="py-2 text-red-400">{log.errors?.length ? log.errors.join(" | ") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
