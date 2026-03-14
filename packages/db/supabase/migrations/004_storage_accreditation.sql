-- Private bucket for accreditation documents
-- Path: [investorId]/[timestamp]-[filename]
-- Access: server-side only via service role (no public URLs)
-- Create via Supabase Dashboard if this fails: Storage > New bucket > "accreditation" (private)

INSERT INTO storage.buckets (id, name, public)
VALUES ('accreditation', 'accreditation', false)
ON CONFLICT (id) DO NOTHING;
