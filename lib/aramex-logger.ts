import fs from 'fs';
import path from 'path';

export interface AramexLogEntry {
  timestamp: string;
  endpoint: string;
  request: unknown;
  response: unknown;
  error?: string;
  durationMs: number;
}

const LOG_FILE = path.join(process.cwd(), 'aramex-api-logs.json');

export function logAramexRequest(
  endpoint: string,
  request: unknown,
  response: unknown,
  durationMs: number,
  error?: string
): void {
  const entry: AramexLogEntry = {
    timestamp: new Date().toISOString(),
    endpoint,
    request,
    response,
    durationMs,
    error,
  };

  const isServerless = process.env.VERCEL || process.env.NODE_ENV === 'production';

  // Always log to console for visibility in Vercel logs
  if (error) {
    console.error(`[Aramex API Error] ${endpoint}:`, { durationMs, error, response: JSON.stringify(response).substring(0, 500) });
  } else {
    console.log(`[Aramex API Success] ${endpoint}:`, { durationMs });
  }

  // Skip file logging in serverless environments
  if (isServerless) return;

  try {
    let logs: AramexLogEntry[] = [];
    if (fs.existsSync(LOG_FILE)) {
      const content = fs.readFileSync(LOG_FILE, 'utf-8');
      logs = JSON.parse(content);
    }
    logs.push(entry);
    // Keep only last 100 entries
    if (logs.length > 100) {
      logs = logs.slice(-100);
    }
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('[AramexLogger] Failed to write log:', err);
  }
}

export function getAramexLogs(): AramexLogEntry[] {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const content = fs.readFileSync(LOG_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('[AramexLogger] Failed to read logs:', err);
  }
  return [];
}

export function clearAramexLogs(): void {
  try {
    if (fs.existsSync(LOG_FILE)) {
      fs.unlinkSync(LOG_FILE);
    }
  } catch (err) {
    console.error('[AramexLogger] Failed to clear logs:', err);
  }
}
