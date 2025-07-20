import { useState, useEffect } from 'react';
import { getUserCreditStatus } from '@/utils/creditUtils';

interface CreditStatus {
  credits_used: number;
  credits_limit: number;
  credits_remaining: number;
  subscription_tier: string;
}

export function useUserCreditStatus() {
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreditStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await getUserCreditStatus();
      setCreditStatus(status);
    } catch (err) {
      console.error('Error fetching credit status:', err);
      setError('Failed to fetch credit status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditStatus();
  }, []);

  return {
    creditStatus,
    loading,
    error,
    refetch: fetchCreditStatus
  };
}