export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  company?: string;
  website?: string;
  subject: string;
  message: string;
  projectType?: 'consultation' | 'architecture-review' | 'team-coaching' | 'system-design' | 'ai-implementation' | 'technical-audit' | 'leadership-coaching' | 'code-review' | 'performance-optimization' | 'database-review' | 'cicd-setup' | 'legacy-modernization' | 'remote-team-management' | 'team-building' | 'contracted-team' | 'other';
}

export interface ContactInfo {
  email: string;
  linkedin?: string;
  github?: string;
  calendlyUrl?: string;
  location: string;
  availability: string;
}

class ContactService {
  private static instance: ContactService;

  private constructor() {}

  public static getInstance(): ContactService {
    if (!ContactService.instance) {
      ContactService.instance = new ContactService();
    }
    return ContactService.instance;
  }

  async submitContactForm(formData: ContactFormData): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Sorry, there was an error sending your message. Please try again later.'
        };
      }

      return result;
    } catch (error) {
      console.error('Contact form submission error:', error);
      return {
        success: false,
        message: 'Sorry, there was an error sending your message. Please try again later or email me directly at support@juelzs.com.'
      };
    }
  }

  getContactInfo(): ContactInfo {
    return {
      email: 'support@juelzs.com',
      linkedin: 'https://www.linkedin.com/in/justin-backus',
      github: 'https://github.com/RoseBludd',
      calendlyUrl: 'https://calendly.com/juelzs', // Will be updated with real Calendly URL
      location: 'Remote / Global',
      availability: 'Available for consulting and architecture reviews'
    };
  }

  getConsultingServices(): Array<{
    title: string;
    description: string;
    duration: string;
    pricing?: string;
    type: 'consultation' | 'architecture-review' | 'team-coaching' | 'system-design' | 'ai-implementation' | 'technical-audit' | 'leadership-coaching' | 'code-review' | 'performance-optimization' | 'database-review' | 'cicd-setup' | 'legacy-modernization' | 'remote-team-management' | 'team-building' | 'contracted-team';
  }> {
    return [
      {
        title: 'Architecture Review',
        description: 'Deep dive into your system architecture with actionable recommendations and performance optimization strategies.',
        duration: '2-3 hours',
        pricing: '$300-450',
        type: 'architecture-review'
      },
      {
        title: 'AI Strategy & Implementation',
        description: 'Comprehensive AI integration planning with hands-on implementation guidance and ROI analysis.',
        duration: '1-2 weeks',
        pricing: '$2,500-5,000',
        type: 'ai-implementation'
      },
      {
        title: 'Team Coaching & Development',
        description: 'Hands-on coaching to help your team think in systems and scale their architectural thinking.',
        duration: '4-6 weeks',
        pricing: '$4,000-6,000',
        type: 'team-coaching'
      },
      {
        title: 'System Design Consultation',
        description: 'Strategic guidance on designing scalable, modular systems from the ground up with future-proofing.',
        duration: '1-2 weeks',
        pricing: '$2,000-4,000',
        type: 'system-design'
      },
      {
        title: 'Technical Leadership Coaching',
        description: 'One-on-one coaching for technical leads to develop leadership skills and team management capabilities.',
        duration: '2-4 weeks',
        pricing: '$1,500-3,000',
        type: 'leadership-coaching'
      },
      {
        title: 'Technical Audit & Assessment',
        description: 'Comprehensive codebase and infrastructure audit with detailed improvement roadmap.',
        duration: '3-5 days',
        pricing: '$1,200-2,000',
        type: 'technical-audit'
      },
      {
        title: 'AI Strategy Session',
        description: 'Quick consultation on integrating AI into your architecture and development process.',
        duration: '1-2 hours',
        pricing: '$200-300',
        type: 'consultation'
      },
      {
        title: 'Build Your Permanent Team',
        description: 'I help you build, hire, and train your own development team - you keep them permanently (RECOMMENDED).',
        duration: '2-6 weeks',
        pricing: '$8,000-15,000',
        type: 'team-building'
      },
      {
        title: 'Use My Premium Team',
        description: 'Hire my experienced team for implementation - premium rates but proven expertise (expensive option).',
        duration: 'Project-based',
        pricing: '$150-200/hr + management',
        type: 'contracted-team'
      }
    ];
  }
}

export default ContactService; 