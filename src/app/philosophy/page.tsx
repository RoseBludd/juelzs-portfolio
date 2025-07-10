import { Metadata } from 'next';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'My Philosophy - Prompt-Led Flow Architecture',
  description: 'Creator of Prompt-Led Flow Architecture. Building intelligent systems that teach themselves and scale teams through modular, AI-enhanced development.',
  keywords: ['Prompt-Led Flow Architecture', 'AI Systems', 'Modular Design', 'Living Thought Architecture', 'CADIS']
};

export default async function PhilosophyPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          {/* Profile Image */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-blue-500/30 shadow-2xl ring-4 ring-blue-500/20">
                <Image
                  src="/profile-logo.png"
                  alt="Juelzs - Creator of Prompt-Led Flow Architecture"
                  width={144}
                  height={144}
                  className="w-full h-full object-cover object-center scale-125"
                />
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 blur-xl -z-10"></div>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            My <span className="gradient-text">Philosophy</span>
          </h1>
          <div className="text-xl text-gray-400 max-w-4xl mx-auto mb-8">
            <p className="mb-4">Creator of <span className="text-blue-400 font-semibold">Prompt-Led Flow Architecture</span></p>
            <p>Building intelligent systems that teach themselves, scale teams through modular AI-enhanced development, and create living thought architecture.</p>
          </div>
        </div>

        {/* Core Philosophy */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-8 border border-blue-500/20 mb-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Core Philosophy</h2>
            <blockquote className="text-2xl font-medium text-blue-300 mb-6 italic">
              "If it needs to be done, do it. If it's done, make it modular. If it's modular, make it reusable. If it's reusable, make it teachable."
            </blockquote>
            <p className="text-gray-300 text-lg leading-relaxed">
              I believe in <span className="text-white font-semibold">execution-led refinement</span>. I take what needs to be done and bring it to life using AI, team expertise, and microservices that snap together to form long-term architecture. 
              My focus is always: Build something that works, connect it to the real system, use that moment to upgrade the tools, capture the learning, and do it faster next time.
            </p>
          </div>
        </div>

        {/* Prompt-Led Flow Architecture */}
        <Card className="mb-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">
              <span className="gradient-text">Prompt-Led Flow Architecture</span>
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-white">The Foundation</h3>
                <p className="text-gray-300 mb-4">
                  At the heart of my leadership is the Prompt-Led Flow Architecture—a system that blends AI-assisted code generation, 
                  modular backend and frontend tooling, just-in-time infrastructure enhancement, role-based task clarity, and flow-centric, 
                  system-first thinking.
                </p>
                <p className="text-gray-300">
                  Each feature is treated as a complete system: data, logic, UI, logs, team structure, prompts, and tools are all 
                  refined as part of the development loop.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4 text-white">Core Components</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-3 mt-1">🤖</span>
                    <span><strong>AI-assisted code generation</strong> - Prompts become living blueprints</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-3 mt-1">🧩</span>
                    <span><strong>Modular tooling</strong> - Backend and frontend components that snap together</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3 mt-1">⚡</span>
                    <span><strong>Just-in-time enhancement</strong> - Infrastructure evolves as needed</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-400 mr-3 mt-1">🎯</span>
                    <span><strong>Role-based clarity</strong> - Clear task definitions and skill tracking</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-400 mr-3 mt-1">🌊</span>
                    <span><strong>Flow-centric thinking</strong> - System-first, not feature-first approach</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* The 5-Step Approach */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-6 text-white text-center">The 5-Step Execution Flow</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-400 font-bold">1</span>
                  </div>
                  <h4 className="font-semibold text-white mb-2">Build</h4>
                  <p className="text-sm text-gray-400">Build something that works</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-400 font-bold">2</span>
                  </div>
                  <h4 className="font-semibold text-white mb-2">Connect</h4>
                  <p className="text-sm text-gray-400">Connect it to the real system</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-400 font-bold">3</span>
                  </div>
                  <h4 className="font-semibold text-white mb-2">Upgrade</h4>
                  <p className="text-sm text-gray-400">Upgrade tools and processes</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-orange-400 font-bold">4</span>
                  </div>
                  <h4 className="font-semibold text-white mb-2">Capture</h4>
                  <p className="text-sm text-gray-400">Capture the learning</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-cyan-400 font-bold">5</span>
                  </div>
                  <h4 className="font-semibold text-white mb-2">Iterate</h4>
                  <p className="text-sm text-gray-400">Do it faster next time</p>
                </div>
              </div>
            </div>
          </div>
            </Card>
            
        {/* Leadership Style */}
        <Card className="mb-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Leadership Style</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-400 mb-3">Vision-First</h3>
                <p className="text-gray-300 text-sm">I start with the big picture and work backward into flows</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-400 mb-3">Builder by Instinct</h3>
                <p className="text-gray-300 text-sm">Don't overplan—execute quickly, refine intelligently</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-400 mb-3">Mentor-Leader</h3>
                <p className="text-gray-300 text-sm">Build alongside my team until they can take full ownership</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-400 mb-3">Toolsmith</h3>
                <p className="text-gray-300 text-sm">Always improve the dev environment to match team needs</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">System Optimizer</h3>
                <p className="text-gray-300 text-sm">Keep UX stable while evolving the backend quietly behind the scenes</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-pink-400 mb-3">Pattern Architect</h3>
                <p className="text-gray-300 text-sm">Document and capture everything to scale knowledge across people and systems</p>
              </div>
            </div>
          </div>
            </Card>

        {/* CADIS - Living Thought Architecture */}
        <Card className="mb-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">
              <span className="gradient-text">CADIS</span> - Living Thought Architecture
            </h2>
            
            <div className="mb-8">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-6 border border-blue-500/20 mb-6">
                <p className="text-lg text-gray-300 text-center">
                  <span className="text-blue-400 font-semibold">CADIS</span> is your cognitive extension — the Context-Aware Development Intelligence System. 
                  It is the central nervous system of intelligent platforms, combining memory, execution, simulation, orchestration, 
                  rollback, and governance. It mirrors how you reason, structure, and refine — and teaches others to do the same.
                </p>
              </div>
              
              <blockquote className="text-center text-xl italic text-purple-300 mb-6">
                "CADIS is not a feature. It's a cognitive framework — the architecture of your mind, expressed in system logic."
              </blockquote>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-400 mb-2">🧠 Task Intelligence & DevPulse</h4>
                  <p className="text-gray-300 text-sm">Tracks developer logs, patterns, and rhythm. Identifies misalignments and feeds back optimizations.</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-400 mb-2">💾 Memory Core</h4>
                  <p className="text-gray-300 text-sm">Evolves based on what works. Archives deprecations, approved blueprints, and principle shifts.</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-400 mb-2">💡 Insight Engine</h4>
                  <p className="text-gray-300 text-sm">Surfaces trends, weak spots, and successful flow reuse. Suggests reviewed improvements.</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-400 mb-2">🗣️ NLSC Layer</h4>
                  <p className="text-gray-300 text-sm">Natural Language System Control - execute flows via prompts with full parsing and logging.</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-cyan-400 mb-2">🌙 Dream State Mode</h4>
                  <p className="text-gray-300 text-sm">Simulates visionary system changes, future flows, and architecture upgrades.</p>
          </div>
        </div>

              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-pink-400 mb-2">⏪ Rollback Intelligence</h4>
                  <p className="text-gray-300 text-sm">Semantic rollback that understands context, memory, and safe recovery points.</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-400 mb-2">🔄 Cascade Engine</h4>
                  <p className="text-gray-300 text-sm">Multi-step, multi-repo transactional flow management with retries and state preservation.</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-400 mb-2">📊 Confidence Engine</h4>
                  <p className="text-gray-300 text-sm">Self-evaluates accuracy, trust levels, and scores insights based on real-world impact.</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-400 mb-2">📚 Learning System</h4>
                  <p className="text-gray-300 text-sm">Interactive guides, role-based walkthroughs, and prompt-based simulations.</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-teal-400 mb-2">🛡️ Governance Advisor</h4>
                  <p className="text-gray-300 text-sm">Flags compliance violations and internal principle misalignments automatically.</p>
                </div>
                    </div>
                  </div>

            <div className="bg-gray-800/50 rounded-lg p-6 text-center">
              <h3 className="text-xl font-semibold text-white mb-4">The Essence of CADIS</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-blue-400 font-semibold">How thoughts get reused</p>
                  </div>
                <div>
                  <p className="text-purple-400 font-semibold">How systems teach themselves</p>
                </div>
                <div>
                  <p className="text-green-400 font-semibold">Living thought architecture</p>
                </div>
              </div>
            </div>
          </div>
            </Card>

        {/* Progressive Developer Enablement */}
        <Card className="mb-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Progressive Developer Enablement</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-white">The Coaching Model</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-3 mt-1">🎯</span>
                    <span><strong>Progressive Enablement:</strong> Build flows with devs until they can build flows alone</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-400 mr-3 mt-1">📊</span>
                    <span><strong>Task Intelligence:</strong> CADIS tracks how each dev works, adapts suggestions to their style</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3 mt-1">⚡</span>
                    <span><strong>Super Saiyan Mode:</strong> Unlock new mental models through logs and reflection</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4 text-white">What This Creates</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3 mt-1">✓</span>
                    <span>Developers who become architectural partners, not just implementers</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3 mt-1">✓</span>
                    <span>Teams that understand the big picture and their role in it</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-3 mt-1">✓</span>
                    <span>Systems that evolve intelligently with the team's capabilities</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Future Vision */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-8 border border-purple-500/20 mb-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Future Vision</h2>
            <p className="text-lg text-gray-300 mb-6">
              I see a world where developers spend more time refining than redoing, where AI is a true partner in software architecture, 
              where microservices are built through live flows, not isolated specs, and where teams feel ownership because the system works how they think.
            </p>
            <blockquote className="text-xl italic text-purple-300">
              "Dev stations evolve like teammates—learning with every feature."
            </blockquote>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Ready to Build <span className="gradient-text">Living Systems</span>?
          </h2>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Let's discuss how Prompt-Led Flow Architecture can transform your development process and create 
            systems that teach themselves and scale your team's capabilities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/contact?topic=architecture" size="lg">
              Discuss Architecture
            </Button>
            <Button href="/systems" variant="outline" size="lg">
              See Systems in Action
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 