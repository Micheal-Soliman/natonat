import { NextResponse } from "next/server";
import { getAramexLogs, clearAramexLogs, AramexLogEntry } from "@/lib/aramex-logger";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const clear = searchParams.get("clear") === "true";

  if (clear) {
    clearAramexLogs();
    return NextResponse.json({ message: "Logs cleared successfully" });
  }

  const logs = getAramexLogs();
  
  // Return logs in reverse chronological order (newest first)
  const recentLogs = logs
    .slice(-limit)
    .reverse();

  return NextResponse.json({
    total: logs.length,
    returned: recentLogs.length,
    logs: recentLogs,
  });
}

export async function DELETE() {
  clearAramexLogs();
  return NextResponse.json({ message: "Logs cleared successfully" });
}
