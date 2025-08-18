import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Strategic Architect Masterclass | Real-Time Philosophical Alignment Analysis',
  description: 'Explore a 1.83M character conversation demonstrating Strategic Architect thinking, execution-led refinement, and 98/100 philosophical alignment. Interactive analysis with searchable segments and real-time pattern recognition.',
  keywords: [
    'Strategic Architect',
    'Execution-Led Refinement', 
    'Philosophical Alignment',
    'AI Conversation Analysis',
    'Strategic Thinking Development',
    'Organizational Intelligence',
    'Meta-Cognitive Analysis',
    'CADIS Enhancement',
    'Leadership Development',
    'Strategic Coaching'
  ],
  openGraph: {
    title: 'Strategic Architect Masterclass - Real Conversation Analysis',
    description: '1.83M character conversation demonstrating Strategic Architect thinking with 98/100 philosophical alignment. Interactive exploration of execution-led refinement in action.',
    type: 'article',
    images: [
      {
        url: '/strategic-architect-og.png',
        width: 1200,
        height: 630,
        alt: 'Strategic Architect Masterclass - Philosophical Alignment Analysis'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Strategic Architect Masterclass - Real Conversation Analysis',
    description: 'Explore 1.83M characters of Strategic Architect thinking with real-time philosophical alignment analysis and interactive pattern recognition.',
    images: ['/strategic-architect-og.png']
  }
};

export default function MasterclassLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
