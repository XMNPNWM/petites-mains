
-- Clean up legacy coherence and next-steps entries from chat_sessions table
DELETE FROM chat_sessions 
WHERE chat_type IN ('coherence', 'next-steps');
