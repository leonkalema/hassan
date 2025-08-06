-- Create translation jobs table for sequential processing
CREATE TABLE IF NOT EXISTS translation_jobs (
  id SERIAL PRIMARY KEY,
  locale VARCHAR(5) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 2,
  source_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  ai_review_status VARCHAR(20) DEFAULT 'pending',
  ai_review_score INTEGER,
  ai_review_notes TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_translation_jobs_status ON translation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_priority ON translation_jobs(priority, created_at);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_locale ON translation_jobs(locale);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_source_hash ON translation_jobs(source_hash);

-- Create function to create table (for GitHub Action)
CREATE OR REPLACE FUNCTION create_translation_jobs_table()
RETURNS void AS $$
BEGIN
  -- This function ensures the table exists
  -- Called from GitHub Action
  RAISE NOTICE 'Translation jobs table ready';
END;
$$ LANGUAGE plpgsql;

-- Create function to get next job in queue
CREATE OR REPLACE FUNCTION get_next_translation_job()
RETURNS TABLE(
  job_id INTEGER,
  locale VARCHAR(5),
  source_hash VARCHAR(64),
  priority INTEGER,
  attempts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tj.id,
    tj.locale,
    tj.source_hash,
    tj.priority,
    tj.attempts
  FROM translation_jobs tj
  WHERE tj.status = 'pending'
    AND tj.attempts < 3  -- Max 3 attempts
  ORDER BY tj.priority ASC, tj.created_at ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to update job status
CREATE OR REPLACE FUNCTION update_translation_job_status(
  job_id INTEGER,
  new_status VARCHAR(20),
  error_msg TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE translation_jobs 
  SET 
    status = new_status,
    started_at = CASE WHEN new_status = 'processing' THEN NOW() ELSE started_at END,
    completed_at = CASE WHEN new_status IN ('completed', 'failed') THEN NOW() ELSE completed_at END,
    attempts = CASE WHEN new_status = 'processing' THEN attempts + 1 ELSE attempts END,
    error_message = COALESCE(error_msg, error_message)
  WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update AI review status
CREATE OR REPLACE FUNCTION update_ai_review_status(
  job_id INTEGER,
  review_status VARCHAR(20),
  review_score INTEGER DEFAULT NULL,
  review_notes TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE translation_jobs 
  SET 
    ai_review_status = review_status,
    ai_review_score = review_score,
    ai_review_notes = review_notes
  WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;
