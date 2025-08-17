-- Update the task_status enum to match the actual values used in the database
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'available';
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'blocked';

-- Create a milestone_status enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'milestone_status') THEN
        CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'completed');
    END IF;
END $$;

-- Log the schema update
INSERT INTO schema_update_log (id, description, executed_at)
VALUES (gen_random_uuid(), 'Updated task_status enum to include all status values used in the application. Created milestone_status enum.', NOW()); 