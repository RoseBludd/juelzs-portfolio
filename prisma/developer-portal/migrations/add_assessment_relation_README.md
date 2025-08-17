# Assessment Relation Enhancement

This migration adds a direct relationship between the `AssessmentResult` and `developer_applications` tables to improve data integrity and make it easier to query related assessment data.

## Changes

1. Adds an `applicationId` column to the `AssessmentResult` table
2. Creates an index on this column for better query performance
3. Adds a foreign key constraint linking to the `developer_applications` table
4. Establishes a bidirectional relationship between the tables

## Benefits

- Easier querying of assessment data related to specific applications
- Improved data integrity through formal database relationships
- Better performance for queries that join these tables
- Cleaner code with fewer manual lookups

## How to Apply

### Option 1: Manual Application

Execute the SQL in `add_assessment_relation.sql`:

```sql
-- Add applicationId column to AssessmentResult table
ALTER TABLE "AssessmentResult" ADD COLUMN "applicationId" UUID;

-- Create index on the new foreign key
CREATE INDEX "idx_assessment_application_id" ON "AssessmentResult"("applicationId");

-- Add foreign key constraint
ALTER TABLE "AssessmentResult" 
ADD CONSTRAINT "fk_assessment_application" 
FOREIGN KEY ("applicationId") 
REFERENCES "developer_applications"("id") ON DELETE SET NULL;
```

### Option 2: Prisma Migration

For a proper Prisma migration:

1. Update the schema.prisma file to add these relations:

```prisma
model AssessmentResult {
  // Existing fields...
  applicationId  String?  @db.Uuid
  application    developer_applications? @relation(fields: [applicationId], references: [id])
  @@index([applicationId])
}

model developer_applications {
  // Existing fields...
  assessmentResults AssessmentResult[]
}
```

2. Run prisma migrate:
```
npx prisma migrate dev --name add_assessment_relation
```

## After Migration

After applying this migration, the grading API has been updated to use this relation. It attempts to update the applicationId column when grading a submission, but also handles cases where the column doesn't exist yet for backward compatibility. 