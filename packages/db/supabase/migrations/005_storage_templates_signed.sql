-- Buckets for subscription agreement template and signed documents

-- templates: subscription agreement PDFs per fund (path: {fund_id}/subscription_agreement.pdf)
INSERT INTO storage.buckets (id, name, public)
VALUES ('templates', 'templates', false)
ON CONFLICT (id) DO NOTHING;

-- signed-documents: signed subscription agreements from DocuSign (path: {investor_id}/{envelope_id}_subscription_agreement.pdf)
INSERT INTO storage.buckets (id, name, public)
VALUES ('signed-documents', 'signed-documents', false)
ON CONFLICT (id) DO NOTHING;
