import { useEffect, useState } from 'react';
import { buildApiUrl } from '../utils/config';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Banknote, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { refreshWalletAfterTransaction } from '../utils/walletUtils';

const WithdrawPage = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [banks, setBanks] = useState([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadWallet();
    loadBanks();
  }, []);

  const loadWallet = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(buildApiUrl('/wallet'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWallet(data.data.wallet);
      }
    } catch (e) {
      console.error('Failed to load wallet', e);
    }
  };

  const loadBanks = async () => {
    try {
      setIsLoadingBanks(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(buildApiUrl('/borrower/banks'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBanks(data?.data?.banks || []);
      }
    } catch (e) {
      console.error('Failed to load banks', e);
    } finally {
      setIsLoadingBanks(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const numericAmount = parseFloat(amount);
      if (!numericAmount || numericAmount <= 0) {
        setError('Enter a valid amount');
        return;
      }
      if (!accountNumber || !bankCode) {
        setError('Select a bank and enter account number');
        return;
      }

      const token = localStorage.getItem('accessToken');
      const res = await fetch(buildApiUrl('/wallet/withdraw'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: numericAmount,
          bankDetails: { bankCode, accountNumber, accountName }
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Withdrawal request submitted. Processing...');
        await loadWallet();
        refreshWalletAfterTransaction('withdrawal', numericAmount, true);
        setTimeout(() => navigate('/wallet'), 2000);
      } else {
        setError(data.message || 'Withdrawal failed');
      }
    } catch (e) {
      console.error('Withdraw error', e);
      setError('Failed to process withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-secondary-900 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-neutral-600 dark:text-neutral-400 hover:text-secondary-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white flex items-center mb-6">
          <Banknote className="h-8 w-8 mr-3 text-primary-600" />
          Withdraw Funds
        </h1>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount (₦)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-3 rounded-lg border dark:border-neutral-600 dark:bg-neutral-700 dark:text-white" placeholder="1000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bank</label>
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full px-3 py-3 rounded-lg border dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
              >
                <option value="" disabled>{isLoadingBanks ? 'Loading banks...' : 'Select a bank'}</option>
                {banks.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name} ({bank.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account Number</label>
              <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full px-3 py-3 rounded-lg border dark:border-neutral-600 dark:bg-neutral-700 dark:text-white" placeholder="0123456789" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account Name (optional)</label>
              <input value={accountName} onChange={(e) => setAccountName(e.target.value)} className="w-full px-3 py-3 rounded-lg border dark:border-neutral-600 dark:bg-neutral-700 dark:text-white" placeholder="John Doe" />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-error/10 border border-error/30 rounded text-error flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" /> {error}
            </div>
          )}
          {success && (
            <div className="mt-4 p-3 bg-success/10 border border-success/30 rounded text-success flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" /> {success}
            </div>
          )}

          <button onClick={handleWithdraw} disabled={isLoading || !amount || !bankCode || !accountNumber} className="mt-6 w-full bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center">
            {isLoading ? (<><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Processing...</>) : 'Withdraw'}
          </button>
        </motion.div>

        <div className="mt-6 text-sm text-neutral-600 dark:text-neutral-400">
          Balance: ₦{wallet?.balance?.toLocaleString() || '0'}
        </div>
      </div>
    </div>
  );
};

export default WithdrawPage;


