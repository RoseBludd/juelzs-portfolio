# Portfolio Services Testing Guide

This guide explains how to test and validate that all portfolio services are working correctly.

## Quick Test (Recommended)

Run the basic service validation:

```bash
npm run test:services
```

This will:
- ✅ Check environment variables are configured
- ✅ Test GitHub API authentication
- ✅ Test AWS S3 connection (if AWS CLI available)
- ✅ Verify TypeScript compilation
- ✅ Test Next.js integration

## Advanced Testing

For comprehensive service testing including transcript analysis:

```bash
npm run test:advanced
```

This runs the full TypeScript test suite that validates:
- 🔧 Environment configuration
- 🐙 GitHub service (authentication, repositories, projects)
- ☁️ S3 service (file listing, meeting analysis, categorization)
- 🧠 Transcript analysis (technical vs administrative content)
- 🔗 Portfolio integration (merged data from all sources)
- ⚙️ Initialization service (health checks, status)

## Environment Setup

Ensure your `.env` file contains:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=genius-untitled
AWS_S3_MEETINGS_PATH=meetings

# GitHub Configuration
GITHUB_TOKEN=your_github_token
GITHUB_USERNAME=RoseBludd

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Expected Results

### Successful Test Output:
```
🚀 Starting Portfolio Services Test Suite...

📋 Environment Check:
  ✅ AWS_REGION: configured
  ✅ AWS_ACCESS_KEY_ID: configured
  ✅ AWS_SECRET_ACCESS_KEY: configured
  ✅ AWS_S3_BUCKET: configured
  ✅ AWS_S3_MEETINGS_PATH: configured
  ✅ GITHUB_TOKEN: configured
  ✅ GITHUB_USERNAME: configured

🐙 Testing GitHub Connection...
  ✅ GitHub authenticated as: RoseBludd

☁️ Testing AWS S3 Connection...
  ✅ S3 connection successful
  📁 Found 15 files in meetings folder

🚀 Portfolio services are ready!
```

## Troubleshooting

### GitHub Authentication Errors
- Verify your `GITHUB_TOKEN` has correct scopes: `repo`, `read:org`
- Check token is not expired
- Ensure token is from the correct GitHub account

### S3 Connection Issues
- Verify AWS credentials are correct
- Check S3 bucket permissions allow ListObjects
- Ensure bucket exists and contains meeting files

### Transcript Analysis
- Only portfolio-relevant meetings will appear (technical/leadership content)
- Administrative meetings are automatically filtered out
- Meetings need transcripts for analysis

### No Data Appearing
- Services auto-sync every 30 minutes in development
- Manual sync available in browser console
- Check for errors in browser developer tools

## Integration Points

### Leadership Section
- Shows analyzed S3 meetings with categories
- Displays key moments extracted from transcripts
- Filters out non-technical meetings automatically

### Projects Section  
- Displays GitHub repositories with enhanced metadata
- Auto-categorizes by content: AI, Architecture, Leadership, Systems
- Merges manual portfolio entries with live GitHub data

### Real-time Sync
- Background sync service runs automatically
- New GitHub projects and S3 meetings appear without restart
- Development shows sync status in bottom-right corner

## Manual Verification

After tests pass, verify integration by:

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Check sync status:**
   - Look for green "Services Active" indicator (development only)
   - Check browser console for sync logs

3. **Verify data:**
   - Visit `/leadership` - should show categorized meetings
   - Visit `/projects` - should show GitHub repositories
   - Visit `/` - should show featured content from both sources

## Performance Notes

- **Development**: Uses singleton connections, 30-min sync intervals
- **Production**: Uses connection pooling, 15-min sync intervals  
- **Testing**: Most tests complete in <5 seconds
- **S3 Analysis**: Transcript processing may take 10-30 seconds per meeting
- **GitHub Sync**: Repository analysis scales with repo count

## Security

- Environment variables are never logged or exposed
- AWS credentials use least-privilege access
- GitHub token requires minimal scopes
- All S3 URLs are pre-signed with expiration 