export interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
  projectType?: 'consultation' | 'architecture-review' | 'team-coaching' | 'system-design' | 'other';
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
      // This will be connected to an actual API later
      console.log('Contact form submitted:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Thank you for your message! I\'ll get back to you within 24 hours.'
      };
    } catch (error) {
      console.error('Contact form submission error:', error);
      return {
        success: false,
        message: 'Sorry, there was an error sending your message. Please try again later.'
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
    type: 'consultation' | 'architecture-review' | 'team-coaching' | 'system-design';
  }> {
    return [
      {
        title: 'Architecture Review',
        description: 'Deep dive into your system architecture with actionable recommendations.',
        duration: '2-3 hours',
        type: 'architecture-review'
      },
      {
        title: 'Team Coaching',
        description: 'Hands-on coaching to help your team think in systems and scale their skills.',
        duration: '4-6 weeks',
        type: 'team-coaching'
      },
      {
        title: 'System Design Consultation',
        description: 'Strategic guidance on designing scalable, modular systems from the ground up.',
        duration: '1-2 weeks',
        type: 'system-design'
      },
      {
        title: 'AI Strategy Session',
        description: 'Consultation on integrating AI into your architecture and development process.',
        duration: '1-2 hours',
        type: 'consultation'
      }
    ];
  }
}

export default ContactService; 