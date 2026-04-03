import React, { createContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from '@/template';
import * as coinService from '../services/coinService';

export interface CoinAnimation {
  visible: boolean;
  amount: number;
  reason: string;
  icon: string;
}

export interface CoinContextType {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  currentStreak: number;
  maxStreak: number;
  loading: boolean;
  coinAnimation: CoinAnimation | null;
  referralCode: string | null;
  earnCoins: (amount: number, reason: string, meta?: Record<string, any>) => Promise<boolean>;
  spendCoins: (amount: number, reason: string, meta?: Record<string, any>) => Promise<boolean>;
  refreshWallet: () => Promise<void>;
  showCoinAnimation: (amount: number, reason: string) => void;
  canEarnLikeCoins: () => Promise<boolean>;
  recordLikeCoinEarned: () => Promise<void>;
  generateReferral: () => Promise<string | null>;
}

export const CoinContext = createContext<CoinContextType | undefined>(undefined);

export function CoinProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [coinAnimation, setCoinAnimation] = useState<CoinAnimation | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dailyLoginChecked = useRef(false);

  // Load wallet when user changes
  useEffect(() => {
    if (!user?.id) {
      setBalance(0);
      setTotalEarned(0);
      setTotalSpent(0);
      setCurrentStreak(0);
      setMaxStreak(0);
      setLoading(false);
      dailyLoginChecked.current = false;
      return;
    }

    loadWalletAndStreak(user.id);
  }, [user?.id]);

  const loadWalletAndStreak = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      // Ensure wallet exists
      const walletResult = await coinService.ensureWallet(userId);
      if (walletResult.data) {
        setBalance(walletResult.data.balance);
        setTotalEarned(walletResult.data.total_earned);
        setTotalSpent(walletResult.data.total_spent);
      }

      // Load streak
      const streakResult = await coinService.ensureStreak(userId);
      if (streakResult.data) {
        setCurrentStreak(streakResult.data.current_streak);
        setMaxStreak(streakResult.data.max_streak);
      }

      // Load referral code
      const code = await coinService.getReferralCode(userId);
      setReferralCode(code);

      // Check daily login (once per session)
      if (!dailyLoginChecked.current) {
        dailyLoginChecked.current = true;
        const loginResult = await coinService.checkAndRecordDailyLogin(userId);
        if (loginResult.isNewDay) {
          setCurrentStreak(loginResult.newStreak);
          const dailyAmount = coinService.COIN_RULES.daily_login.amount + loginResult.streakBonusAmount;
          // Refresh wallet after daily login
          const updatedWallet = await coinService.getWallet(userId);
          if (updatedWallet.data) {
            setBalance(updatedWallet.data.balance);
            setTotalEarned(updatedWallet.data.total_earned);
          }
          // Show animation
          showCoinAnimation(dailyAmount, loginResult.streakBonusAmount > 0
            ? `Daily Login + ${loginResult.newStreak}-day Streak Bonus`
            : 'Daily Login Bonus');
        }
      }
    } catch (e) {
      console.log('CoinContext load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshWallet = useCallback(async () => {
    if (!user?.id) return;
    const walletResult = await coinService.getWallet(user.id);
    if (walletResult.data) {
      setBalance(walletResult.data.balance);
      setTotalEarned(walletResult.data.total_earned);
      setTotalSpent(walletResult.data.total_spent);
    }
    const streakResult = await coinService.getStreak(user.id);
    if (streakResult.data) {
      setCurrentStreak(streakResult.data.current_streak);
      setMaxStreak(streakResult.data.max_streak);
    }
  }, [user?.id]);

  const showCoinAnimation = useCallback((amount: number, reason: string) => {
    if (animationTimer.current) clearTimeout(animationTimer.current);
    const rule = Object.entries(coinService.COIN_RULES).find(([key]) => reason.includes(key));
    const icon = rule ? rule[1].icon : '🪙';
    setCoinAnimation({ visible: true, amount, reason, icon });
    animationTimer.current = setTimeout(() => {
      setCoinAnimation(null);
    }, 2800);
  }, []);

  const handleEarnCoins = useCallback(async (
    amount: number,
    reason: string,
    meta: Record<string, any> = {},
  ): Promise<boolean> => {
    if (!user?.id) return false;
    const result = await coinService.earnCoins(user.id, amount, reason, meta);
    if (result.success) {
      setBalance(prev => prev + amount);
      setTotalEarned(prev => prev + amount);
      showCoinAnimation(amount, reason);
    }
    return result.success;
  }, [user?.id, showCoinAnimation]);

  const handleSpendCoins = useCallback(async (
    amount: number,
    reason: string,
    meta: Record<string, any> = {},
  ): Promise<boolean> => {
    if (!user?.id) return false;
    if (balance < amount) return false;
    const result = await coinService.spendCoins(user.id, amount, reason, meta);
    if (result.success) {
      setBalance(prev => prev - amount);
      setTotalSpent(prev => prev + amount);
    }
    return result.success;
  }, [user?.id, balance]);

  const canEarnLikeCoins = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    const { canLike } = await coinService.checkDailyLikeLimit(user.id);
    return canLike;
  }, [user?.id]);

  const recordLikeCoinEarned = useCallback(async () => {
    if (!user?.id) return;
    await coinService.incrementDailyLikeCount(user.id);
  }, [user?.id]);

  const generateReferral = useCallback(async (): Promise<string | null> => {
    if (!user?.id) return null;
    const result = await coinService.generateReferralCode(user.id);
    if (result.code) {
      setReferralCode(result.code);
      return result.code;
    }
    return null;
  }, [user?.id]);

  return (
    <CoinContext.Provider
      value={{
        balance,
        totalEarned,
        totalSpent,
        currentStreak,
        maxStreak,
        loading,
        coinAnimation,
        referralCode,
        earnCoins: handleEarnCoins,
        spendCoins: handleSpendCoins,
        refreshWallet,
        showCoinAnimation,
        canEarnLikeCoins,
        recordLikeCoinEarned,
        generateReferral,
      }}
    >
      {children}
    </CoinContext.Provider>
  );
}
