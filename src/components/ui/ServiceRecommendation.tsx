import { useState } from 'react';
import Card from './Card';
import Button from './Button';

interface ServiceRecommendation {
  primary: {
    service: string;
    title: string;
    description: string;
    pricing: string;
    duration: string;
    reasoning: string;
    type: string;
  };
  alternative: {
    service: string;
    title: string;
    description: string;
    pricing: string;
    duration: string;
    reasoning: string;
    type: string;
  };
}

export default function ServiceRecommendation() {
  const [userInput, setUserInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendation, setRecommendation] = useState<ServiceRecommendation | null>(null);
  const [error, setError] = useState('');

  const analyzeNeeds = async () => {
    if (!userInput.trim()) {
      setError('Please describe what you need help with');
      return;
    }

    setAnalyzing(true);
    setError('');
    
    try {
      const response = await fetch('/api/services/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: userInput }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to analyze your needs');
      }

      setRecommendation(result.recommendation);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Sorry, I had trouble analyzing your needs. Please try again or contact me directly.');
    } finally {
      setAnalyzing(false);
    }
  };

  const requestMeeting = async (serviceType: string, serviceName: string) => {
    // Collect contact information
    const name = prompt('What&apos;s your name?');
    if (!name) return;
    
    const email = prompt('What&apos;s your email address?');
    if (!email) return;
    
    const company = prompt('Company name (optional):') || '';
    
    try {
      const response = await fetch('/api/services/request-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceType,
          serviceName,
          userDescription: userInput,
          timestamp: new Date().toISOString(),
          contactInfo: {
            name,
            email,
            company
          }
        }),
      });

      await response.json();
      
      if (response.ok) {
        alert('Meeting request sent! I&apos;ll get back to you within 24 hours to schedule our consultation.');
      } else {
        alert('There was an issue sending your request. Please contact me directly at support@juelzs.com');
      }
    } catch (err) {
      console.error('Meeting request error:', err);
      alert('There was an issue sending your request. Please contact me directly at support@juelzs.com');
    }
  };

  return (
    <Card className="bg-gradient-to-r from-purple-500/10 to-blue-600/10 border-purple-500/20 mb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 text-white">Not Sure What Service You Need?</h2>
        <p className="text-gray-400 max-w-3xl mx-auto">
          Describe what you&apos;re trying to accomplish or what challenges you&apos;re facing. 
          I&apos;ll analyze your needs and recommend the perfect service for your situation.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tell me about your project or challenge:
          </label>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Example: 'We have a monolithic Laravel app that's getting slow and hard to maintain. Our team struggles with deployments and we want to modernize our architecture but aren't sure where to start...'"
            className="w-full h-32 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={analyzing}
          />
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="text-center">
          <Button 
            onClick={analyzeNeeds}
            disabled={analyzing || !userInput.trim()}
            className="px-8 py-3"
          >
            {analyzing ? (
              <span className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Analyzing Your Needs...</span>
              </span>
            ) : (
              'Get My Service Recommendation'
            )}
          </Button>
        </div>

        {recommendation && (
          <div className="space-y-6 mt-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Here&apos;s What I Recommend</h3>
              <p className="text-gray-400">Based on your description, here are my suggestions:</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Primary Recommendation */}
              <Card className="border-green-500/30 bg-green-500/5">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium">
                      RECOMMENDED
                    </span>
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h4 className="text-xl font-bold text-white">{recommendation.primary.title}</h4>
                </div>
                
                <p className="text-gray-300 mb-4">{recommendation.primary.description}</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-blue-400 font-medium">Duration:</span>
                    <span className="text-white">{recommendation.primary.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400 font-medium">Investment:</span>
                    <span className="text-white font-bold">{recommendation.primary.pricing}</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-lg mb-6">
                  <h5 className="font-medium text-green-300 mb-2">Why This Is Perfect For You:</h5>
                  <p className="text-sm text-gray-300">{recommendation.primary.reasoning}</p>
                </div>

                <div className="flex space-x-3">
                  <Button 
                    href={`/services/${recommendation.primary.type}`}
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                  >
                    Learn More
                  </Button>
                  <Button 
                    onClick={() => requestMeeting(recommendation.primary.type, recommendation.primary.title)}
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Request Meeting
                  </Button>
                </div>
              </Card>

              {/* Alternative Recommendation */}
              <Card className="border-blue-500/30 bg-blue-500/5">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
                      ALTERNATIVE
                    </span>
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h4 className="text-xl font-bold text-white">{recommendation.alternative.title}</h4>
                </div>
                
                <p className="text-gray-300 mb-4">{recommendation.alternative.description}</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-blue-400 font-medium">Duration:</span>
                    <span className="text-white">{recommendation.alternative.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400 font-medium">Investment:</span>
                    <span className="text-white font-bold">{recommendation.alternative.pricing}</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-lg mb-6">
                  <h5 className="font-medium text-blue-300 mb-2">Consider This If:</h5>
                  <p className="text-sm text-gray-300">{recommendation.alternative.reasoning}</p>
                </div>

                <div className="flex space-x-3">
                  <Button 
                    href={`/services/${recommendation.alternative.type}`}
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                  >
                    Learn More
                  </Button>
                  <Button 
                    onClick={() => requestMeeting(recommendation.alternative.type, recommendation.alternative.title)}
                    size="sm"
                    className="flex-1"
                  >
                    Request Meeting
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
} 