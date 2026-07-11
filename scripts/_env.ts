/**
 * Loads .env.local for standalone scripts (tsx). Next.js loads it automatically
 * for the app, but scripts run in plain Node and need it explicitly. Import this
 * FIRST in any script that touches Supabase.
 */
import { config } from 'dotenv';

config({ path: '.env.local' });
