import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { VideoThumbnail } from '@/components/ui/VideoComponents';
import AnalysisToggle from '@/components/ui/AnalysisToggle';
import PortfolioService from '@/services/portfolio.service';
import Image from 'next/image';

export default async function Home() {
  const portfolioService = PortfolioService.getInstance();
  const featuredProjects = await portfolioService.getFeatureProjects();
  const latestVideos = await portfolioService.getLeadershipVideosWithAnalysis();

  // Sort videos by rating (highest first) and take top 2
  const sortedVideos = latestVideos
    .filter(video => video.analysis && video.analysis.overallRating)
    .sort((a, b) => (b.analysis?.overallRating || 0) - (a.analysis?.overallRating || 0))
    .slice(0, 2);

  // Define moment types for video thumbnails
  const momentTypes = [
    { type: 'architecture', label: 'Architecture Reviews', color: 'bg-blue-500/20 text-blue-300' },
    { type: 'leadership', label: 'Leadership Moments', color: 'bg-purple-500/20 text-purple-300' },
    { type: 'mentoring', label: 'Mentoring Sessions', color: 'bg-green-500/20 text-green-300' },
    { type: 'technical', label: 'Technical Discussions', color: 'bg-orange-500/20 text-orange-300' }
  ];

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
              Creator of <strong>Prompt-Led Flow Architecture</strong>, the <strong>CADIS</strong> intelligence system, and <strong>Vibezs.io</strong> - an AI-powered business platform builder.
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

      {/* Vibezs Platform Showcase */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-purple-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="mb-6">
              <span className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium">
                🚀 FLAGSHIP PLATFORM
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Introducing <span className="gradient-text">Vibezs.io</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-8">
              The revolutionary AI-powered business platform builder that transforms how businesses create custom solutions. 
              Built with <strong>CADIS intelligence</strong>, <strong>1,045+ real business widgets</strong>, and the <strong>Tower of Babel architecture</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Platform Features */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🧠</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-blue-300">CADIS AI Intelligence</h3>
                  <p className="text-gray-400">Context-aware AI that learns your business and generates intelligent recommendations with 92% accuracy.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🏗️</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-purple-300">Tower of Babel Architecture</h3>
                  <p className="text-gray-400">Revolutionary singleton pattern with multi-branch scaling - one root, unlimited specialized integrations.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🌟</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-green-300">DreamState Intelligence</h3>
                  <p className="text-gray-400">Advanced business simulation and modeling system that creates intelligent digital twins of business processes with predictive capabilities.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-orange-300">Progressive Enhancement</h3>
                  <p className="text-gray-400">Built following my core philosophy - start small, test thoroughly, fix issues, scale gradually.</p>
                </div>
              </div>
            </div>

            {/* Platform Stats & CTA */}
            <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">1,045+</div>
                  <div className="text-sm text-gray-400">Business Widgets</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">25</div>
                  <div className="text-sm text-gray-400">Live Repositories</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">92%</div>
                  <div className="text-sm text-gray-400">AI Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-400 mb-2">5</div>
                  <div className="text-sm text-gray-400">Design Variations</div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Experience the Future of Business Platforms</h3>
                <p className="text-gray-400 mb-6">
                  See how AI-powered architecture and real business intelligence come together to create production-ready systems in minutes, not months.
                </p>
                <div className="space-y-3">
                  <Button 
                    href="https://vibezs.io" 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    🚀 Launch Vibezs.io Platform
                  </Button>
                  <Button 
                    href="https://vibezs.io/dreamstate" 
                    variant="outline" 
                    size="lg" 
                    className="w-full"
                  >
                    🌟 Experience DreamState
                  </Button>
                </div>
              </div>
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
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-cyan-400 rounded-full mr-3"></span>
                    <span className="text-gray-300">Managing 10+ developers across multiple countries</span>
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

      {/* Vision Duplication Strategy */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              How I Scale My <span className="gradient-text">Vision</span>
            </h2>
                         <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
               I don&apos;t just assign tasks—I create complete blueprints. Every UI, every repository structure, 
               every architectural decision is my vision, then I guide developers to implement it perfectly.
             </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Strategy Explanation */}
            <div className="space-y-6">
              <Card className="p-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">The Vision-First Approach</h3>
                </div>
                
                                 <blockquote className="text-lg text-gray-300 italic border-l-4 border-blue-500 pl-6 mb-6">
                   &quot;When the company gives me a task, I don&apos;t delegate it—I architect it. 
                   I build the complete UI and repository structure first, then assign developers 
                   to implement my exact vision. This way, everything created is unquestionably 
                   my architectural thinking, scaled through the team.&quot;
                 </blockquote>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-sm font-bold mt-1">✓</span>
                    <div>
                      <p className="text-white font-medium">Complete Vision Creation</p>
                      <p className="text-gray-400 text-sm">I design the entire UI and repository structure before anyone writes code</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-sm font-bold mt-1">✓</span>
                    <div>
                      <p className="text-white font-medium">Guided Implementation</p>
                      <p className="text-gray-400 text-sm">Developers implement to match my exact architectural vision</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-sm font-bold mt-1">✓</span>
                    <div>
                      <p className="text-white font-medium">Modular & Reusable</p>
                      <p className="text-gray-400 text-sm">Everything flows into the registry as documented, reusable components</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-sm font-bold mt-1">✓</span>
                    <div>
                      <p className="text-white font-medium">Vision Duplication</p>
                                             <p className="text-gray-400 text-sm">I&apos;ve essentially duplicated myself multiple times through this process</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Visual Process Flow */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white text-center mb-8">The Duplication Process</h3>
              
              {/* Step 1 */}
              <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500/30">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-blue-400 font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Company Assigns Task</h4>
                    <p className="text-gray-400 text-sm">New business requirement comes in</p>
                  </div>
                </div>
              </Card>

              {/* Arrow */}
              <div className="flex justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>

              {/* Step 2 */}
              <Card className="p-6 bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-500/30">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <span className="text-purple-400 font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">I Architect Everything</h4>
                    <p className="text-gray-400 text-sm">Complete UI design + full repository structure</p>
                  </div>
                </div>
              </Card>

              {/* Arrow */}
              <div className="flex justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>

              {/* Step 3 */}
              <Card className="p-6 bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/30">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-green-400 font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Developer Implements Vision</h4>
                    <p className="text-gray-400 text-sm">Guided to match my exact architectural thinking</p>
                  </div>
                </div>
              </Card>

              {/* Arrow */}
              <div className="flex justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>

              {/* Result */}
              <Card className="p-6 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500/30">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <span className="text-orange-400">🚀</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Vision Multiplied</h4>
                    <p className="text-gray-400 text-sm">My architectural thinking, scaled through the team</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Results Grid */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-8 bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Team Scaling</h3>
              <p className="text-gray-400 mb-4">
                10+ developers across multiple countries, all implementing my architectural vision
              </p>
              <div className="text-2xl font-bold text-blue-400">10+</div>
              <div className="text-sm text-gray-500">Active Developers</div>
            </Card>

            <Card className="text-center p-8 bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📦</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Modular Registry</h3>
              <p className="text-gray-400 mb-4">
                Every component flows into the registry, creating a growing library of reusable architecture
              </p>
              <div className="text-2xl font-bold text-green-400">100%</div>
              <div className="text-sm text-gray-500">Modular Output</div>
            </Card>

            <Card className="text-center p-8 bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Vision Consistency</h3>
              <p className="text-gray-400 mb-4">
                Every system reflects my architectural thinking, creating consistency across all projects
              </p>
              <div className="text-2xl font-bold text-purple-400">25+</div>
              <div className="text-sm text-gray-500">Production Systems</div>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <h3 className="text-2xl font-bold text-white mb-4">
              Want to Learn This Approach?
            </h3>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              I can teach you how to scale your architectural vision through your team, 
              creating systems that consistently reflect your thinking and approach.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/leadership" size="lg">
                Watch My Coaching Videos
              </Button>
              <Button href="/contact?topic=vision-scaling" variant="outline" size="lg">
                Book Strategy Session
              </Button>
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
          
            {/* Moment Types for VideoThumbnail */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {sortedVideos.map((video) => (
                <Card key={video.id} className="h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
                  <div className="flex flex-col h-full">
                    {/* Enhanced Video Thumbnail */}
                    <VideoThumbnail video={video} />

                    {/* Video Info */}
                    <div className="flex-grow p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-grow">
                          <h3 className="text-lg font-bold text-white mb-2 leading-tight">{video.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{video.dateRecorded}</span>
                            <span>•</span>
                            <span>{video.duration}</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-4 leading-relaxed">{video.description}</p>

                      {/* AI Leadership Analysis Preview */}
                      {video.analysis && (
                        <AnalysisToggle analysis={video.analysis} />
                      )}

                      {/* Key Moments Summary */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-300">Key Moments</h4>
                          <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded">
                            {video.keyMoments.length} moments
                          </span>
                        </div>
                        
                        {/* Moment Type Tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {Array.from(new Set(video.keyMoments.map((m) => m.type))).map((type) => (
                            <span key={type} className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              momentTypes.find(t => t.type === type)?.color || 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-6 pt-0">
                      <div className="flex gap-3">
                        <Button href={`/leadership/${video.id}`} variant="primary" size="sm" className="flex-1">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                          Watch Video
                        </Button>
                        <Button href="/contact?topic=coaching" variant="outline" size="sm">
                          Book Session
                        </Button>
                      </div>
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
