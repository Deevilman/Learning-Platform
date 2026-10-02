// Site configuration. The Supabase anon key is a *public* key by design: it
// only grants what the Row Level Security policies in supabase/schema.sql
// allow (each user can read and write only their own rows).
export const config = {
  supabase: {
    url: 'https://dttnflehddxlmprrstbf.supabase.co',
    anonKey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dG5mbGVoZGR4bG1wcnJzdGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NTk1NzEsImV4cCI6MjEwNjUzNTU3MX0.I2H0x9b8QeV7frTDuhbnfd3qnFPiw_9HrtdSsWszHrk',
  },
}
