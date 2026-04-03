import { useContext } from 'react';
import { CoinContext, CoinContextType } from '../contexts/CoinContext';

export function useCoin(): CoinContextType {
  const context = useContext(CoinContext);
  if (!context) throw new Error('useCoin must be used within CoinProvider');
  return context;
}
