import { Anthropic } from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getMainDbPool } from "@/lib/db-pool";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

interface GradingRequest {
  applicationId: string;
  prNumber: number;
}

interface TechnicalAssessment {
  score: number;
  feedback: string;
}

interface GradingResponse {
  overallFeedback: string;
  technicalAssessment: {
    architecture: TechnicalAssessment;
    codeQuality: TechnicalAssessment;
    testing: TechnicalAssessment;
    performance: TechnicalAssessment;
  };
  strengths: string[];
  improvements: string[];
}

async function getGitHubPRContents(prNumber: number): Promise<string> {
  const owner = "RoseBludd";
  const repo = "technical-assessment";
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("GitHub token not configured");
  }

  try {
    // Fetch PR details
    const prResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!prResponse.ok) {
      throw new Error(`Failed to fetch PR: ${prResponse.statusText}`);
    }

    const pr = await prResponse.json();

    // Fetch PR files
    const filesResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!filesResponse.ok) {
      throw new Error(`Failed to fetch PR files: ${filesResponse.statusText}`);
    }

    const files = await filesResponse.json();

    // Get role from branch name
    const roleBranch =
      pr.head.ref.match(/assessment\/([^/]+)/)?.[1] || "unknown";

    // Compile PR contents
    const prContents = `
# Assessment Submission Analysis

## Pull Request Details
Title: ${pr.title}
Role: ${roleBranch}
Branch: ${pr.head.ref}
Description: ${pr.body || "No description provided"}

## Changes Overview
Total Files: ${files.length}
Additions: ${files.reduce((sum: number, file: any) => sum + file.additions, 0)}
Deletions: ${files.reduce((sum: number, file: any) => sum + file.deletions, 0)}

## Modified Files
${files.map((file: any) => `- ${file.filename} (${file.status})`).join("\n")}

## Implementation Details
${files
  .map((file: any) => {
    if (file.patch && file.patch.length < 5000) {
      return `
### ${file.filename}
\`\`\`
${file.patch}
\`\`\`
`;
    }
    return `### ${file.filename}\n(File changes too large to include)\n`;
  })
  .join("\n")}

## Assessment Context
Please evaluate this submission based on:
1. Code quality and best practices
2. Implementation completeness
3. Problem-solving approach
4. Documentation and clarity
`;

    return prContents;
  } catch (error: any) {
    console.error("Error fetching PR contents:", error);
    throw new Error(`Failed to fetch PR contents: ${error.message}`);
  }
}

async function gradeSubmission(
  prContents: string,
  role: string
): Promise<GradingResponse> {
  const prompt = `You are an expert technical interviewer evaluating a coding assessment submission. Please analyze the following pull request contents and provide detailed feedback.

PR Contents:
${prContents}

Please evaluate based on:
1. Code quality and best practices
2. Architecture decisions
3. Testing approach
4. Performance considerations

Format your response as a JSON object with this structure:
{
  "overallFeedback": "string",
  "technicalAssessment": {
    "architecture": { "score": number, "feedback": "string" },
    "codeQuality": { "score": number, "feedback": "string" },
    "testing": { "score": number, "feedback": "string" },
    "performance": { "score": number, "feedback": "string" }
  },
  "strengths": ["string"],
  "improvements": ["string"]
}`;

  const response = await anthropic.messages.create({
    model: "claude-3-opus-20240229",
    max_tokens: 1500,
    temperature: 0.5,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  try {
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Anthropic API");
    }
    const result = JSON.parse(content.text) as GradingResponse;
    return result;
  } catch (error) {
    console.error("Error parsing AI response:", error);
    throw new Error("Failed to parse AI feedback");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { applicationId, prNumber } = body as GradingRequest;

    // Validate input
    if (!applicationId || !prNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = getMainDbPool();

    // Get application details with developer info
    const applicationQuery = `
      SELECT 
        da.*,
        d.name as developer_name,
        d.email as developer_email,
        d.role as developer_role
      FROM developer_applications da
      LEFT JOIN developers d ON da.developer_id = d.id
      WHERE da.id = $1
    `;
    const applicationResult = await db.query(applicationQuery, [applicationId]);
    const application = applicationResult.rows[0];

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Get PR contents
    const prContents = await getGitHubPRContents(prNumber);

    // Grade submission
    const grading = await gradeSubmission(
      prContents,
      application.position || application.developer_role || "unknown"
    );

    // Get existing GitHub submission data
    const existingSubmission = application.github_submission || {};

    // Create updated github_submission object
    const updatedGithubSubmission = {
      ...existingSubmission,
      status: grading.technicalAssessment.architecture.score >= 70 ? "passed" : "failed",
      last_updated: new Date().toISOString(),
    };

    // Update application with results
    const updateApplicationQuery = `
      UPDATE developer_applications 
      SET 
        github_submission = $1,
        status = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `;

    await db.query(updateApplicationQuery, [
      JSON.stringify(updatedGithubSubmission),
      grading.technicalAssessment.architecture.score >= 70 ? "accepted" : "rejected",
      applicationId
    ]);

    return NextResponse.json({
      success: true,
      data: {
        applicationId,
        prNumber,
        score: grading.technicalAssessment.architecture.score,
        feedback: grading,
      },
    });
  } catch (error: any) {
    console.error("Error grading submission:", error);
    return NextResponse.json(
      { error: `Failed to grade submission: ${error.message}` },
      { status: 500 }
    );
  }
}
