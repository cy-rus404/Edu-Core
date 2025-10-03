import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Use environment variables for security
const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const envKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Use fallback if env vars are not set or contain placeholder text
const supabaseUrl = (envUrl && !envUrl.includes('your_supabase_url_here')) 
  ? envUrl 
  : 'https://ydcmatmasdjeqhcgbioj.supabase.co';

const supabaseAnonKey = (envKey && !envKey.includes('your_supabase_anon_key_here')) 
  ? envKey 
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY21hdG1hc2RqZXFoY2diaW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjkxMzEsImV4cCI6MjA3NDMwNTEzMX0.y268Ob8pZZnpotwOOA3303f90uDmUFzoynLR5F_U36I';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_url_here') {
  throw new Error('Invalid Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Input validation helper
export const validateInput = (input, type = 'text') => {
  if (!input || input.trim() === '') return false;
  
  switch (type) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    case 'password':
      return input.length >= 6;
    case 'number':
      return !isNaN(input) && input > 0;
    default:
      return input.trim().length > 0;
  }
};

// Error handler
export const handleError = (error, defaultMessage = 'An error occurred') => {
  console.error('Error:', error);
  return error?.message || defaultMessage;
}; 