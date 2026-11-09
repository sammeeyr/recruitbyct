import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffShell } from './StaffShell';
import { LOCATIONS } from '../../data/mockData';
import {
  daysDiff,
  evaluateCandidate,
  getScoreClass
} from '../../utils/helpers';
import { Candidate } from '../../types';

export const TalentPoolView: React.FC = () => {
  const {
    candidates,
    jobs,
    poolFilter,
    setPoolFilter,
    openModal,
    reengageCandidate
  } = useApp();

  const activeJobs = jobs.filter(j => j.state !== 'filled' && j.state !== 'closed');
  const targetRankingJob = activeJobs.find(j => j.id === poolFilter.jobId);

  const filteredCandidates = useMemo(() => {
    const q = poolFilter.q.trim().toLowerCase();
    const loc = poolFilter.loc;

    let rows: { candidate: Candidate; matchScore: number | null }[] = candidates
      .filter(c => {
        if (loc && c.loc !== loc) return false;
        if (q) {
          const haystack = (c.name + ' ' + c.headline + ' ' + c.skills.join(' ')).toLowerCase();
          const queryWords = q.split(/\s+/).filter(Boolean);
          if (!queryWords.every(word => haystack.includes(word))) return false;
        }
        return true;
      })
      .map(c => {
        const score = targetRankingJob
          ? evaluateCandidate(targetRankingJob, c).score
          : null;
        return { candidate: c, matchScore: score };
      });

    if (targetRankingJob) {
      rows.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }

    return rows;
  }, [candidates, poolFilter, targetRankingJob]);

  return (
    <StaffShell
      title="Talent pool"
      sub={`${candidates.length} candidates, each parsed once and searchable for every job order.`}
    >
      <div className="tools">
        <div className="field grow">
          <label htmlFor="pq">Search name, title or skill</label>
          <input
            id="pq"
            type="search"
            value={poolFilter.q}
            onChange={e =>
              setPoolFilter(prev => ({ ...prev, q: e.target.value }))
            }
            placeholder="e.g. CRM, fleet, Node.js, Accounting"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="pl">Location</label>
          <select
            id="pl"
            value={poolFilter.loc}
            onChange={e =>
              setPoolFilter(prev => ({ ...prev, loc: e.target.value }))
            }
          >
            <option value="">All locations</option>
            {LOCATIONS.map(l => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="pm">Rank against a job order</label>
          <select
            id="pm"
            value={poolFilter.jobId}
            onChange={e =>
              setPoolFilter(prev => ({ ...prev, jobId: e.target.value }))
            }
          >
            <option value="">No ranking</option>
            {activeJobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="tbl">
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Location</th>
              <th className="num">Experience</th>
              <th>Top skills</th>
              <th>Available</th>
              <th>Last verified</th>
              <th>Drive copy</th>
              {targetRankingJob && <th className="num">Match</th>}
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map(({ candidate: c, matchScore }) => {
                const daysSinceVerified = -daysDiff(c.verified);
                const isStale = daysSinceVerified > 90;

                return (
                  <tr key={c.id}>
                    <td>
                      <button
                        type="button"
                        className="name"
                        onClick={() => openModal({ type: 'cand', id: c.id })}
                      >
                        {c.name}
                      </button>
                      <div className="muted xs">{c.headline}</div>
                    </td>
                    <td>{c.loc}</td>
                    <td className="num">{c.years} yrs</td>
                    <td>
                      <div className="skills" style={{ margin: 0 }}>
                        {c.skills.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="chip">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{c.avail ? `In ${c.avail} days` : 'Now'}</td>
                    <td>
                      {isStale ? (
                        <>
                          <span className="chip warn">{daysSinceVerified} days ago</span>{' '}
                          <button
                            type="button"
                            className="linkbtn xs"
                            onClick={() => reengageCandidate(c.id)}
                          >
                            Re-engage
                          </button>
                        </>
                      ) : (
                        `${daysSinceVerified} days ago`
                      )}
                    </td>
                    <td>
                      <span className={`chip ${c.drive === 'synced' ? 'good' : 'warn'}`}>
                        {c.drive === 'synced' ? 'Synced' : 'Queued'}
                      </span>
                    </td>
                    {targetRankingJob && matchScore !== null && (
                      <td className="num">
                        <span className={`score ${getScoreClass(matchScore)}`}>
                          {matchScore}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={targetRankingJob ? 8 : 7} className="muted" style={{ padding: '24px' }}>
                  No candidates match these criteria. Try adjusting your search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </StaffShell>
  );
};
