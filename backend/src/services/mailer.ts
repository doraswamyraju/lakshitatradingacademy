import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'info@lakshitaacademy.in';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@lakshitaacademy.in';

const isConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, 
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export const sendContactEmail = async (data: { name: string; phone: string; message: string }) => {
  if (!isConfigured) {
    console.log('[MAILER-STUB] New Contact Inquiry logged (SMTP not configured):', data);
    return;
  }
  
  const text = `New Contact Inquiry\n\nName: ${data.name}\nPhone: ${data.phone}\nMessage: ${data.message}`;

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: ADMIN_EMAIL,
      subject: `New Inquiry from ${data.name}`,
      text
    });
    console.log(`[MAILER] Contact inquiry email sent for ${data.name}`);
  } catch (err: any) {
    console.error(`[MAILER] Error sending contact email:`, err.message);
  }
};

export const sendEnrollmentEmail = async (data: { name: string; email: string; phone: string; course: string }) => {
  if (!isConfigured) {
    console.log('[MAILER-STUB] New Enrollment Lead logged (SMTP not configured):', data);
    return;
  }
  
  const textAdmin = `New Enrollment Registration\n\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nCourse: ${data.course}`;
  
  const textUser = `Hi ${data.name},\n\nThank you for enrolling in the "${data.course}" at Lakshita Trading Academy. Our team will contact you shortly regarding the admission process.\n\nBest regards,\nLakshita Trading Academy`;

  try {
    // Notify Admin
    await transporter.sendMail({
      from: SMTP_FROM,
      to: ADMIN_EMAIL,
      subject: `New Enrollment: ${data.name} for ${data.course}`,
      text: textAdmin
    });

    // Notify User
    if (data.email) {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: data.email,
        subject: `Lakshita Trading Academy - Enrollment Confirmation`,
        text: textUser
      });
    }

    console.log(`[MAILER] Enrollment emails sent for ${data.name}`);
  } catch (err: any) {
    console.error(`[MAILER] Error sending enrollment email:`, err.message);
  }
};
