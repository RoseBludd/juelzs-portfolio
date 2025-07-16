import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PortfolioService from '@/services/portfolio.service';
import Image from 'next/image';

export default async function Home() {
  const portfolioService = PortfolioService.getInstance();
  const featuredProjects = await portfolioService.getFeatureProjects();
  const latestVideos = await portfolioService.getLeadershipVideosWithAnalysis();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-20 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            {/* Profile Image */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden border-4 border-blue-500/30 shadow-2xl ring-4 ring-blue-500/20">
                  <Image
                    src="/profile-logo.png"
                    alt="Juelzs - AI Systems Architect & Technical Product Director"
                    width={192}
                    height={192}
                    className="w-full h-full object-cover object-center scale-125"
                  />
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 blur-xl -z-10"></div>
              </div>
            </div>
            
            <div className="mb-6">
              <span className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
                Creator of Prompt-Led Flow Architecture
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6">
              AI Systems Architect &{' '}
              <span className="gradient-text">Technical Product Director</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8 max-w-4xl mx-auto">
              I don&apos;t just build features—I build the <span className="text-blue-400 font-semibold">systems that build features</span>, 
              <span className="text-purple-400 font-semibold"> train themselves</span>, and 
              <span className="text-green-400 font-semibold"> evolve with the team</span>. 
              Creator of <strong>Prompt-Led Flow Architecture</strong> and the <strong>CADIS</strong> intelligence system.
            </p>
            
            {/* Core Philosophy Quote */}
            <blockquote className="text-lg italic text-gray-300 mb-12 max-w-3xl mx-auto border-l-4 border-blue-500 pl-6">
              &quot;If it needs to be done, do it. If it&apos;s done, make it modular. If it&apos;s modular, make it reusable. If it&apos;s reusable, make it teachable.&quot;
            </blockquote>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button href="/projects" size="lg" className="w-full sm:w-auto">
                View 24+ Production Systems
              </Button>
              <Button href="/philosophy" variant="outline" size="lg" className="w-full sm:w-auto">
                Learn My Architecture
              </Button>
                              <Button href="/contact" variant="ghost" size="lg" className="w-full sm:w-auto">
                  Let&apos;s Build Together
                </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-gray-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                From Sales Rep to <span className="gradient-text">Systems Architect</span>
              </h2>
                             <div className="space-y-4 text-gray-300">
                 <p>
                   I didn&apos;t start as a software architect. I started as a <strong>survivor</strong> — someone who had to figure it out, or lose.
                   Starting as a sales rep at RestoreMasters, I built my own CRM in 10 days and pitched leadership to let me build their internal systems.
                 </p>
                 <p>
                   After running my own marketing agency for 8 years, every client wasn&apos;t just a project — they were a puzzle. 
                   When no one could connect the dots across sales, data, automation, and systems — I became the person who could. 
                   That instinct followed me into RestoreMasters, where that leap turned into a new role: <strong>Lead Systems Architect</strong>.
                 </p>
                 <p>
                   Now I&apos;m the visionary behind <strong>Vibezs.io</strong> and its first white-labeled vertical SaaS, <strong>BuildFlow</strong>. 
                   I&apos;ve created <strong>CADIS</strong> — my sovereign intelligence layer that serves as the cognitive framework for how systems teach themselves.
                 </p>
               </div>
            </div>
            
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-white">What I Do Now</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-blue-400 rounded-full mr-3"></span>
                    <span className="text-gray-300">AI Systems Architect</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-purple-400 rounded-full mr-3"></span>
                    <span className="text-gray-300">Technical Product Director</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-green-400 rounded-full mr-3"></span>
                    <span className="text-gray-300">Full-Stack Team Lead</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-orange-400 rounded-full mr-3"></span>
                    <span className="text-gray-300">Platform Founder & Builder</span>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Current Focus</h3>
                <div className="space-y-2 text-gray-300 text-sm">
                  <p>• <strong>Vibezs.io</strong> - Modular AI-powered platform</p>
                  <p>• <strong>BuildFlow</strong> - White-label SaaS for contractors</p>
                  <p>• <strong>CADIS</strong> - Living thought architecture system</p>
                  <p>• <strong>Team Development</strong> - Progressive enablement coaching</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Systems */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Featured <span className="gradient-text">Systems</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Intelligent architectures that demonstrate my approach to building systems that think
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProjects.map((project) => (
              <Card key={project.id} hover className="h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
                      {project.category.toUpperCase()}
                    </span>
                    <div className="flex space-x-2">
                      {project.githubUrl && (
                        <Button href={project.githubUrl} variant="ghost" size="sm" target="_blank">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2 text-white">{project.title}</h3>
                  <p className="text-gray-400 mb-4 flex-grow">{project.description}</p>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Role:</h4>
                    <p className="text-sm text-gray-400">{project.role}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Key Decisions:</h4>
                    <ul className="text-sm text-gray-400 space-y-1">
                      {project.uniqueDecisions.slice(0, 2).map((decision, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          {decision}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {project.techStack.slice(0, 3).map((tech) => (
                      <span key={tech} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                    {project.techStack.length > 3 && (
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                        +{project.techStack.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button href="/systems" variant="outline" size="lg">
              View All Systems
            </Button>
          </div>
        </div>
      </section>

      {/* Real Projects */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Production <span className="gradient-text">Systems</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Real applications powering RestoreMasters LLC business operations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Callers App */}
            <Card hover className="h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
                    AI & AUTOMATION
                  </span>
                  <span className="text-2xl">🤖</span>
                </div>
                
                <h3 className="text-xl font-semibold mb-2 text-white">AI Callers App</h3>
                <p className="text-gray-400 mb-4 flex-grow">
                  AI-powered calling system reducing manual calling workload by 80% through intelligent conversation flows and automated lead qualification.
                </p>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Business Impact:</h4>
                  <p className="text-sm text-gray-400">Automated outreach following storms with real-time analytics</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-auto">
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                    TypeScript 86%
                  </span>
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                    PowerShell 12%
                  </span>
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                    Private
                  </span>
                </div>
              </div>
            </Card>

            {/* Voice Personas Studio */}
            <Card hover className="h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
                    AI & ML
                  </span>
                  <span className="text-2xl">🎭</span>
                </div>
                
                <h3 className="text-xl font-semibold mb-2 text-white">Voice Personas Studio</h3>
                <p className="text-gray-400 mb-4 flex-grow">
                  Production-ready voice cloning platform with advanced learning algorithms and real-time quality optimization for personalized customer interactions.
                </p>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Technical Highlights:</h4>
                  <p className="text-sm text-gray-400">Voice cloning with quality monitoring and optimization</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-auto">
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                    TypeScript 97%
                  </span>
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                    JavaScript 3%
                  </span>
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                    Private
                  </span>
                </div>
              </div>
            </Card>

            {/* Resto Inspect */}
            <Card hover className="h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium">
                    MOBILE APP
                  </span>
                  <span className="text-2xl">📱</span>
                </div>
                
                <h3 className="text-xl font-semibold mb-2 text-white">Resto Inspect</h3>
                <p className="text-gray-400 mb-4 flex-grow">
                  Mobile-first property inspection platform increasing field efficiency by 60% with offline-first architecture and GPS integration.
                </p>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Architecture:</h4>
                  <p className="text-sm text-gray-400">Offline sync, GPS workflows, camera capture with quality assessment</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-auto">
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                    TypeScript 93%
                  </span>
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                    CSS 7%
                  </span>
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                    Private
                  </span>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="text-center mt-12">
            <Button href="/projects" variant="outline" size="lg">
              View All Projects
            </Button>
          </div>
        </div>
      </section>

      {/* Leadership Preview */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            {/* Profile context for videos */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500/50">
                <Image
                  src="/profile-logo.png"
                  alt="Juelzs in leadership videos"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover object-center scale-125"
                />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Leadership in <span className="gradient-text">Action</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Watch how I coach teams, review architecture, and guide technical decisions
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {latestVideos.slice(0, 2).map((video) => (
              <Card key={video.id} className="h-full">
                <div className="flex flex-col h-full">
                  <div className="aspect-video bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm font-medium">{video.title}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {video.keyMoments.length > 0 ? `${video.keyMoments.length} key moments analyzed` : video.duration}
                      </p>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2 text-white">{video.title}</h3>
                  <p className="text-gray-400 mb-4 flex-grow">{video.description}</p>
                  
                  {/* AI Analysis Preview */}
                  {video.analysis && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">AI Leadership Rating:</h4>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400">Overall Performance</span>
                          <span className={`font-bold ${
                            video.analysis.overallRating >= 8 ? 'text-green-400' :
                            video.analysis.overallRating >= 6 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {video.analysis.overallRating}/10
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Technical:</span>
                            <span className="text-blue-400">{video.analysis.leadershipQualities.technicalGuidance}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Clarity:</span>
                            <span className="text-green-400">{video.analysis.communicationStyle.clarity}/10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Key Moments:</h4>
                    <ul className="text-sm text-gray-400 space-y-1">
                      {video.keyMoments.slice(0, 2).map((moment, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-400 mr-2 font-mono">{moment.timestamp}</span>
                          <span>{moment.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {video.keyMoments.slice(0, 3).map((moment) => (
                      <span key={moment.timestamp} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                        {moment.type}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button href="/leadership" variant="outline" size="lg">
              Watch All Videos
            </Button>
          </div>
        </div>
      </section>

      {/* Philosophy Teaser */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-gray-800/50">
        <div className="max-w-5xl mx-auto text-center">
          {/* Profile context for philosophy */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500/50 shadow-lg">
              <Image
                src="/profile-logo.png"
                alt="Juelzs' Philosophy"
                width={80}
                height={80}
                className="w-full h-full object-cover object-center scale-125"
              />
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            My <span className="gradient-text">Philosophy</span>
          </h2>
          <div className="mb-8">
            <span className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium mb-4 inline-block">
              Prompt-Led Flow Architecture
            </span>
          </div>
          <blockquote className="text-xl text-gray-300 mb-8 italic">
            &quot;If it needs to be done, do it. If it&apos;s done, make it modular. If it&apos;s modular, make it reusable. If it&apos;s reusable, make it teachable.&quot;
          </blockquote>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="text-center" padding="lg">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-400 text-xl">🤖</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Assisted Development</h3>
              <p className="text-sm text-gray-400">
                Prompts become living blueprints that evolve with the system
              </p>
            </Card>
            
            <Card className="text-center" padding="lg">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-400 text-xl">🧩</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Modular Architecture</h3>
              <p className="text-sm text-gray-400">
                Components that snap together to form intelligent systems
              </p>
            </Card>
            
            <Card className="text-center" padding="lg">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-green-400 text-xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Just-in-Time Enhancement</h3>
              <p className="text-sm text-gray-400">
                Infrastructure evolves as needed, not pre-planned
              </p>
            </Card>
            
            <Card className="text-center" padding="lg">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-400 text-xl">🧠</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">CADIS Intelligence</h3>
              <p className="text-sm text-gray-400">
                Living thought architecture that teaches itself
              </p>
            </Card>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">The 5-Step Execution Flow</h3>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-xs font-bold">1</span>
                <span className="text-gray-300">Build</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-xs font-bold">2</span>
                <span className="text-gray-300">Connect</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-xs font-bold">3</span>
                <span className="text-gray-300">Upgrade</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 text-xs font-bold">4</span>
                <span className="text-gray-300">Capture</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 text-xs font-bold">5</span>
                <span className="text-gray-300">Iterate</span>
              </div>
            </div>
          </div>
          
          <Button href="/philosophy" size="lg">
            Learn Prompt-Led Flow Architecture
          </Button>
        </div>
      </section>
    </div>
  );
}
