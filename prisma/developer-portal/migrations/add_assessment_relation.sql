-- Add applicationId column to AssessmentResult table
ALTER TABLE "AssessmentResult" ADD COLUMN "applicationId" UUID;

-- Create index on the new foreign key
CREATE INDEX "idx_assessment_application_id" ON "AssessmentResult"("applicationId");

-- Add foreign key constraint
ALTER TABLE "AssessmentResult" 
ADD CONSTRAINT "fk_assessment_application" 
FOREIGN KEY ("applicationId") 
REFERENCES "developer_applications"("id") ON DELETE SET NULL;

-- Update existing assessment records if possible (optional)
-- This assumes there's some way to match existing assessments to applications
-- For example, matching on email if that's reliable
-- UPDATE "AssessmentResult" ar
-- SET "applicationId" = da.id
-- FROM "developer_applications" da
-- WHERE ar.email = (SELECT email FROM developers WHERE id = da.developer_id);
