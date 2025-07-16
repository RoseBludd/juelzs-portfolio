import { NextResponse } from 'next/server';
import EmailService from '@/services/email.service';

export async function GET() {
  try {
    console.log('🧪 Testing AWS SES email service...');
    
    const emailService = EmailService.getInstance();
    
    // Check if SES is available
    if (!emailService.isAvailable()) {
      return NextResponse.json({
        success: false,
        message: 'AWS SES not configured or available',
        details: 'Check AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables',
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ AWS SES service is available, sending test email...');
    
    // Send test email
    const testResult = await emailService.testConnection();
    
    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      sesAvailable: true,
      timestamp: new Date().toISOString(),
      note: 'Check your support@juelzs.com inbox for test email'
    });

  } catch (error) {
    console.error('❌ Error testing email service:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test email service',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 