import React from 'react';
import { useApp } from '../../context/AppContext';
import { StaffShell } from './StaffShell';
import { daysDiff, formatDate, formatNaira } from '../../utils/helpers';
import { Placement } from '../../types';

export const PlacementsView: React.FC = () => {
  const {
    placements,
    clients,
    updatePlacementInvoice,
    openReplacementSearch
  } = useApp();

  return (
    <StaffShell
      title="Placements"
      sub="Fees are calculated as Monthly pay × 12 × client agreed percentage."
    >
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
                      style={{ minWidth: '110px' }}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
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
