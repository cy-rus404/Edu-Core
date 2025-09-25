import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Use your actual Supabase credentials
const supabaseUrl = 'https://ydcmatmasdjeqhcgbioj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY21hdG1hc2RqZXFoY2diaW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjkxMzEsImV4cCI6MjA3NDMwNTEzMX0.y268Ob8pZZnpotwOOA3303f90uDmUFzoynLR5F_U36I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 