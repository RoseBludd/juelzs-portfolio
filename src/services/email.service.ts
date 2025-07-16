import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

interface EmailData {
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
}

class EmailService {
  private static instance: EmailService;
  private sesClient: SESClient | null = null;
  private isConfigured: boolean = false;

  private constructor() {
    this.initializeSES();
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private initializeSES(): void {
    try {
      const region = process.env.AWS_REGION;
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

      if (!region || !accessKeyId || !secretAccessKey) {
        console.warn('⚠️ AWS SES not configured - missing environment variables');
        this.isConfigured = false;
        return;
      }

      this.sesClient = new SESClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      this.isConfigured = true;
      console.log('✅ AWS SES client initialized successfully');
      console.log(`🌍 AWS Region: ${region}`);
    } catch (error) {
      console.error('❌ Failed to initialize AWS SES:', error);
      this.isConfigured = false;
    }
  }

  public isAvailable(): boolean {
    return this.isConfigured && this.sesClient !== null;
  }

  public async sendEmail(emailData: EmailData): Promise<boolean> {
    if (!this.isAvailable()) {
      console.error('❌ AWS SES not available - cannot send email');
      return false;
    }

    try {
      console.log('📧 Attempting to send email via SES:');
      console.log(`   From: ${emailData.from}`);
      console.log(`   To: ${emailData.to}`);
      console.log(`   Subject: ${emailData.subject}`);
      console.log(`   ReplyTo: ${emailData.replyTo || 'none'}`);

      const command = new SendEmailCommand({
        Source: emailData.from,
        Destination: {
          ToAddresses: [emailData.to],
        },
        ReplyToAddresses: emailData.replyTo ? [emailData.replyTo] : undefined,
        Message: {
          Subject: {
            Data: emailData.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Text: {
              Data: emailData.textBody,
              Charset: 'UTF-8',
            },
            Html: emailData.htmlBody ? {
              Data: emailData.htmlBody,
              Charset: 'UTF-8',
            } : undefined,
          },
        },
      });

      const result = await this.sesClient!.send(command);
      console.log('✅ Email sent successfully via SES:', result.MessageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email via SES:', error);
      
      // Check for common error messages in the error string
      const errorString = error instanceof Error ? error.message : String(error);
      
      if (errorString.includes('MessageRejected') || errorString.includes('not verified')) {
        console.error('🔍 This is likely because the email address is not verified in AWS SES');
        console.error('🔍 Solution: Verify the email addresses in AWS SES Console');
      } else if (errorString.includes('SendingPaused')) {
        console.error('🔍 Sending is paused for your AWS account');
      }
      
      return false;
    }
  }

  public async sendContactFormEmail(formData: {
    name: string;
    email: string;
    company?: string;
    subject: string;
    message: string;
    projectType?: string;
  }): Promise<boolean> {
    const textBody = `
New Contact Form Submission

Name: ${formData.name}
Email: ${formData.email}
Company: ${formData.company || 'Not provided'}
Project Type: ${formData.projectType || 'consultation'}
Subject: ${formData.subject}

Message:
${formData.message}

Submitted at: ${new Date().toLocaleString()}
    `.trim();

    const htmlBody = `
<h2>New Contact Form Submission</h2>
<p><strong>Name:</strong> ${formData.name}</p>
<p><strong>Email:</strong> <a href="mailto:${formData.email}">${formData.email}</a></p>
<p><strong>Company:</strong> ${formData.company || 'Not provided'}</p>
<p><strong>Project Type:</strong> ${formData.projectType || 'consultation'}</p>
<p><strong>Subject:</strong> ${formData.subject}</p>
<p><strong>Message:</strong></p>
<div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
  ${formData.message.replace(/\n/g, '<br>')}
</div>
<p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
    `;

    console.log('📧 Contact form email configuration:');
    console.log(`   From: support@juelzs.com (your domain)`);
    console.log(`   To: support@juelzs.com`);

    return await this.sendEmail({
      to: 'support@juelzs.com',
      from: 'support@juelzs.com', // Using your own domain for professional branding
      replyTo: formData.email,
      subject: `New Contact: ${formData.subject}`,
      textBody,
      htmlBody,
    });
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        message: 'AWS SES not configured or available'
      };
    }

    try {
      console.log('🧪 Testing AWS SES connection...');
      
      console.log(`🧪 Test configuration:`);
      console.log(`   From: support@juelzs.com (verified - your domain)`);
      console.log(`   To: support@juelzs.com`);

      // Send a test email
      const success = await this.sendEmail({
        to: 'support@juelzs.com',
        from: 'support@juelzs.com', // Using your own domain for professional branding
        subject: 'AWS SES Test - Portfolio Contact System',
        textBody: 'This is a test email to verify AWS SES is working correctly.\n\nIf you receive this, your email system is properly configured!',
        htmlBody: '<h3>AWS SES Test - Portfolio Contact System</h3><p>This is a test email to verify AWS SES is working correctly.</p><p>If you receive this, your email system is properly configured!</p>'
      });

      return {
        success,
        message: success ? 'Test email sent successfully!' : 'Failed to send test email - check logs for details'
      };
    } catch (error) {
      return {
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export default EmailService; 