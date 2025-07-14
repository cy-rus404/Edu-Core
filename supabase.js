import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kfqyodldadrtoxzfwsgz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcXlvZGxkYWRydG94emZ3c2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTM5NzAsImV4cCI6MjA2ODAyOTk3MH0.mjGmScD2Rsi6uX2DFY5_xhLMlPZP4z2tNnTFsQ8LJco';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);