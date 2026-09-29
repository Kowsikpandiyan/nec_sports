const nodemailer = require('nodemailer');

/**
 * Dispatch an email message.
 * @param {Object} options
 * @param {string} options.to Recipient email address
 * @param {string} options.subject Email subject header
 * @param {string} options.html HTML email content
 */
const sendEmail = async ({ to, subject, html }) => {
  let transporter;
  let usingDevAccount = false;

  // Use configured email details if present
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: parseInt(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Generate automated test credentials using ethereal.email in development
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      usingDevAccount = true;
    } catch (err) {
      console.error('Failed to create an Ethereal mail account, defaulting to console logs.', err.message);
      // Fallback log transporter to prevent crashing
      transporter = {
        sendMail: async (options) => {
          console.log(`[MOCKED EMAIL SEND] To: ${options.to} | Subject: ${options.subject}`);
          return { messageId: 'mocked-id' };
        }
      };
    }
  }

  const mailOptions = {
    from: '"NEC College Sports Hub" <sports@nec.edu>',
    to,
    subject,
    html
  };

  const info = await transporter.sendMail(mailOptions);

  if (usingDevAccount) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('----------------------------------------------------');
    console.log(`✉️ Email dispatched to: ${to}`);
    console.log(`🔗 Ethereal Preview URL: ${previewUrl}`);
    console.log('----------------------------------------------------');
  }

  return info;
};

module.exports = sendEmail;
