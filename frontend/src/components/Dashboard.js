import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState('deposit'); // 'deposit' or 'withdraw'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  // Create an Axios instance with JWT authorization headers
  const getAxiosConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch user profile and transaction history in parallel
      const [profileRes, txRes] = await Promise.all([
        axios.get('http://localhost:5000/api/profile', getAxiosConfig()),
        axios.get('http://localhost:5000/api/transactions', getAxiosConfig())
      ]);

      if (profileRes.data.success) {
        setUser(profileRes.data.user);
      }
      
      if (txRes.data.success) {
        setTransactions(txRes.data.transactions);
      }
    } catch (err) {
      console.error(err);
      // If unauthorized, clear storage and kick back to login
      if (err.response && err.response.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else {
        setError('Failed to retrieve account records. Please refresh.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);


  const handleTransaction = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    if (activeTab === 'withdraw' && user.balance < parsedAmount) {
      setError('Insufficient funds. Withdrawal amount exceeds your current balance.');
      return;
    }

    setActionLoading(true);

    try {
      const endpoint = activeTab === 'deposit' ? 'deposit' : 'withdraw';
      const response = await axios.post(
        `http://localhost:5000/api/transactions/${endpoint}`,
        { amount: parsedAmount },
        getAxiosConfig()
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        setAmount('');
        // Reload dashboard state to show updated balance & transaction record
        await fetchData();
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Transaction processing failed. Try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Best effort API logout notify, then clear localStorage
      await axios.post('http://localhost:5000/api/logout', {}, getAxiosConfig());
    } catch (e) {
      console.error('Logout API notify failed', e);
    } finally {
      localStorage.clear();
      navigate('/login');
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading && !user) {
    return (
      <div className="app-container">
        <div className="spinner spinner-light" style={{ width: '40px', height: '40px' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading secure session records...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <header className="dash-header">
        <div className="user-welcome">
          <div className="brand-logo" style={{ justifyContent: 'flex-start', fontSize: '1.4rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            APEX CYBER BANK
          </div>
          <h1>Welcome, {user?.name}</h1>
          <p>Online Portal | Highly Secure Multi-Factor Session</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Secure Logout
        </button>
      </header>

      {/* Main Grid */}
      <div className="dash-grid">
        
        {/* Left Column: Account Details & Action Form */}
        <div className="left-col">
          
          {/* Account Balance Card */}
          <div className="balance-card">
            <span className="card-tag">Account Balance</span>
            <div className="balance-amount">
              ${user?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            
            <div className="account-details">
              <div className="detail-item">
                <span className="label">Account Number</span>
                <span className="val">{user?.account_number}</span>
              </div>
              <div className="detail-item">
                <span className="label">Registered Phone</span>
                <span className="val">+{user?.phone}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions (Deposit/Withdrawal Form) */}
          <div className="action-card">
            <h3>Secure Funds Transfer</h3>
            
            <div className="transaction-tabs">
              <button 
                type="button" 
                className={`tab-btn ${activeTab === 'deposit' ? 'active' : ''}`}
                onClick={() => { setActiveTab('deposit'); setError(''); setSuccess(''); }}
              >
                Deposit Funds
              </button>
              <button 
                type="button" 
                className={`tab-btn ${activeTab === 'withdraw' ? 'active' : ''}`}
                onClick={() => { setActiveTab('withdraw'); setError(''); setSuccess(''); }}
              >
                Withdraw Funds
              </button>
            </div>

            {error && (
              <div className="alert alert-danger" style={{ padding: '0.75rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success" style={{ padding: '0.75rem', marginBottom: '1rem' }}>
                {success}
              </div>
            )}

            <form onSubmit={handleTransaction} className="action-form">
              <div className="form-group">
                <label className="form-label">Transaction Amount ($)</label>
                <div className="input-container">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    placeholder="Enter amount (e.g. 250.00)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={actionLoading}>
                {actionLoading ? (
                  <div className="spinner" />
                ) : (
                  <>
                    {activeTab === 'deposit' ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Confirm Deposit
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Confirm Withdrawal
                      </>
                    )}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Transaction Logs */}
        <div className="right-col">
          <h3>Transaction Audit History</h3>
          
          <div className="history-list">
            {transactions.length === 0 ? (
              <div className="empty-history">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>No transactions completed yet. Your initial deposit history will display here.</span>
              </div>
            ) : (
              transactions.map((tx) => (
                <div className="history-item" key={tx.id}>
                  <div className="hist-left">
                    <div className={`tx-icon-wrapper ${tx.type}`}>
                      {tx.type === 'deposit' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                          <polyline points="17 6 23 6 23 12" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                          <polyline points="17 18 23 18 23 12" />
                        </svg>
                      )}
                    </div>
                    <div className="tx-details">
                      <span className="tx-title">{tx.description}</span>
                      <span className="tx-date">{formatDate(tx.timestamp)}</span>
                    </div>
                  </div>
                  
                  <div className="hist-right">
                    <span className={`tx-amount ${tx.type}`}>
                      {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </span>
                    <span className="tx-bal-after">Balance: ${tx.balance_after.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
