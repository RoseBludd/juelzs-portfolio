import { 
  IconCode, 
  IconServer, 
  IconPlugConnected, 
  IconCloud, 
  IconStack, 
  IconChevronRight,
  IconBrandGithub
} from '@tabler/icons-react';
import Link from 'next/link';
import React from 'react';

export default function DeveloperInstructionsPage() {
  // Define the different developer roles and their specific instructions
  const roles = [
    {
      id: 'frontend_specialist',
      title: 'Frontend Specialist',
      icon: <IconCode size={24} />,
      description: 'Build responsive, accessible, and performant user interfaces using React and Next.js.',
      tasks: [
        'Implement UI components based on design specifications',
        'Optimize frontend performance and accessibility',
        'Integrate with backend APIs',
        'Write unit and integration tests for UI components'
      ]
    },
    {
      id: 'backend_specialist',
      title: 'Backend Specialist',
      icon: <IconServer size={24} />,
      description: 'Develop robust and scalable backend services using Node.js, Express, and Prisma.',
      tasks: [
        'Design and implement RESTful APIs',
        'Optimize database queries and performance',
        'Implement authentication and authorization',
        'Write unit and integration tests for backend services'
      ]
    },
    {
      id: 'integration_specialist',
      title: 'Integration Specialist',
      icon: <IconPlugConnected size={24} />,
      description: 'Connect different systems and services to create seamless workflows.',
      tasks: [
        'Implement API integrations with third-party services',
        'Create data transformation pipelines',
        'Develop webhook handlers and event-driven architectures',
        'Ensure data consistency across integrated systems'
      ]
    },
    {
      id: 'devops_engineer',
      title: 'DevOps Engineer',
      icon: <IconCloud size={24} />,
      description: 'Build and maintain infrastructure, CI/CD pipelines, and deployment processes.',
      tasks: [
        'Set up and maintain CI/CD pipelines',
        'Configure and manage cloud infrastructure',
        'Implement monitoring and logging solutions',
        'Optimize application performance and reliability'
      ]
    },
    {
      id: 'fullstack_developer',
      title: 'Fullstack Developer',
      icon: <IconStack size={24} />,
      description: 'Work across the entire stack to deliver complete features and functionality.',
      tasks: [
        'Develop end-to-end features from UI to database',
        'Optimize performance across the entire stack',
        'Implement security best practices',
        'Write comprehensive tests for all components'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            Developer Instructions
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-300 sm:mt-4">
            Welcome to our developer portal. Select your role below to view specific instructions and tasks.
          </p>
        </div>

        <div className="mt-10 space-y-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <div 
                key={role.id}
                className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 hover:border-indigo-500 transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-indigo-900/50 rounded-md p-3">
                      {role.icon}
                    </div>
                    <h3 className="ml-4 text-xl font-medium text-white">{role.title}</h3>
                  </div>
                  <p className="mt-4 text-gray-300">
                    {role.description}
                  </p>
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-indigo-400 uppercase tracking-wide">Key Tasks</h4>
                    <ul className="mt-2 space-y-2">
                      {role.tasks.map((task, index) => (
                        <li key={index} className="flex items-start">
                          <span className="flex-shrink-0 text-indigo-500 mr-2">•</span>
                          <span className="text-gray-300">{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-6">
                    <Link 
                      href={`/developer/instructions/${role.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      View Detailed Instructions
                      <IconChevronRight size={16} className="ml-2" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white">Getting Started</h2>
            <p className="mt-4 text-gray-300">
              To begin working on tasks, follow these steps:
            </p>
            <ol className="mt-4 space-y-4 text-gray-300">
              <li className="flex">
                <span className="flex-shrink-0 bg-indigo-900/50 rounded-full h-8 w-8 flex items-center justify-center mr-3 text-indigo-400 font-medium">1</span>
                <div>
                  <h3 className="font-medium text-white">Review Role-Specific Instructions</h3>
                  <p className="mt-1">Select your role above and review the detailed instructions for your position.</p>
                </div>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 bg-indigo-900/50 rounded-full h-8 w-8 flex items-center justify-center mr-3 text-indigo-400 font-medium">2</span>
                <div>
                  <h3 className="font-medium text-white">Browse Available Tasks</h3>
                  <p className="mt-1">Visit the <Link href="/developer/tasks" className="text-indigo-400 hover:text-indigo-300">Tasks page</Link> to see available tasks filtered for your progression level.</p>
                </div>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 bg-indigo-900/50 rounded-full h-8 w-8 flex items-center justify-center mr-3 text-indigo-400 font-medium">3</span>
                <div>
                  <h3 className="font-medium text-white">Complete Your First Task</h3>
                  <p className="mt-1">Select a task, review the requirements, and complete the milestones to progress.</p>
                </div>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 bg-indigo-900/50 rounded-full h-8 w-8 flex items-center justify-center mr-3 text-indigo-400 font-medium">4</span>
                <div>
                  <h3 className="font-medium text-white">Submit Your Work</h3>
                  <p className="mt-1">Submit your completed work directly through the task interface for review.</p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400">
            Need help? Contact us at <a href="mailto:support@example.com" className="text-indigo-400 hover:text-indigo-300">support@example.com</a>
          </p>
        </div>
      </div>
    </div>
  );
} 