import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffShell } from './StaffShell';
import { daysDiff, formatDate, formatNaira } from '../../utils/helpers';
import { Placement } from '../../types';
import { CreditCard, CheckCircle2 } from 'lucide-react';

export const PlacementsView: React.FC = () => {
  const {
    placements,
    clients,
    updatePlacementInvoice,
    openReplacementSearch,
    showToast
  } = useApp();

  const [activePaystackInvoice, setActivePaystackInvoice] = useState<{
    id: string;
    url: string;
    ref: string;
    amount: number;
  } | null>(null);

  const generatePaystackInvoice = async (p: Placement) => {
    const client = clients.find(c => c.id === p.clientId);
    const feePercent = client ? client.fee : 15;
    const feeAmount = (p.salary * 12 * feePercent) / 100;
    const invoiceRef = `INV-CTC-${p.id}`;
    const payUrl = `https://checkout.paystack.com/pay-${invoiceRef.toLowerCase()}`;

    setActivePaystackInvoice({
      id: p.id,
      url: payUrl,
      ref: invoiceRef,
      amount: feeAmount
    });

    if (p.invoice === 'Draft') {
      updatePlacementInvoice(p.id, 'Sent');
    }

    try {
      await navigator.clipboard.writeText(payUrl);
      showToast(`Paystack invoice ${invoiceRef} (₦${feeAmount.toLocaleString()}) created & checkout link copied!`);
    } catch {
      showToast(`Paystack invoice generated: ${invoiceRef} (₦${feeAmount.toLocaleString()})`);
    }
  };

  return (
    <StaffShell
      title="Placements & Invoicing"
      sub="Fees are calculated as Monthly pay × 12 × client agreed percentage. Powered by Paystack for direct Naira collection."
    >
      {activePaystackInvoice && (
        <div className="banner" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <b>Paystack Invoice Generated:</b> <span className="mono">{activePaystackInvoice.ref}</span> · Amount: <b>{formatNaira(activePaystackInvoice.amount)}</b>
            <div className="xs muted" style={{ marginTop: '2px' }}>
              Checkout URL: <span className="mono">{activePaystackInvoice.url}</span>
            </div>
          </div>
          <div className="row" style={{ gap: '8px' }}>
            <button
              type="button"
              className="btn dark sm"
              onClick={() => {
                navigator.clipboard.writeText(activePaystackInvoice.url);
                showToast('Paystack link copied to clipboard.');
              }}
            >
              Copy Link
            </button>
            <button
              type="button"
              className="btn primary sm"
              onClick={() => {
                updatePlacementInvoice(activePaystackInvoice.id, 'Paid');
                setActivePaystackInvoice(null);
                showToast('Payment confirmed. Invoice marked as Paid.');
              }}
            >
              Mark as Paid
            </button>
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => setActivePaystackInvoice(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="tbl">
        <table>
          <thead>
            <tr>
              <th>Placed candidate</th>
              <th>Client</th>
              <th>Start date</th>
              <th className="num">Monthly pay</th>
              <th className="num">Fee</th>
              <th>Invoice</th>
              <th>Paystack Billing</th>
              <th>Guarantee</th>
            </tr>
          </thead>
          <tbody>
            {placements.map(p => {
              const client = clients.find(c => c.id === p.clientId);
              const feePercent = client ? client.fee : 15;
              const feeAmount = (p.salary * 12 * feePercent) / 100;
              const usedDays = -daysDiff(p.start);
              const remainingDays = p.guarantee - usedDays;
              const progressPct = Math.max(
                0,
                Math.min(100, (usedDays / p.guarantee) * 100)
              );

              return (
                <tr key={p.id}>
                  <td>
                    <b>{p.name}</b>
                    <div className="muted xs">{p.title}</div>
                  </td>
                  <td>{client?.name}</td>
                  <td>{formatDate(p.start)}</td>
                  <td className="num">{formatNaira(p.salary)}</td>
                  <td className="num">
                    <b>{formatNaira(feeAmount)}</b>
                    <div className="muted xs">
                      {feePercent}% of {formatNaira(p.salary * 12)}
                    </div>
                  </td>
                  <td>
                    <label className="sr" htmlFor={`inv-${p.id}`}>
                      Invoice status
                    </label>
                    <select
                      id={`inv-${p.id}`}
                      value={p.invoice}
                      onChange={e =>
                        updatePlacementInvoice(
                          p.id,
                          e.target.value as Placement['invoice']
                        )
                      }
                      style={{ minWidth: '100px' }}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </td>
                  <td>
                    {p.invoice === 'Paid' ? (
                      <span className="chip good" style={{ gap: '4px' }}>
                        <CheckCircle2 size={12} /> Paid
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn ghost sm"
                        style={{ gap: '6px', fontSize: '12px', minHeight: '30px' }}
                        onClick={() => generatePaystackInvoice(p)}
                      >
                        <CreditCard size={13} /> Paystack Link
                      </button>
                    )}
                  </td>
                  <td style={{ minWidth: '150px' }}>
                    {p.status === 'left' ? (
                      <>
                        <span className="chip red">Left on day {p.leftDay}</span>
                        <div>
                          <button
                            type="button"
                            className="linkbtn xs"
                            onClick={() => openReplacementSearch(p.id)}
                            style={{ marginTop: '4px' }}
                          >
                            Open replacement search
                          </button>
                        </div>
                      </>
                    ) : usedDays < 0 ? (
                      <span className="chip">Not started</span>
                    ) : remainingDays < 0 ? (
                      <span className="chip good">Guarantee ended</span>
                    ) : (
                      <>
                        <div
                          className={`progress ${remainingDays <= 14 ? 'warn' : ''}`}
                          role="img"
                          aria-label={`${remainingDays} days of guarantee left`}
                        >
                          <u style={{ width: `${progressPct}%` }} />
                        </div>
                        <span className="xs muted">{remainingDays} days left</span>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </StaffShell>
  );
};
