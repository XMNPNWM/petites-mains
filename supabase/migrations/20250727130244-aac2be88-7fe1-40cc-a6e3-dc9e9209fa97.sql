-- Move pgvector extension to dedicated schema for better security
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pgvector extension from public schema to extensions schema
DROP EXTENSION IF EXISTS vector;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Grant necessary permissions for the extension
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

-- Update any existing references to use the proper schema
-- (Note: This may require updating application code that references vector types)