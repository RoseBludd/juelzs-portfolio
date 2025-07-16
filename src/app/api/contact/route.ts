import { NextRequest, NextResponse } from 'next/server';
import EmailService from '@/services/email.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, subject, message, projectType } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'Please fill in all required fields.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Format the email content
    const emailContent = `
New Contact Form Submission

Name: ${name}
Email: ${email}
Company: ${company || 'Not provided'}
Project Type: ${projectType || 'consultation'}
Subject: ${subject}

Message:
${message}

Submitted at: ${new Date().toLocaleString()}
    `.trim();

    console.log('📧 Contact form submission received:', {
      name,
      email,
      company,
      subject,
      projectType,
      timestamp: new Date().toISOString()
    });

    console.log('📧 Email content that would be sent:', emailContent);

    // Try to send email via AWS SES
    const emailService = EmailService.getInstance();
    let emailSent = false;
    
    if (emailService.isAvailable()) {
      console.log('📧 Attempting to send email via AWS SES...');
      emailSent = await emailService.sendContactFormEmail({
        name,
        email,
        company,
        subject,
        message,
        projectType
      });
    } else {
      console.warn('⚠️ AWS SES not available, email content logged above');
    }

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? 'Thank you for your message! I\'ll get back to you within 24 hours.'
        : 'Thank you for your message! Your inquiry has been received and I\'ll get back to you within 24 hours.',
      emailSent
    });

  } catch (error) {
    console.error('❌ Contact form submission error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Sorry, there was an error sending your message. Please try again later or email me directly at support@juelzs.com.' 
      },
      { status: 500 }
    );
  }
} 