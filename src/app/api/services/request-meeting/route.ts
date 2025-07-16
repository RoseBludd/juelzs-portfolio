import { NextRequest, NextResponse } from 'next/server';
import EmailService from '@/services/email.service';

export async function POST(request: NextRequest) {
  try {
    const { serviceType, serviceName, userDescription, timestamp, contactInfo, aiReasoning } = await request.json();

    if (!serviceType || !serviceName || !userDescription || !contactInfo?.name || !contactInfo?.email || !contactInfo?.phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const emailService = EmailService.getInstance();

    // Send notification email to me
    const emailSubject = `New Service Meeting Request - ${serviceName}`;
    const emailContent = `
<h2>New Service Meeting Request</h2>

<h3>Contact Information:</h3>
<p><strong>Name:</strong> ${contactInfo.name}</p>
<p><strong>Email:</strong> ${contactInfo.email}</p>
<p><strong>Phone:</strong> ${contactInfo.phone}</p>
${contactInfo.company ? `<p><strong>Company:</strong> ${contactInfo.company}</p>` : ''}
${contactInfo.website ? `<p><strong>Website:</strong> ${contactInfo.website}</p>` : ''}

<h3>Service Details:</h3>
<p><strong>Service Requested:</strong> ${serviceName}</p>
<p><strong>Service Type:</strong> ${serviceType}</p>
<p><strong>Request Time:</strong> ${new Date(timestamp).toLocaleString()}</p>

<h3>AI Recommendation Reasoning:</h3>
<div style="background: #e8f5e8; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
<strong>Why this service was recommended:</strong><br>
${aiReasoning || 'No AI reasoning provided.'}
</div>

<h3>Client Description:</h3>
<blockquote style="background: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
${userDescription.replace(/\n/g, '<br>')}
</blockquote>

<h3>Next Steps:</h3>
<ol>
<li>Review the client's description and AI reasoning above</li>
<li>Prepare consultation materials for ${serviceName}</li>
<li>Call <strong>${contactInfo.phone}</strong> or email <strong>${contactInfo.email}</strong> within 24 hours to schedule</li>
</ol>

<p><em>This request was generated automatically from your portfolio's AI service recommendation system.</em></p>
    `;

    const success = await emailService.sendEmail({
      to: 'support@juelzs.com',
      from: 'support@juelzs.com',
      subject: emailSubject,
      textBody: `New Service Meeting Request - ${serviceName}\n\nContact Information:\nName: ${contactInfo.name}\nEmail: ${contactInfo.email}\nPhone: ${contactInfo.phone}\n${contactInfo.company ? `Company: ${contactInfo.company}\n` : ''}${contactInfo.website ? `Website: ${contactInfo.website}\n` : ''}\nService Type: ${serviceType}\nRequest Time: ${new Date(timestamp).toLocaleString()}\n\nAI Recommendation Reasoning:\n${aiReasoning || 'No AI reasoning provided.'}\n\nClient Description:\n${userDescription}`,
      htmlBody: emailContent,
      replyTo: 'support@juelzs.com'
    });

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Meeting request sent successfully' 
      });
    } else {
      throw new Error('Failed to send email notification');
    }

  } catch (error) {
    console.error('Meeting request error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process meeting request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 