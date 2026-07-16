import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const OtpVerify = () => {
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300 seconds)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  useEffect(() => {
    // Retrieve phone from sessionStorage
    const storedPhone = sessionStorage.getItem('verify_phone');
    if (!storedPhone) {
      navigate('/login');
      return;
    }
    setPhone(storedPhone);
  }, [navigate]);

  // Countdown timer logic
  useEffect(() => {
    if (timeLeft <= 0) return;
    const intervalId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  // Format time (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (index, value) => {
    const newDigits = [...otpDigits];
    
    // Only accept numeric inputs
    if (value && !/^\d+$/.test(value)) return;
    
    newDigits[index] = value;
    setOtpDigits(newDigits);
    
    // Auto-focus next input box
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace: clear and focus previous box
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        inputRefs.current[index - 1].focus();
      } else {
        const newDigits = [...otpDigits];
        newDigits[index] = '';
        setOtpDigits(newDigits);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasteData)) return; // Reject if not 6 digits

    const newDigits = pasteData.split('');
    setOtpDigits(newDigits);
    inputRefs.current[5].focus(); // Focus last field
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const otp = otpDigits.join('');
    if (otp.length < 6) {
      setError('Please enter all 6 digits of the OTP.');
      setLoading(false);
      return;
    }

    if (timeLeft <= 0) {
      setError('OTP has expired. Please request a new code.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/verify-otp', {
        phone,
        otp
      });

      if (response.data.success) {
        // Save JWT token and profile info securely
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Clean session verification phone
        sessionStorage.removeItem('verify_phone');
        
        setSuccess('OTP verified! Redirecting to secure dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Verification failed. Please double-check your code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/send-otp', { phone });
      if (response.data.success) {
        setSuccess('A new OTP has been sent successfully.');
        setTimeLeft(300); // Reset timer to 5 minutes
        setOtpDigits(['', '', '', '', '', '']);
        inputRefs.current[0].focus();
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to resend OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-logo">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              OTP VERIFICATION
            </div>
            <p className="auth-subtitle">
              We sent a 6-digit verification code to +{phone}
            </p>
          </div>

          {error && (
            <div className="alert alert-danger">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {success}
            </div>
          )}

          <form onSubmit={handleVerify}>
            <div className="otp-container" onPaste={handlePaste}>
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  className="otp-box"
                  value={digit}
                  ref={(el) => (inputRefs.current[index] = el)}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  required
                />
              ))}
            </div>

            <div className="otp-actions">
              <span className="timer">
                Expires in:{' '}
                <span className={timeLeft < 60 ? 'timer-expiry' : ''}>
                  {formatTime(timeLeft)}
                </span>
              </span>
              <button
                type="button"
                className="resend-link"
                onClick={handleResend}
                disabled={timeLeft > 240 || loading} // Allow resending after 1 minute has elapsed
              >
                Resend OTP
              </button>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <div className="spinner" />
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  Verify & Proceed
                </>
              )}
            </button>
          </form>

          <div className="demo-otp-note">
            💡 <strong>Demo Mode Notice:</strong> Since Twilio live SMS credentials are not configured, the OTP has been printed in your Flask server terminal logs. Please copy it from there.
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerify;
