import { promises as fs } from 'fs';
import path from 'path';

import Anthropic from '@anthropic-ai/sdk';
import { query } from '../lib/db.js';

import { workspaceServers } from '../config/workspace-servers';
import { logger } from '../utils/logger';

import { WorkspaceManagementService } from './WorkspaceManagementService';

interface TaskAssignmentResult {
  success: boolean;
  workspaceId?: string;
  error?: string;
}

interface RepoAnalysis {
  requiredComponents: string[];
  dependencies: {
    external: string[];
    internal: string[];
  };
  authSetup: boolean;
  routingSetup: boolean;
  apiIntegration: boolean;
  componentStructure: {
    path: string;
    dependencies: string[];
    relatedComponents: string[];
    services: string[];
    contexts: string[];
    hooks: string[];
  };
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
}

// Using singleton query function instead
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export class TaskWorkflowService {
  private workspaceService: WorkspaceManagementService;

  constructor() {
    this.workspaceService = new WorkspaceManagementService(workspaceServers);
  }

  async handleTaskAssignment(
    taskId: string, 
    developerId: string, 
    adminNotes?: string
  ): Promise<TaskAssignmentResult> {
    try {
      // 1. Get task and developer details
      const task = await prisma.tasks.query("SELECT * FROM table_name WHERE", [{
        where: { id: taskId }
      }) as Task | null;

      const developer = await prisma.developers.query("SELECT * FROM table_name WHERE", [{
        where: { id: developerId }
      });

      if (!task || !developer) {
        throw new Error('Task or developer not found');
      }

      // 2. Analyze repository and task requirements
      const repoAnalysis = await this.analyzeRepository(task.title, task.description || '');
      logger.info('Repository analysis completed');

      // 3. Create workspace based on analysis
      const workspaceId = await this.workspaceService.createWorkspace(developerId, taskId);
      logger.info(`Created workspace: ${workspaceId}`);

      // 4. Set up workspace with required components and structure
      const workspacePath = path.join(workspaceServers.baseServerPath, workspaceId);
      await this.setupWorkspaceStructure(workspacePath, task, repoAnalysis, adminNotes);
      logger.info('Set up workspace documentation and structure');

      // 5. Create task assignment in a separate transaction
      await prisma.$transaction(async (tx) => {
        await tx.task_assignments.query("INSERT INTO table_name", [{
          data: {
            task_id: taskId,
            developer_id: developerId,
            status: 'assigned',
            start_date: new Date(),
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            notes: JSON.stringify({
              workspace_id: workspaceId,
              workspace_path: workspacePath,
              setup_completed: true,
              assigned_at: new Date().toISOString(),
              repository: 'https://github.com/RoseBludd/rm-web-app',
              branch: `feature/${task.title.toLowerCase().replace(/\s+/g, '-')}`,
              required_components: repoAnalysis.requiredComponents,
              dependencies: repoAnalysis.dependencies
            })
          }
        });
      });

      return {
        success: true,
        workspaceId
      };

    } catch (error) {
      logger.info('Error in task assignment workflow: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  }

  private async analyzeRepository(taskTitle: string, taskDescription: string): Promise<RepoAnalysis> {
    try {
      const message = await anthropic.messages.query("INSERT INTO table_name", [{
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `Analyze the rm-web-app repository (https://github.com/RoseBludd/rm-web-app/tree/development) for implementing this task:

Title: ${taskTitle}
Description: ${taskDescription}

Important Context:
- The repository uses Next.js 14 App Router structure (app/ directory)
- Components are organized by feature/domain (e.g., app/components/property/)
- Shared components are in app/components/shared/
- Services are in app/lib/services/
- Context providers are in app/contexts/
- Hooks are in app/hooks/

Please analyze:
1. Required Components and Integration Points:
   - Identify existing components to reuse
   - Required services and contexts
   - Needed hooks and utilities
   - Error boundary patterns to follow

2. Dependencies and Setup:
   - External packages needed
   - Internal dependencies
   - Configuration requirements

3. Authentication/Authorization:
   - Required auth checks
   - Permission levels needed
   - Protected routes setup

4. Routing and API:
   - New routes needed
   - API endpoints required
   - Data fetching patterns

5. Component Structure:
   - Proper path following repository patterns
   - Component hierarchy
   - State management approach

6. Testing Requirements:
   - Test file location
   - Required test scenarios
   - Mock requirements

Return ONLY a JSON object in the following exact format:

{
  "requiredComponents": [
    "app/components/shared/example",
    "app/components/property/example"
  ],
  "dependencies": {
    "external": ["package-name"],
    "internal": ["app/lib/services/example"]
  },
  "authSetup": boolean,
  "routingSetup": boolean,
  "apiIntegration": boolean,
  "componentStructure": {
    "path": "app/components/property/document-viewer",
    "dependencies": ["list", "of", "dependencies"],
    "relatedComponents": ["list", "of", "related", "components"],
    "services": ["required", "services"],
    "contexts": ["required", "contexts"],
    "hooks": ["required", "hooks"]
  }
}`
        }]
      });

      // Parse and validate the response
      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Expected text response from Anthropic API');
      }
      
      const analysis = JSON.parse(content.text) as RepoAnalysis;
      return analysis;

    } catch (error) {
      logger.info('Error analyzing repository: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  }

  private async setupWorkspaceStructure(
    workspacePath: string, 
    task: Task,
    repoAnalysis: RepoAnalysis,
    adminNotes?: string
  ): Promise<void> {
    try {
      // Create base directories
      await fs.mkdir(path.join(workspacePath, 'app'), { recursive: true });
      await fs.mkdir(path.join(workspacePath, 'app/components'), { recursive: true });
      await fs.mkdir(path.join(workspacePath, 'app/lib'), { recursive: true });
      await fs.mkdir(path.join(workspacePath, 'app/styles'), { recursive: true });
      await fs.mkdir(path.join(workspacePath, '__tests__'), { recursive: true });
      await fs.mkdir(path.join(workspacePath, 'docs'), { recursive: true });

      // Copy required components and dependencies
      for (const component of repoAnalysis.requiredComponents) {
        // Create directories for component dependencies
        const componentPath = path.join(workspacePath, 'app/components', component);
        await fs.mkdir(path.dirname(componentPath), { recursive: true });
      }

      // Create task-specific README with repository analysis
      const readmeContent = `# ${task.title}

## Task Overview
${task.description}

## Repository Analysis
### Required Components
${repoAnalysis.requiredComponents.map(c => `- ${c}`).join('\n')}

### Dependencies
${repoAnalysis.dependencies.external.map(d => `- ${d}`).join('\n')}
${repoAnalysis.dependencies.internal.map(d => `- ${d}`).join('\n')}

### Integration Requirements
- Authentication Required: ${repoAnalysis.authSetup ? 'Yes' : 'No'}
- New Routes Required: ${repoAnalysis.routingSetup ? 'Yes' : 'No'}
- API Integration Required: ${repoAnalysis.apiIntegration ? 'Yes' : 'No'}

### Component Structure
\`\`\`
Path: ${repoAnalysis.componentStructure.path}
Dependencies: ${repoAnalysis.componentStructure.dependencies.join(', ')}
Related Components: ${repoAnalysis.componentStructure.relatedComponents.join(', ')}
\`\`\`

## Integration with rm-web-app
This task is part of the rm-web-app repository. Follow these steps to get started:

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/RoseBludd/rm-web-app.git
   cd rm-web-app
   git checkout development
   git checkout -b feature/${task.title.toLowerCase().replace(/\s+/g, '-')}
   \`\`\`

2. Install dependencies (if not already done):
   \`\`\`bash
   npm install
   \`\`\`

3. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Component Location
Your component should be added to:
\`${repoAnalysis.componentStructure.path}\`

## Required Testing
Create tests in:
\`__tests__/components/${task.title.toLowerCase().replace(/\s+/g, '-')}.test.tsx\`

## Architecture Notes
- Follow the existing project structure
- Use Next.js 14 App Router conventions
- Implement as a Client Component unless Server Component is specifically required
- Use Tailwind CSS for styling
- Follow TypeScript best practices
- Ensure proper error handling
- Include loading states
- Add comprehensive tests

## Admin Notes
${adminNotes || 'No additional notes provided.'}

## Quality Checklist
- [ ] Component is properly typed with TypeScript
- [ ] Component follows Next.js 14 best practices
- [ ] Tests are comprehensive and passing
- [ ] Styling matches existing design system
- [ ] Error states are handled
- [ ] Loading states are implemented
- [ ] Code is properly documented
- [ ] Changes are properly committed with descriptive messages
- [ ] Branch is up to date with development

## Getting Help
1. Check the existing components in \`app/components/\` for patterns and examples
2. Review the project's documentation
3. Document any questions or issues in docs/issues.md
4. Reach out to the team lead if blocked

## Commit Guidelines
- Use conventional commit messages
- Keep commits focused and atomic
- Reference the task ID in commits
- Push regularly to your feature branch

## Before Submitting
1. Ensure all tests pass
2. Update documentation if needed
3. Review the quality checklist
4. Test in different viewports
5. Ensure no console errors
`;

      await fs.writeFile(
        path.join(workspacePath, 'README.md'),
        readmeContent
      );

      // Create component documentation with analysis insights
      await fs.writeFile(
        path.join(workspacePath, 'docs/COMPONENT.md'),
        `# ${task.title} Component Documentation

## Overview
${task.description}

## Integration Points
${repoAnalysis.apiIntegration ? '### API Integration\n- Required endpoints and data structures' : ''}
${repoAnalysis.authSetup ? '### Authentication\n- Required auth checks and user states' : ''}
${repoAnalysis.routingSetup ? '### Routing\n- Required route setup and navigation' : ''}

## Props
\`\`\`typescript
interface ${task.title.replace(/\s+/g, '')}Props {
  // Document props here
}
\`\`\`

## Dependencies
${repoAnalysis.dependencies.external.map(d => `- ${d}`).join('\n')}
${repoAnalysis.dependencies.internal.map(d => `- ${d}`).join('\n')}

## Related Components
${repoAnalysis.componentStructure.relatedComponents.map(c => `- ${c}`).join('\n')}

## Usage Example
\`\`\`typescript
import { ${task.title.replace(/\s+/g, '')} } from '${repoAnalysis.componentStructure.path}';

// Usage example here
\`\`\`

## States
- Loading
- Error
- Empty
- Populated

## Testing
Describe key test scenarios:
1. Component rendering
2. User interactions
3. Error handling
4. Edge cases
`
      );

      // Create issues tracking file
      await fs.writeFile(
        path.join(workspacePath, 'docs/issues.md'),
        `# Development Issues and Questions

## Questions
- List any questions about requirements or implementation here

## Blockers
- Document any blocking issues here

## Notes
- Add any important notes or decisions made during development

## References
- Link to relevant documentation or examples used

## Integration Points
- Document any challenges with integrating with existing components
- Note any auth/routing/API integration issues
`
      );

    } catch (error) {
      logger.info('Error setting up workspace structure: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  }
} 
