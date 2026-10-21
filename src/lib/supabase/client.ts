// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zzmyozjmrzfjdnltmhdb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6bXlvemptcnpmamRubHRtaGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NDYzNDUsImV4cCI6MjEwODEyMjM0NX0.9irU9VEjccL64LS2y2WR8p5oXtERFlxI-Sq5ovfODOo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
