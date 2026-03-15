import { getCurrency } from '../../data/currencies';
import { formatMoney } from '../../engine/economy';

interface CurrencyDisplayProps {
  id: 'dirty' | 'clean';
  amount: number;
  rate?: number;         // per-tick rate (shown as +$X/s)
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;   // show currency name below
}

const SIZES = {
  sm: { icon: 'text-base', amount: 'text-sm', rate: 'text-[10px]' },
  md: { icon: 'text-xl', amount: 'text-base', rate: 'text-[10px]' },
  lg: { icon: 'text-3xl', amount: 'text-xl', rate: 'text-sm' },
};

export default function CurrencyDisplay({ id, amount, rate, size = 'md', showLabel }: CurrencyDisplayProps) {
  const currency = getCurrency(id);
  const s = SIZES[size];

  return (
    <div className="flex items-center gap-1.5">
      <span className={s.icon}>{currency.icon}</span>
      <div>
        <p className={`text-white font-bold ${s.amount} leading-none`}>{formatMoney(amount)}</p>
        {rate !== undefined && rate !== 0 ? (
          <p className={`${s.rate} leading-none ${rate > 0 ? currency.color : 'text-gray-500'}`}>
            {rate > 0 ? `+${formatMoney(rate)}/s` : `${formatMoney(rate)}/s`}
          </p>
        ) : showLabel ? (
          <p className={`${s.rate} leading-none text-gray-500`}>{currency.name.toLowerCase()}</p>
        ) : null}
      </div>
    </div>
  );
}
