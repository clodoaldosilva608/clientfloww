import { supabase } from "@/lib/supabase";
import type { Database, Json } from "@/types/db";

type LogLevel = 'info' | 'warn' | 'error' | 'critical';

interface LogOptions {
  userId?: string;
  context?: string;
  payload?: Json;
}

export const logger = {
  async log(level: LogLevel, message: string, options: LogOptions = {}) {
    const timestamp = new Date().toISOString();
    
    // Console log for immediate visibility
    const consoleMethod = level === 'critical' ? 'error' : (level === 'error' ? 'error' : (level === 'warn' ? 'warn' : 'log'));
    console[consoleMethod](`[${timestamp}] [${level.toUpperCase()}] ${options.context ? `[${options.context}] ` : ''}${message}`, options.payload ? { payload: options.payload } : '');

    // Database logging (Optional persistence for audit)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = options.userId || user?.id;

      if (userId) {
        await supabase.from("system_logs").insert({
          user_id: userId,
          level,
          message,
          context: options.context || null,
          payload: options.payload || {},
          created_at: timestamp
        });
      }
    } catch (e) {
      // Silently fail DB logging to not interrupt main flow
      console.warn("[Logger] Failed to persist log to database", e);
    }
  },

  info(message: string, options: LogOptions = {}) {
    return this.log('info', message, options);
  },

  warn(message: string, options: LogOptions = {}) {
    return this.log('warn', message, options);
  },

  error(message: string, options: LogOptions = {}) {
    return this.log('error', message, options);
  },

  critical(message: string, options: LogOptions = {}) {
    return this.log('critical', message, options);
  }
};
