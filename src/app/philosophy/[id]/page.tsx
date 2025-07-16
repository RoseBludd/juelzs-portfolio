import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PortfolioService from '@/services/portfolio.service';

interface PhilosophyDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PhilosophyDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const portfolioService = PortfolioService.getInstance();
  const article = await portfolioService.getPhilosophyById(id);
  
  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: `${article.title} - Philosophy`,
    description: article.content.substring(0, 160) + '...',
  };
}

export default async function PhilosophyDetailPage({ params }: PhilosophyDetailPageProps) {
  const { id } = await params;
  const portfolioService = PortfolioService.getInstance();
  const article = await portfolioService.getPhilosophyById(id);

  if (!article) {
    notFound();
  }

  const categories = [
    { id: 'ai-modularity', label: 'AI Modularity', color: 'bg-blue-500/20 text-blue-300' },
    { id: 'systems-design', label: 'Systems Design', color: 'bg-purple-500/20 text-purple-300' },
    { id: 'coaching', label: 'Team Coaching', color: 'bg-green-500/20 text-green-300' },
    { id: 'product-architecture', label: 'Product Architecture', color: 'bg-orange-500/20 text-orange-300' }
  ];

  const categoryInfo = categories.find(c => c.id === article.category);

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="max-w-none">
              {/* Article Header */}
              <div className="mb-8">
                <Button href="/philosophy" variant="ghost" size="sm" className="mb-6">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Philosophy
                </Button>
                
                <div className="flex items-center gap-4 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    categoryInfo?.color || 'bg-gray-500/20 text-gray-300'
                  }`}>
                    {categoryInfo?.label || article.category}
                  </span>
                  <span className="text-gray-400 text-sm">{article.readTime}</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
                  {article.title}
                </h1>
                
                <div className="flex items-center gap-4 text-gray-400 text-sm mb-6">
                  <span>Published: {article.publishDate}</span>
                  <span>•</span>
                  <span>By Juelzs</span>
                </div>
                
                <div className="flex gap-4">
                  <Button href="/contact?topic=philosophy" variant="outline">
                    Discuss This Article
                  </Button>
                  <Button href="/contact?download=frameworks" variant="ghost">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Framework
                  </Button>
                </div>
              </div>

              {/* Article Content */}
              <article className="prose prose-invert prose-lg max-w-none">
                <div className="text-gray-300 leading-relaxed">
                  <div dangerouslySetInnerHTML={{ 
                    __html: article.content
                      .replace(/# (.*)/g, '<h1 class="text-3xl font-bold text-white mb-6 mt-12 first:mt-0">$1</h1>')
                      .replace(/## (.*)/g, '<h2 class="text-2xl font-semibold text-white mb-4 mt-10">$1</h2>')
                      .replace(/### (.*)/g, '<h3 class="text-xl font-medium text-white mb-3 mt-8">$1</h3>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                      .replace(/^- (.*)/gm, '<li class="mb-2 text-gray-300 ml-4">$1</li>')
                      .replace(/^\d+\. (.*)/gm, '<li class="mb-2 text-gray-300 ml-4 list-decimal">$1</li>')
                      .replace(/\n\n/g, '</p><p class="mb-6">')
                      .replace(/^(?!<[h|l])/gm, '<p class="mb-6 text-gray-300">')
                      .replace(/<\/p><p class="mb-6 text-gray-300">$/g, '</p>')
                  }} />
                </div>
              </article>

              {/* Article Footer */}
              <div className="mt-12 pt-8 border-t border-gray-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Found this valuable?</h3>
                    <p className="text-gray-400 text-sm">
                      Share your thoughts or discuss how to apply these concepts to your projects.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button href="/contact?topic=philosophy&article=${article.id}" variant="primary">
                      Start Discussion
                    </Button>
                    <Button href="/contact?service=consulting" variant="outline">
                      Book Consultation
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Article Info */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-white">Article Details</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Category</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    categoryInfo?.color || 'bg-gray-500/20 text-gray-300'
                  }`}>
                    {categoryInfo?.label || article.category}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Published</h4>
                  <p className="text-gray-400 text-sm">{article.publishDate}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Reading Time</h4>
                  <p className="text-gray-400 text-sm">{article.readTime}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Share</h4>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </Button>
                    <Button variant="ghost" size="sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Table of Contents */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-white">In This Article</h3>
              <nav className="space-y-2">
                <a href="#foundation" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  The Foundation of Intelligent Systems
                </a>
                <a href="#principles" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  Core Principles
                </a>
                <a href="#teams" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  Building Teams That Build Systems
                </a>
                <a href="#future" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  The Future of Modular AI
                </a>
              </nav>
            </Card>

            {/* Related Articles */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-white">Related Articles</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <h4 className="font-medium text-white text-sm mb-1">Coaching Developers to Think in Systems</h4>
                  <p className="text-gray-400 text-xs">Building architectural thinkers</p>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <h4 className="font-medium text-white text-sm mb-1">Product Architecture Patterns</h4>
                  <p className="text-gray-400 text-xs">Strategic system design</p>
                </div>
                <Button href="/philosophy" variant="outline" size="sm" className="w-full">
                  View All Articles
                </Button>
              </div>
            </Card>

            {/* Call to Action */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-white">Apply These Concepts</h3>
              <p className="text-gray-400 text-sm mb-4">
                Ready to implement these architectural principles in your organization?
              </p>
              <div className="space-y-2">
                <Button href="/contact?service=architecture-review" className="w-full">
                  Architecture Review
                </Button>
                <Button href="/contact?service=team-coaching" variant="outline" size="sm" className="w-full">
                  Team Coaching
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 