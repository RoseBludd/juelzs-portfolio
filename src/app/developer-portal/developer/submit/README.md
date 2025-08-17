# Developer Code Submission Feature

This feature allows developers to submit their code directly through the developer portal instead of using pull requests or email submissions.

## Overview

The code submission feature provides:

1. A simple form for developers to enter their email and upload their code file
2. Automatic evaluation of the submitted code using AI
3. Immediate feedback on the submission
4. Storage of the submission in the database for review

## How It Works

1. Developer navigates to `/developer/submit` in the portal
2. They enter their email address and upload their code file
3. The system processes the submission:
   - Stores the file in S3 (production) or locally (development)
   - Evaluates the code using Claude AI
   - Records the submission in the database
4. The developer receives immediate feedback:
   - If the code passes evaluation, they are redirected to a success page
   - If the code doesn't pass, they receive feedback on what needs improvement

## Implementation Details

### Components

- `page.tsx` - The main submission page
- `SubmissionForm.tsx` - The form component for handling submissions
- `success/page.tsx` - The success page shown after successful submission
- `api/developer/submit-code/route.ts` - The API endpoint for processing submissions

### API Endpoint

The API endpoint handles:

1. Receiving the form data (email and file)
2. Creating or finding the developer record
3. Storing the file in S3 or locally
4. Evaluating the code using Claude AI
5. Storing the submission results in the database
6. Returning the evaluation results to the frontend

### Database Integration

Submissions are stored in the `developer_applications` table with:

- Developer information
- Submission timestamp
- Evaluation results
- Technical assessment score
- File location

## Configuration

The feature requires the following environment variables:

- `AWS_REGION` - AWS region for S3 storage
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_S3_BUCKET` - S3 bucket name for file storage
- `ANTHROPIC_API_KEY` - API key for Claude AI

## Future Enhancements

Potential future enhancements include:

1. Support for multiple file uploads
2. Integration with GitHub to create pull requests automatically
3. Enhanced AI evaluation with more specific feedback
4. Support for different types of assessments
5. Email notifications for submission status updates 