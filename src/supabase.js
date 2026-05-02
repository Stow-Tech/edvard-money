import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rciqjzagiekcxqspwsjh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjaXFqemFnaWVrY3hxc3B3c2poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMDE4MDQsImV4cCI6MjA5MDY3NzgwNH0.fD_zJgZbcWAaeYDY0lp7sIEjiAXEGlhFLha1DWVD4DA';

export const supabase = createClient(supabaseUrl, supabaseKey);