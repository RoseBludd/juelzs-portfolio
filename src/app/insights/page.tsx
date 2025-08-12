import { Metadata } from 'next';
import InsightsPageClient from '@/components/ui/InsightsPageClient';

export const metadata: Metadata = {
  title: 'Engineering Insights | Juelzs Portfolio',
  description: 'Architectural decisions, technical reflections, and engineering insights from building intelligent systems with Prompt-Led Flow Architecture.',
  keywords: ['Engineering Insights', 'Architecture Decisions', 'Technical Leadership', 'AI Systems', 'Prompt-Led Flow Architecture'],
};

export default function InsightsPage() {
  return <InsightsPageClient />;
}
