// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sjufrnpoinoeilajmyfr.supabase.co'; // Reemplaza con tu URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdWZybnBvaW5vZWlsYWpteWZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjczODUzOCwiZXhwIjoyMDQ4MzE0NTM4fQ.5mktBm2eVNx4h_5oz9e17lPCdNLpD1lfbBu-_zAcygw'; // Reemplaza con tu clave anónima
export const supabase = createClient(supabaseUrl, supabaseKey);
