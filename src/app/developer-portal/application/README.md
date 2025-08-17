# Developer Application and Assessment Flow

This document outlines the complete user journey from initial application to becoming an active developer in the portal.

## User Journey Overview

```
Root Page (/) → Application (/application) → Assessment (/application/assessment/[roleId]) 
→ Submission Confirmation (/application/assessment/submitted) → Developer Portal (/developer)
```

## Detailed Flow

### 1. Initial Entry
- User visits the root page (`/`)
- User clicks "Apply Now" button
- User is directed to the application page (`/application`)

### 2. Application Process
- User fills out the application form with:
  - Personal details (name, email, WhatsApp)
  - Position selection (role)
  - Experience level
  - Skills
- User submits the application
- Email is stored in localStorage
- User is automatically redirected to the role-specific assessment page

### 3. Assessment Process
- User is directed to the role-specific assessment page (`/application/assessment/[roleId]`)
- Email field is pre-filled from the application
- User reviews the assessment requirements for their role:
  - Prerequisites
  - Tasks
  - Acceptance criteria
  - Example code
- User completes the assessment and uploads their code
- User submits their assessment

### 4. Submission Confirmation
- User is redirected to the submission confirmation page (`/application/assessment/submitted`)
- User sees confirmation of submission and next steps:
  - Automated evaluation process
  - Results notification
  - Next steps based on assessment score
- User receives email with assessment results when evaluation is complete

### 5. Developer Portal Access
- If assessment score is ≥80%:
  - User receives email with instructions to access the developer portal
  - User visits the developer portal (`/developer`)
  - System checks their status (using the stored email)
  - User is redirected to the dashboard (`/developer/dashboard`)
- If assessment score is <80%:
  - User receives email with feedback and option to resubmit
  - If they try to access the developer portal, they're redirected to the assessment page

## Data Flow

### Key Data Points
- **Email**: Used as the primary identifier throughout the process
  - Stored in localStorage after application submission
  - Passed in URL parameters between pages
  - Used to check developer status
- **Role/Position**: Selected during application
  - Stored in localStorage
  - Used to show role-specific assessment
  - Used to evaluate code submission

### Storage Mechanisms
- **localStorage**:
  - `userEmail`: User's email address
  - `selectedPosition`: User's selected role/position
- **URL Parameters**:
  - `email`: Passed between pages to maintain context
  - `role`: Used for redirects to role-specific pages

## API Endpoints

- `/api/apply`: Handles application submission
- `/api/application/submit-assessment`: Processes assessment submission
- `/api/developer/status`: Checks developer status and progression

## Status Transitions

1. **New Applicant**: Initial state after application submission
2. **Assessment Pending**: After application, before assessment submission
3. **Assessment Submitted**: After assessment submission, before evaluation
4. **Assessment Failed**: If assessment score is <80%
5. **Assessment Passed**: If assessment score is ≥80%
6. **Active Developer**: After assessment is passed and account is activated

## Implementation Notes

- The application form redirects directly to the role-specific assessment page
- The assessment page checks for existing role selection and redirects accordingly
- Email is consistently stored and passed between pages to maintain user context
- Developer status is checked when accessing the developer portal to ensure proper access control 