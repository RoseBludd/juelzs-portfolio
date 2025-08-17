-- Add developer_profile_picture_url to milestone_updates table
ALTER TABLE milestone_updates ADD COLUMN IF NOT EXISTS developer_profile_picture_url TEXT;

-- Update existing records to use the developer's profile picture
UPDATE milestone_updates mu
SET developer_profile_picture_url = d.profile_picture_url
FROM developers d
WHERE mu.developer_id = d.id AND mu.developer_profile_picture_url IS NULL; 