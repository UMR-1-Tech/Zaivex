// /api/contact.js
// Vercel serverless function — receives contact form data and posts it to Slack.
// The Slack webhook URL is read from an environment variable, so it is never
// exposed to the browser or committed to source control.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, company, service, message, subscribe } = req.body || {};

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('SLACK_WEBHOOK_URL environment variable is not set.');
      return res.status(500).json({ error: 'Server is not configured.' });
    }

    const slackPayload = {
      text: `📩 New contact form submission from *${name}*`,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '📩 New Contact Form Submission', emoji: true }
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Name:*\n${name}` },
            { type: 'mrkdwn', text: `*Email:*\n${email}` },
            { type: 'mrkdwn', text: `*Company:*\n${company || 'N/A'}` },
            { type: 'mrkdwn', text: `*Service Interest:*\n${service || 'N/A'}` }
          ]
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*Message:*\n${message}` }
        },
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: `Newsletter opt-in: ${subscribe ? 'Yes ✅' : 'No'} • ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC` }
          ]
        }
      ]
    };

    const slackRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload)
    });

    if (!slackRes.ok) {
      const text = await slackRes.text();
      console.error('Slack webhook error:', text);
      return res.status(502).json({ error: 'Failed to deliver message to Slack.' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
