import { formatUSD, formatBs } from '@/lib/format';

interface OrderSummaryProps {
  subtotal: number;
  discount: number;
  deliveryCost: number;
  totalPaid: number;
  exchangeRate: number;
}

export function OrderSummary({
  subtotal,
  discount,
  deliveryCost,
  totalPaid,
  exchangeRate,
}: OrderSummaryProps) {
  const total = subtotal - discount + deliveryCost;
  const totalBs = total * exchangeRate;
  const difference = total - totalPaid;
  const isComplete = difference <= 0.01;
  const change = Math.abs(difference);
  const changeBs = change * exchangeRate;

  return (
    <div className="bg-alonzo-gray-200 p-4 mt-5 space-y-1.5">
      <Row label="SUBTOTAL PRODUCTOS" value={formatUSD(subtotal)} />
      <Row label="DESCUENTO" value={`- ${formatUSD(discount)}`} className="text-alonzo-danger font-bold" />
      <Row label="COSTO ENVÍO" value={formatUSD(deliveryCost)} />
      <Row label="TOTAL PAGADO" value={formatUSD(totalPaid)} />

      {/* Total USD */}
      <div className="flex justify-between items-start border-t border-alonzo-gray-300 pt-2.5 mt-2.5">
        <span className="text-xs font-bold text-alonzo-black mt-0.5">TOTAL A PAGAR ($):</span>
        <span className="text-[15px] font-bold text-alonzo-black">{formatUSD(total)}</span>
      </div>

      {/* Total Bs */}
      <div className="flex justify-between items-start pt-1">
        <span className="text-xs font-bold text-alonzo-black mt-0.5">TOTAL A PAGAR (Bs):</span>
        <span className="text-[15px] font-bold text-alonzo-black">{formatBs(totalBs)}</span>
      </div>

      {/* Remaining / Change */}
      <div className={`flex justify-between items-start pt-1 ${isComplete ? 'text-alonzo-success' : 'text-alonzo-danger'}`}>
        <span className="text-xs font-bold mt-0.5">
          {isComplete ? (change > 0.01 ? 'SU VUELTO:' : 'ESTADO:') : 'RESTANTE:'}
        </span>
        <div className="text-right">
          <span className="text-sm font-bold block">
            {isComplete
              ? change > 0.01
                ? formatUSD(change)
                : '¡COMPLETADO!'
              : formatUSD(difference)}
          </span>
          {!isComplete && (
            <span className="text-xs opacity-80 font-normal block">
              {formatBs(difference * exchangeRate)}
            </span>
          )}
          {isComplete && change > 0.01 && (
            <span className="text-xs opacity-80 font-normal block">
              {formatBs(changeBs)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex justify-between text-xs text-alonzo-gray-600 ${className}`}>
      <span>{label}:</span>
      <span>{value}</span>
    </div>
  );
}
