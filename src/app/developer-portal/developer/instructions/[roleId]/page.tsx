'use client';

import { 
  IconChevronLeft, 
  IconDownload, 
  IconCode, 
  IconServer, 
  IconPlugConnected, 
  IconCloud, 
  IconStack,
  IconBrandGithub,
  IconFileCode,
  IconChecklist,
  IconArrowRight
} from '@tabler/icons-react';
import Link from 'next/link';
import React, { useState } from 'react';

// Define the role data structure
interface RoleData {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  longDescription: string;
  requirements: string[];
  tasks: {
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    compensation: number;
    skills: string[];
    instructions: string;
  }[];
  resources: {
    title: string;
    url: string;
    description: string;
  }[];
}

// Define the roles data
const rolesData: Record<string, RoleData> = {
  frontend_specialist: {
    id: 'frontend_specialist',
    title: 'Frontend Specialist',
    icon: <IconCode size={24} />,
    description: 'Build responsive, accessible, and performant user interfaces using React and Next.js.',
    longDescription: 'As a Frontend Specialist, you will be responsible for creating beautiful, responsive, and accessible user interfaces that provide an exceptional user experience. You will work closely with designers to implement UI components based on design specifications and collaborate with backend developers to integrate with APIs.',
    requirements: [
      'Strong proficiency in React and Next.js',
      'Experience with modern CSS (Tailwind CSS preferred)',
      'Understanding of web accessibility standards',
      'Knowledge of frontend performance optimization techniques',
      'Experience with frontend testing frameworks (Jest, React Testing Library)',
      'Familiarity with version control systems (Git)'
    ],
    tasks: [
      {
        title: 'Implement Responsive Dashboard Component',
        description: 'Create a responsive dashboard component that displays key metrics and statistics.',
        difficulty: 'beginner',
        compensation: 100,
        skills: ['React', 'Tailwind CSS', 'Responsive Design'],
        instructions: 'Create a dashboard component that displays key metrics in a responsive grid layout. The component should adapt to different screen sizes and include interactive elements such as filters and sorting options.'
      },
      {
        title: 'Build Form Validation System',
        description: 'Implement a robust form validation system with real-time feedback.',
        difficulty: 'intermediate',
        compensation: 250,
        skills: ['React', 'Form Validation', 'User Experience'],
        instructions: 'Develop a form validation system that provides real-time feedback to users as they fill out forms. The system should handle various validation rules, display appropriate error messages, and support custom validation logic.'
      },
      {
        title: 'Create Accessible Component Library',
        description: 'Build a library of accessible UI components following WCAG guidelines.',
        difficulty: 'advanced',
        compensation: 500,
        skills: ['React', 'Accessibility', 'Component Design'],
        instructions: 'Design and implement a library of reusable UI components that follow WCAG accessibility guidelines. The library should include components such as buttons, form elements, modals, and navigation elements, all with proper accessibility attributes and keyboard navigation support.'
      }
    ],
    resources: [
      {
        title: 'Next.js Documentation',
        url: 'https://nextjs.org/docs',
        description: 'Official documentation for Next.js framework'
      },
      {
        title: 'React Documentation',
        url: 'https://reactjs.org/docs/getting-started.html',
        description: 'Official documentation for React library'
      },
      {
        title: 'Tailwind CSS Documentation',
        url: 'https://tailwindcss.com/docs',
        description: 'Official documentation for Tailwind CSS'
      },
      {
        title: 'Web Accessibility Initiative (WAI)',
        url: 'https://www.w3.org/WAI/',
        description: 'Resources for web accessibility standards and best practices'
      }
    ]
  },
  backend_specialist: {
    id: 'backend_specialist',
    title: 'Backend Specialist',
    icon: <IconServer size={24} />,
    description: 'Develop robust and scalable backend services using Node.js, Express, and Prisma.',
    longDescription: 'As a Backend Specialist, you will design and implement server-side logic, define and maintain databases, and ensure high performance and responsiveness to requests from the front-end. You will be responsible for integrating the front-end elements built by your co-workers into the application.',
    requirements: [
      'Strong proficiency in Node.js and Express',
      'Experience with Prisma ORM and database design',
      'Knowledge of RESTful API design principles',
      'Understanding of authentication and authorization mechanisms',
      'Experience with backend testing frameworks',
      'Familiarity with version control systems (Git)'
    ],
    tasks: [
      {
        title: 'Implement User Authentication API',
        description: 'Create a secure user authentication API with JWT tokens.',
        difficulty: 'beginner',
        compensation: 100,
        skills: ['Node.js', 'Express', 'JWT', 'Authentication'],
        instructions: 'Develop a user authentication API that includes endpoints for registration, login, password reset, and token refresh. The API should use JWT tokens for authentication and implement proper security measures.'
      },
      {
        title: 'Build Data Processing Pipeline',
        description: 'Create a data processing pipeline for handling large datasets.',
        difficulty: 'intermediate',
        compensation: 250,
        skills: ['Node.js', 'Data Processing', 'Performance Optimization'],
        instructions: 'Design and implement a data processing pipeline that can efficiently handle large datasets. The pipeline should include stages for data validation, transformation, and storage, with proper error handling and logging.'
      },
      {
        title: 'Develop Microservice Architecture',
        description: 'Design and implement a microservice architecture for a scalable application.',
        difficulty: 'advanced',
        compensation: 500,
        skills: ['Node.js', 'Microservices', 'System Design'],
        instructions: 'Create a microservice architecture for a scalable application. The architecture should include service discovery, load balancing, and inter-service communication mechanisms. Implement at least three microservices that work together to provide a complete feature.'
      }
    ],
    resources: [
      {
        title: 'Node.js Documentation',
        url: 'https://nodejs.org/en/docs/',
        description: 'Official documentation for Node.js'
      },
      {
        title: 'Express Documentation',
        url: 'https://expressjs.com/',
        description: 'Official documentation for Express framework'
      },
      {
        title: 'Prisma Documentation',
        url: 'https://www.prisma.io/docs/',
        description: 'Official documentation for Prisma ORM'
      },
      {
        title: 'REST API Design Best Practices',
        url: 'https://restfulapi.net/',
        description: 'Best practices for designing RESTful APIs'
      }
    ]
  },
  integration_specialist: {
    id: 'integration_specialist',
    title: 'Integration Specialist',
    icon: <IconPlugConnected size={24} />,
    description: 'Connect different systems and services to create seamless workflows.',
    longDescription: 'As an Integration Specialist, you will be responsible for connecting different systems and services to create seamless workflows. You will design and implement integrations between our platform and third-party services, ensuring data consistency and reliability across all integrated systems.',
    requirements: [
      'Experience with API integration and development',
      'Knowledge of data transformation techniques',
      'Understanding of webhook implementations and event-driven architectures',
      'Familiarity with authentication methods for third-party services',
      'Experience with error handling and retry mechanisms',
      'Strong problem-solving skills'
    ],
    tasks: [
      {
        title: 'Implement Payment Gateway Integration',
        description: 'Integrate a payment gateway service into the application.',
        difficulty: 'beginner',
        compensation: 100,
        skills: ['API Integration', 'Payment Processing', 'Security'],
        instructions: 'Integrate a payment gateway service (such as Stripe or PayPal) into the application. The integration should handle payment processing, webhooks for payment events, and proper error handling.'
      },
      {
        title: 'Build OAuth Authentication System',
        description: 'Implement OAuth authentication with multiple providers.',
        difficulty: 'intermediate',
        compensation: 250,
        skills: ['OAuth', 'Authentication', 'Security'],
        instructions: 'Create an OAuth authentication system that supports multiple providers (Google, GitHub, etc.). The system should handle the OAuth flow, user profile retrieval, and account linking.'
      },
      {
        title: 'Develop Event-Driven Integration Hub',
        description: 'Create a central hub for managing integrations with multiple services.',
        difficulty: 'advanced',
        compensation: 500,
        skills: ['Event-Driven Architecture', 'System Integration', 'Scalability'],
        instructions: 'Design and implement an event-driven integration hub that can manage connections with multiple third-party services. The hub should handle event routing, transformation, and delivery, with support for retries and error handling.'
      }
    ],
    resources: [
      {
        title: 'API Design Guide',
        url: 'https://cloud.google.com/apis/design',
        description: 'Google\'s API design guide with best practices'
      },
      {
        title: 'OAuth 2.0 Documentation',
        url: 'https://oauth.net/2/',
        description: 'Documentation and resources for OAuth 2.0'
      },
      {
        title: 'Webhook vs API: Understanding the Difference',
        url: 'https://zapier.com/blog/webhook-vs-api/',
        description: 'Article explaining the differences between webhooks and APIs'
      },
      {
        title: 'Event-Driven Architecture',
        url: 'https://martinfowler.com/articles/201701-event-driven.html',
        description: 'Martin Fowler\'s article on event-driven architecture'
      }
    ]
  },
  devops_engineer: {
    id: 'devops_engineer',
    title: 'DevOps Engineer',
    icon: <IconCloud size={24} />,
    description: 'Build and maintain infrastructure, CI/CD pipelines, and deployment processes.',
    longDescription: 'As a DevOps Engineer, you will be responsible for building and maintaining the infrastructure, CI/CD pipelines, and deployment processes that support our applications. You will work to improve development efficiency, application performance, and system reliability through automation and best practices.',
    requirements: [
      'Experience with cloud platforms (AWS, Azure, or GCP)',
      'Knowledge of infrastructure as code (Terraform, CloudFormation)',
      'Understanding of CI/CD pipelines and tools (GitHub Actions, Jenkins)',
      'Familiarity with containerization (Docker, Kubernetes)',
      'Experience with monitoring and logging solutions',
      'Knowledge of security best practices'
    ],
    tasks: [
      {
        title: 'Set Up CI/CD Pipeline',
        description: 'Create a CI/CD pipeline for automated testing and deployment.',
        difficulty: 'beginner',
        compensation: 100,
        skills: ['GitHub Actions', 'CI/CD', 'Automation'],
        instructions: 'Set up a CI/CD pipeline using GitHub Actions that automatically runs tests, builds the application, and deploys it to a staging environment. The pipeline should include proper error handling and notifications.'
      },
      {
        title: 'Implement Infrastructure as Code',
        description: 'Create infrastructure as code for provisioning cloud resources.',
        difficulty: 'intermediate',
        compensation: 250,
        skills: ['Terraform', 'AWS', 'Infrastructure as Code'],
        instructions: 'Develop infrastructure as code using Terraform to provision and manage cloud resources on AWS. The code should create a complete environment for running the application, including networking, compute, and database resources.'
      },
      {
        title: 'Build Kubernetes Deployment',
        description: 'Create a Kubernetes deployment for a microservice architecture.',
        difficulty: 'advanced',
        compensation: 500,
        skills: ['Kubernetes', 'Docker', 'Microservices'],
        instructions: 'Design and implement a Kubernetes deployment for a microservice architecture. The deployment should include service discovery, load balancing, scaling, and monitoring components.'
      }
    ],
    resources: [
      {
        title: 'GitHub Actions Documentation',
        url: 'https://docs.github.com/en/actions',
        description: 'Official documentation for GitHub Actions'
      },
      {
        title: 'Terraform Documentation',
        url: 'https://www.terraform.io/docs',
        description: 'Official documentation for Terraform'
      },
      {
        title: 'Kubernetes Documentation',
        url: 'https://kubernetes.io/docs/home/',
        description: 'Official documentation for Kubernetes'
      },
      {
        title: 'AWS Documentation',
        url: 'https://docs.aws.amazon.com/',
        description: 'Official documentation for Amazon Web Services'
      }
    ]
  },
  fullstack_developer: {
    id: 'fullstack_developer',
    title: 'Fullstack Developer',
    icon: <IconStack size={24} />,
    description: 'Work across the entire stack to deliver complete features and functionality.',
    longDescription: 'As a Fullstack Developer, you will work across the entire stack to deliver complete features and functionality. You will be responsible for developing both client-side and server-side logic, ensuring high performance and responsiveness to requests from the front-end, and integrating with the required services and databases.',
    requirements: [
      'Strong proficiency in frontend technologies (React, Next.js)',
      'Experience with backend development (Node.js, Express)',
      'Knowledge of database design and ORM tools (Prisma)',
      'Understanding of web security principles',
      'Experience with testing across the stack',
      'Familiarity with version control systems (Git)'
    ],
    tasks: [
      {
        title: 'Build User Profile Management System',
        description: 'Create a complete user profile management system with frontend and backend components.',
        difficulty: 'beginner',
        compensation: 100,
        skills: ['React', 'Node.js', 'Prisma', 'Full Stack'],
        instructions: 'Develop a user profile management system that includes frontend components for displaying and editing user information, and backend APIs for storing and retrieving user data. The system should handle profile pictures, user preferences, and account settings.'
      },
      {
        title: 'Implement Real-Time Notification System',
        description: 'Create a real-time notification system using WebSockets.',
        difficulty: 'intermediate',
        compensation: 250,
        skills: ['WebSockets', 'React', 'Node.js', 'Real-Time'],
        instructions: 'Build a real-time notification system using WebSockets that can deliver instant notifications to users. The system should include frontend components for displaying notifications and backend services for generating and sending notifications.'
      },
      {
        title: 'Develop Multi-Tenant SaaS Platform',
        description: 'Create a multi-tenant SaaS platform with isolated data and customizable features.',
        difficulty: 'advanced',
        compensation: 500,
        skills: ['System Design', 'Multi-Tenancy', 'Security', 'Full Stack'],
        instructions: 'Design and implement a multi-tenant SaaS platform that supports isolated data for each tenant and customizable features. The platform should include user management, tenant management, and feature configuration components.'
      }
    ],
    resources: [
      {
        title: 'Next.js Documentation',
        url: 'https://nextjs.org/docs',
        description: 'Official documentation for Next.js framework'
      },
      {
        title: 'Node.js Documentation',
        url: 'https://nodejs.org/en/docs/',
        description: 'Official documentation for Node.js'
      },
      {
        title: 'Prisma Documentation',
        url: 'https://www.prisma.io/docs/',
        description: 'Official documentation for Prisma ORM'
      },
      {
        title: 'Full Stack Open',
        url: 'https://fullstackopen.com/en/',
        description: 'Free online course on modern web development'
      }
    ]
  }
};

export default function RoleInstructionsPage({ params }: { params: { roleId: string } }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'resources'>('overview');
  const roleId = params.roleId;
  const roleData = rolesData[roleId];

  if (!roleData) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
              Role Not Found
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-300 sm:mt-4">
              The specified role does not exist. Please select a valid role from the instructions page.
            </p>
            <div className="mt-8">
              <Link 
                href="/developer/instructions"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <IconChevronLeft size={16} className="mr-2" />
                Back to Instructions
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-900/70 text-green-200 border border-green-500/30';
      case 'intermediate':
        return 'bg-yellow-900/70 text-yellow-200 border border-yellow-500/30';
      case 'advanced':
        return 'bg-red-900/70 text-red-200 border border-red-500/30';
      default:
        return 'bg-gray-900/70 text-gray-200 border border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/developer/instructions"
            className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300"
          >
            <IconChevronLeft size={16} className="mr-1" />
            Back to All Instructions
          </Link>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 mb-8">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-900/50 rounded-md p-3">
                {roleData.icon}
              </div>
              <h1 className="ml-4 text-2xl font-bold text-white">{roleData.title}</h1>
            </div>
            <p className="mt-4 text-gray-300">
              {roleData.description}
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
          <div className="border-b border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'text-indigo-400 border-b-2 border-indigo-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'tasks'
                    ? 'text-indigo-400 border-b-2 border-indigo-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'resources'
                    ? 'text-indigo-400 border-b-2 border-indigo-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Resources
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Role Overview</h2>
                <p className="text-gray-300 mb-6">
                  {roleData.longDescription}
                </p>

                <h3 className="text-lg font-medium text-white mb-3">Requirements</h3>
                <ul className="space-y-2 mb-6">
                  {roleData.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start text-gray-300">
                      <span className="flex-shrink-0 text-indigo-500 mr-2">•</span>
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <h3 className="text-lg font-medium text-white mb-3">Getting Started</h3>
                  <p className="text-gray-300 mb-4">
                    To get started as a {roleData.title}, follow these steps:
                  </p>
                  <ol className="space-y-4">
                    <li className="flex">
                      <span className="flex-shrink-0 bg-indigo-900/50 rounded-full h-8 w-8 flex items-center justify-center mr-3 text-indigo-400 font-medium">1</span>
                      <div>
                        <h4 className="font-medium text-white">Review the Tasks</h4>
                        <p className="mt-1 text-gray-300">Browse the available tasks for your role and select one that matches your skill level.</p>
                      </div>
                    </li>
                    <li className="flex">
                      <span className="flex-shrink-0 bg-indigo-900/50 rounded-full h-8 w-8 flex items-center justify-center mr-3 text-indigo-400 font-medium">2</span>
                      <div>
                        <h4 className="font-medium text-white">Set Up Your Development Environment</h4>
                        <p className="mt-1 text-gray-300">Make sure you have all the necessary tools and dependencies installed.</p>
                      </div>
                    </li>
                    <li className="flex">
                      <span className="flex-shrink-0 bg-indigo-900/50 rounded-full h-8 w-8 flex items-center justify-center mr-3 text-indigo-400 font-medium">3</span>
                      <div>
                        <h4 className="font-medium text-white">Complete Your First Task</h4>
                        <p className="mt-1 text-gray-300">Work on your selected task, following the provided instructions and requirements.</p>
                      </div>
                    </li>
                    <li className="flex">
                      <span className="flex-shrink-0 bg-indigo-900/50 rounded-full h-8 w-8 flex items-center justify-center mr-3 text-indigo-400 font-medium">4</span>
                      <div>
                        <h4 className="font-medium text-white">Submit Your Work</h4>
                        <p className="mt-1 text-gray-300">Submit your completed work through the task interface for review and feedback.</p>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Available Tasks</h2>
                <p className="text-gray-300 mb-6">
                  Select a task that matches your skill level and interests. Tasks are categorized by difficulty and include compensation information.
                </p>

                <div className="space-y-6">
                  {roleData.tasks.map((task, index) => (
                    <div key={index} className="bg-gray-700/50 rounded-lg p-5 border border-gray-600">
                      <div className="flex flex-wrap items-start justify-between mb-3">
                        <h3 className="text-lg font-medium text-white">{task.title}</h3>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                          {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}
                        </div>
                      </div>
                      <p className="text-gray-300 mb-4">{task.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {task.skills.map((skill, skillIndex) => (
                          <span key={skillIndex} className="bg-gray-800 text-gray-300 px-2 py-1 rounded-md text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <IconFileCode size={18} className="text-indigo-400 mr-2" />
                          <span className="text-gray-300 text-sm">Instructions available</span>
                        </div>
                        <div className="text-indigo-300 font-medium">${task.compensation}</div>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link 
                          href={`/developer/tasks?filter=${task.title}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          View Task
                          <IconArrowRight size={16} className="ml-2" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'resources' && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Learning Resources</h2>
                <p className="text-gray-300 mb-6">
                  Here are some helpful resources to enhance your skills and knowledge as a {roleData.title}.
                </p>

                <div className="space-y-4">
                  {roleData.resources.map((resource, index) => (
                    <a 
                      key={index} 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-indigo-500 transition-all duration-300"
                    >
                      <h3 className="text-lg font-medium text-white mb-1">{resource.title}</h3>
                      <p className="text-gray-300 mb-2">{resource.description}</p>
                      <div className="flex items-center text-indigo-400 text-sm">
                        <span>Visit resource</span>
                        <IconArrowRight size={14} className="ml-1" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 