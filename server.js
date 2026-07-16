const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const otpStore = new Map();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

setInterval(() => {
  const now = Date.now();
  for (const [phone, data] of otpStore.entries()) {
    if (now - data.timestamp > 300000) {
      otpStore.delete(phone);
    }
  }
}, 60000);

const sendSMS = async (phone, message, otp) => {
  const provider = process.env.SMS_PROVIDER || 'console';

  console.log(`Using SMS provider: ${provider}`);

  switch (provider) {
    case '2factor':
      const response = await fetch(
        `https://2factor.in/API/V1/${process.env.TWOFACTOR_API_KEY}/SMS/${phone}/${otp}/OTP_TEMPLATE`
      );
      return await response.json();

    case 'fast2sms':
      const cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '');
      
      console.log(`Sending SMS to: ${cleanPhone}`); 
      
      const fast2smsResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'q',
          message: message,
          language: 'english',
          flash: 0,
          numbers: cleanPhone
        })
      });
      const result = await fast2smsResponse.json();
      console.log('Fast2SMS Response:', result);
      return result;

    case 'msg91':
      const msg91Response = await fetch(
        `https://api.msg91.com/api/v5/otp?template_id=${process.env.MSG91_TEMPLATE_ID}&mobile=${phone}&authkey=${process.env.MSG91_AUTH_KEY}`
      );
      return await msg91Response.json();

    case 'textlocal':
      const textlocalResponse = await fetch('https://api.textlocal.in/send/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          apikey: process.env.TEXTLOCAL_API_KEY,
          numbers: phone,
          message: message,
          sender: 'TXTLCL'
        })
      });
      return await textlocalResponse.json();

    default:
      console.log(`\n📱 SMS to ${phone}:\n${message}\n`);
      return { success: true };
  }
};

app.post('/api/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    const otp = generateOTP();
    
    otpStore.set(phone, {
      otp,
      timestamp: Date.now()
    });

    const message = `Your OTP is: ${otp}. Valid for 5 minutes.`;
    await sendSMS(phone, message, otp);

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP required' });
    }

    const record = otpStore.get(phone);

    if (!record) {
      return res.status(400).json({ error: 'OTP expired or not found' });
    }

    if (Date.now() - record.timestamp > 300000) {
      otpStore.delete(phone);
      return res.status(400).json({ error: 'OTP expired' });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    otpStore.delete(phone);

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));