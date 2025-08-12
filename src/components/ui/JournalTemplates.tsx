'use client';

import { useState } from 'react';
import Button from './Button';

interface JournalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  title: string;
  content: string;
  tags: string[];
  metadata: {
    difficulty?: number;
    impact?: number;
    learnings?: string[];
    nextSteps?: string[];
  };
}

interface JournalTemplatesProps {
  onTemplateSelect: (template: JournalTemplate) => void;
  onClose: () => void;
}

export default function JournalTemplates({ onTemplateSelect, onClose }: JournalTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const templates: JournalTemplate[] = [
    // Architecture Decision Templates
    {
      id: 'architecture-decision',
      name: 'Architecture Decision Record',
      description: 'Document important architectural decisions with context and consequences',
      category: 'architecture',
      icon: '🏗️',
      title: 'ADR: [Decision Title]',
      content: `## Context
What is the issue that we're seeing that is motivating this decision or change?

## Decision
What is the change that we're proposing and/or doing?

## Status
[Proposed | Accepted | Deprecated]

## Consequences
What becomes easier or more difficult to do because of this change?

### Positive
- 

### Negative
- 

### Neutral
- 

## Alternatives Considered
What other options were evaluated?

## Implementation Notes
Any specific implementation details or considerations.`,
      tags: ['architecture', 'decision', 'adr'],
      metadata: {
        difficulty: 7,
        impact: 8,
        learnings: [],
        nextSteps: ['Review with team', 'Update documentation', 'Plan implementation']
      }
    },

    // Team Issue Templates
    {
      id: 'team-issue-tracker',
      name: 'Team Issue & Follow-up',
      description: 'Track team communication issues and required follow-ups',
      category: 'problem-solving',
      icon: '👥',
      title: 'Team Issue: [Person/Team] - [Brief Description]',
      content: `## Issue Description
Brief description of the communication or team issue.

## Team Member(s) Involved
- 

## Context
When did this happen and what led to it?

## Impact Assessment
How is this affecting the project/team?

## Action Items
### Immediate (Today/Tomorrow)
- [ ] 

### Short-term (This Week)
- [ ] 

### Long-term (This Month)
- [ ] 

## Communication Plan
How will you follow up and when?

## Resolution Status
- [ ] Issue acknowledged
- [ ] Discussion scheduled
- [ ] Action plan agreed
- [ ] Resolution implemented
- [ ] Follow-up completed`,
      tags: ['team-issues', 'communication', 'follow-up', 'reminders'],
      metadata: {
        difficulty: 4,
        impact: 6,
        learnings: [],
        nextSteps: ['Schedule follow-up', 'Monitor progress']
      }
    },

    // Performance Investigation
    {
      id: 'performance-investigation',
      name: 'Performance Investigation',
      description: 'Systematic approach to performance issues and optimizations',
      category: 'problem-solving',
      icon: '⚡',
      title: 'Performance Investigation: [Component/System]',
      content: `## Problem Statement
What performance issue are we investigating?

## Metrics & Baselines
### Current Performance
- Response time: 
- Throughput: 
- Resource usage: 

### Target Performance
- Target response time: 
- Target throughput: 
- Acceptable resource usage: 

## Investigation Steps
### Data Collection
- [ ] Performance profiling
- [ ] Resource monitoring
- [ ] User experience metrics
- [ ] Database query analysis

### Analysis
- [ ] Bottleneck identification
- [ ] Code review
- [ ] Architecture review
- [ ] Third-party service impact

## Findings
### Root Causes
1. 
2. 
3. 

### Evidence
- 

## Optimization Plan
### Quick Wins (< 1 day)
- [ ] 

### Medium-term (1-5 days)
- [ ] 

### Long-term (> 1 week)
- [ ] 

## Results
### Before/After Metrics
- 

### Lessons Learned
- `,
      tags: ['performance', 'optimization', 'investigation', 'metrics'],
      metadata: {
        difficulty: 8,
        impact: 9,
        learnings: [],
        nextSteps: ['Implement fixes', 'Monitor improvements', 'Document learnings']
      }
    },

    // Research & Learning
    {
      id: 'research-notes',
      name: 'Research & Learning Notes',
      description: 'Structured approach to research, experimentation, and learning',
      category: 'reflection',
      icon: '🔬',
      title: 'Research: [Topic/Technology]',
      content: `## Research Question
What are you trying to learn or understand?

## Hypothesis
What do you expect to find or learn?

## Research Method
How are you approaching this research?
- [ ] Literature review
- [ ] Proof of concept
- [ ] Experimentation
- [ ] Expert consultation
- [ ] Community research

## Sources & References
### Articles/Papers
- 

### Tools/Technologies
- 

### Experts/Communities
- 

## Key Findings
### What Works
- 

### What Doesn't Work
- 

### Unexpected Discoveries
- 

## Implications for Our Projects
How does this research apply to your current work?

## Future Research
What questions did this raise for future investigation?`,
      tags: ['research', 'learning', 'experimentation', 'poc'],
      metadata: {
        difficulty: 6,
        impact: 7,
        learnings: [],
        nextSteps: ['Apply findings', 'Share with team', 'Plan next research']
      }
    },

    // Code Review Insights
    {
      id: 'code-review-insights',
      name: 'Code Review Insights',
      description: 'Capture valuable insights from code reviews and refactoring',
      category: 'reflection',
      icon: '👁️',
      title: 'Code Review Insights: [Component/PR]',
      content: `## Code Review Context
### Repository/Branch
- 

### Scope of Changes
- 

### Reviewer(s)
- 

## Key Insights
### Code Quality Observations
- 

### Architecture Patterns Noticed
- 

### Performance Considerations
- 

### Security Findings
- 

## Lessons Learned
### Best Practices Reinforced
- 

### Anti-patterns Identified
- 

### New Techniques Discovered
- 

## Action Items
### For This PR
- [ ] 

### For Future Development
- [ ] 

### For Team Guidelines
- [ ] 

## Knowledge Sharing
How can these insights benefit the team?`,
      tags: ['code-review', 'quality', 'best-practices', 'team-learning'],
      metadata: {
        difficulty: 5,
        impact: 6,
        learnings: [],
        nextSteps: ['Share insights', 'Update guidelines', 'Apply learnings']
      }
    },

    // Project Milestone
    {
      id: 'project-milestone',
      name: 'Project Milestone Reflection',
      description: 'Comprehensive reflection on project milestones and achievements',
      category: 'milestone',
      icon: '🎯',
      title: 'Milestone: [Project] - [Milestone Name]',
      content: `## Milestone Overview
### Achievement
What was accomplished?

### Timeline
- Start date: 
- Target date: 
- Actual completion: 

### Key Metrics
- 

## Success Factors
### What Went Well
- 

### Team Performance
- 

### Technical Achievements
- 

## Challenges & Solutions
### Obstacles Encountered
1. **Challenge:** 
   **Solution:** 
   **Impact:** 

2. **Challenge:** 
   **Solution:** 
   **Impact:** 

## Technical Learnings
### Architecture Insights
- 

### Technology Discoveries
- 

### Process Improvements
- 

## Project Health Assessment
### Current Status
- [ ] On track
- [ ] At risk
- [ ] Behind schedule
- [ ] Ahead of schedule

### Resource Status
- Team capacity: 
- Technical debt: 
- Infrastructure health: 

## Next Phase Planning
### Immediate Priorities
- 

### Risk Mitigation
- 

### Success Criteria for Next Milestone
- `,
      tags: ['milestone', 'project-management', 'retrospective', 'planning'],
      metadata: {
        difficulty: 6,
        impact: 8,
        learnings: [],
        nextSteps: ['Plan next phase', 'Address technical debt', 'Team celebration']
      }
    },

    // Quick Idea Capture
    {
      id: 'quick-idea',
      name: 'Quick Idea Capture',
      description: 'Fast template for capturing random ideas and inspirations',
      category: 'planning',
      icon: '💡',
      title: 'Idea: [Brief Description]',
      content: `## The Idea
Quick description of the idea.

## Context
What triggered this idea?

## Potential Value
Why might this be valuable?

## Implementation Thoughts
High-level thoughts on how this could work.

## Next Steps
- [ ] Research feasibility
- [ ] Discuss with team
- [ ] Create proof of concept
- [ ] Document requirements

## Related Ideas/Projects
Any connections to existing work?`,
      tags: ['ideas', 'innovation', 'future-features'],
      metadata: {
        difficulty: 3,
        impact: 5,
        learnings: [],
        nextSteps: ['Evaluate feasibility', 'Prioritize against roadmap']
      }
    },

    // Daily Engineering Log
    {
      id: 'daily-engineering-log',
      name: 'Daily Engineering Log',
      description: 'End-of-day engineering reflection and planning',
      category: 'reflection',
      icon: '📊',
      title: 'Engineering Log: [Date]',
      content: `## Today's Focus
What were the main engineering tasks today?

## Accomplishments
### Code/Features Completed
- 

### Bugs Fixed
- 

### Architecture/Design Work
- 

### Learning/Research
- 

## Challenges Encountered
### Technical Issues
- **Issue:** 
  **Resolution:** 
  **Time spent:** 

### Blockers
- **Blocker:** 
  **Status:** 
  **Next action:** 

## Insights & Learnings
### Technical Discoveries
- 

### Process Improvements
- 

### Tools/Techniques
- 

## Tomorrow's Plan
### Priority Tasks
1. 
2. 
3. 

### Dependencies
- 

### Potential Risks
- 

## Team Interactions
### Collaborations
- 

### Help Provided/Received
- 

## Energy & Focus Level
Rate your productivity and focus today (1-10): 

### What helped productivity?
- 

### What hindered productivity?
- `,
      tags: ['daily-log', 'productivity', 'reflection', 'planning'],
      metadata: {
        difficulty: 2,
        impact: 4,
        learnings: [],
        nextSteps: ['Execute tomorrow\'s plan', 'Follow up on blockers']
      }
    },

    // Learning Templates
    {
      id: 'book-insights',
      name: 'Book Insights & Notes',
      description: 'Capture key insights, quotes, and applications from books',
      category: 'learning',
      icon: '📚',
      title: 'Book Notes: [Book Title] by [Author]',
      content: `## Book Information
**Title**: 
**Author**: 
**Chapter/Section**: 

## Key Quote/Insight
> "Quote or key insight here"

## My Interpretation
What does this mean to me? How do I understand this concept?

## Application to My Work
How can I apply this insight to my current projects or engineering practices?

## Related Concepts
What other ideas, books, or experiences does this connect to?

## Action Items
What specific steps will I take based on this learning?

## Questions for Further Exploration
What questions does this raise that I want to investigate further?`,
      tags: ['books', 'learning', 'insights', 'professional-development'],
      metadata: {
        difficulty: 3,
        impact: 6,
        learnings: ['Document learning for future reference', 'Connect new knowledge to existing experience'],
        nextSteps: ['Apply one insight to current project', 'Share learning with team if relevant']
      }
    },

    {
      id: 'course-notes',
      name: 'Course & Training Notes',
      description: 'Document key learnings from courses, workshops, or training sessions',
      category: 'learning',
      icon: '🎓',
      title: 'Course Notes: [Course/Training Title]',
      content: `## Course Information
**Course**: 
**Instructor/Platform**: 
**Date**: 
**Duration**: 

## Key Concepts Learned
1. 
2. 
3. 

## Practical Examples
Concrete examples or demos that stood out:

## Technical Skills Gained
New tools, frameworks, or techniques:

## Immediate Applications
How I can use this knowledge right away:

## Long-term Value
How this fits into my career development:

## Resources & References
- Links to course materials
- Additional reading recommendations
- Tools or resources mentioned`,
      tags: ['courses', 'training', 'skills', 'professional-development'],
      metadata: {
        difficulty: 4,
        impact: 7,
        learnings: ['Structured approach to course note-taking', 'Connect learning to practical applications'],
        nextSteps: ['Practice new skills in a project', 'Schedule follow-up learning']
      }
    },

    {
      id: 'research-findings',
      name: 'Research & Investigation',
      description: 'Document findings from technical research, articles, or exploration',
      category: 'learning',
      icon: '🔬',
      title: 'Research: [Topic/Question]',
      content: `## Research Question/Goal
What am I trying to learn or understand?

## Sources Investigated
- Article/Documentation links
- Stack Overflow discussions
- GitHub repositories
- Expert opinions

## Key Findings
1. **Finding 1**: 
   - Evidence: 
   - Implications: 

2. **Finding 2**: 
   - Evidence: 
   - Implications: 

## Comparisons & Trade-offs
How do different approaches compare?

## Recommended Approach
Based on my research, what's the best path forward?

## Open Questions
What still needs investigation?

## Related Learning
What should I research next to build on this knowledge?`,
      tags: ['research', 'investigation', 'technical-analysis'],
      metadata: {
        difficulty: 5,
        impact: 6,
        learnings: ['Systematic approach to technical research', 'Document findings for team knowledge'],
        nextSteps: ['Share findings with team', 'Implement recommended approach']
      }
    }
  ];

  const categories = [
    { value: 'all', label: 'All Templates', icon: '📋' },
    { value: 'architecture', label: 'Architecture', icon: '🏗️' },
    { value: 'problem-solving', label: 'Problem Solving', icon: '🔧' },
    { value: 'reflection', label: 'Reflection', icon: '💭' },
    { value: 'milestone', label: 'Milestones', icon: '🎯' },
    { value: 'planning', label: 'Planning', icon: '📅' },
    { value: 'learning', label: 'Learning', icon: '📚' }
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">📋 Journal Entry Templates</h2>
          <Button
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-transparent hover:bg-gray-700"
          >
            ✕
          </Button>
        </div>

        {/* Category Filter */}
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span>{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="bg-gray-900/50 rounded-lg border border-gray-600 p-4 hover:border-gray-500 transition-colors cursor-pointer"
                onClick={() => onTemplateSelect(template)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-sm">{template.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">{template.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {template.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-700 text-gray-300"
                    >
                      #{tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="text-xs text-gray-500">+{template.tags.length - 3} more</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Difficulty: {template.metadata.difficulty}/10
                  </span>
                  <span className="text-gray-500">
                    Impact: {template.metadata.impact}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-gray-900/30">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
            </p>
            <div className="flex gap-2">
              <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
