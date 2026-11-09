import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { Logo } from '../common/Logo';
import { TriStripe } from '../common/TriStripe';
import { StatusChip } from '../common/StatusChip';
import { CATEGORIES } from '../../data/mockData';
import { daysDiff, formatNaira, getJobStatus, STATUS_SORT_ORDER } from '../../utils/helpers';
import { Search, MapPin } from 'lucide-react';
import { CareersFilter } from '../../types';

export const CareersView: React.FC = () => {
  const { jobs, clients, openModal, careersFilter, setCareersFilter } = useApp();

  const publishedJobs = useMemo(() => {
    return jobs.filter(j => j.listing.published && j.state !== 'draft');
  }, [jobs]);

  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(publishedJobs.map(j => j.location)));
  }, [publishedJobs]);

  const filteredJobs = useMemo(() => {
    const q = careersFilter.q.trim().toLowerCase();
    const loc = careersFilter.loc;
    const cat = careersFilter.cat;
    const type = careersFilter.type;
    const stFilter = careersFilter.status;

    return publishedJobs
      .filter(j => {
        const st = getJobStatus(j);

        if (loc && j.location !== loc) return false;
        if (cat && j.category !== cat) return false;
        if (type && j.type !== type) return false;

        if (stFilter === 'open' && st !== 'Open') return false;
        if (stFilter === 'soon' && st !== 'Closing soon') return false;
        if (stFilter === 'done' && st !== 'Filled' && st !== 'Closed') return false;

        if (q) {
          const haystack = (
            j.title +
            ' ' +
            j.category +
            ' ' +
            j.location +
            ' ' +
            j.must.concat(j.nice).map(m => m.label).join(' ')
          ).toLowerCase();
          const queryWords = q.split(/\s+/).filter(Boolean);
          if (!queryWords.every(word => haystack.includes(word))) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const stA = getJobStatus(a);
        const stB = getJobStatus(b);
        const diffStatus = (STATUS_SORT_ORDER[stA] ?? 9) - (STATUS_SORT_ORDER[stB] ?? 9);
        if (diffStatus !== 0) return diffStatus;
        return daysDiff(a.closes) - daysDiff(b.closes);
      });
  }, [publishedJobs, careersFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const listingsEl = document.getElementById('listings');
    if (listingsEl) {
      listingsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const clearFilters = () => {
    setCareersFilter({
      q: '',
      loc: '',
      cat: '',
      type: '',
      status: 'all'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PublicHeader />

      {/* Hero Section */}
      <section className="hero">
        <div className="gut">
          <div className="inner hero-grid">
            <div>
              <p className="eyebrow">Careers · Nigeria and remote</p>
              <h1 className="caps">
                Your next role, tracked from <em>first click</em> to first day.
              </h1>
              <p className="lead">
                Cube Tech Consults places professionals with vetted employers. Apply once,
                get a reference number, and check where you stand whenever you like.
              </p>

              <form className="searchbar" onSubmit={handleSearchSubmit} role="search">
                <div>
                  <label className="sr" htmlFor="f-q">
                    Job title or skill
                  </label>
                  <input
                    id="f-q"
                    type="search"
                    placeholder="Job title or skill (e.g. Node.js, Fleet, CRM)"
                    value={careersFilter.q}
                    onChange={e =>
                      setCareersFilter(prev => ({ ...prev, q: e.target.value }))
                    }
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="sr" htmlFor="f-loc">
                    Location
                  </label>
                  <select
                    id="f-loc"
                    value={careersFilter.loc}
                    onChange={e =>
                      setCareersFilter(prev => ({ ...prev, loc: e.target.value }))
                    }
                  >
                    <option value="">All locations</option>
                    {uniqueLocations.map(l => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="btn primary" type="submit">
                  <Search size={16} /> Search roles
                </button>
              </form>
            </div>

            <div className="hero-mark">
              <Logo size={280} />
            </div>
          </div>
        </div>
        <TriStripe />
      </section>

      {/* Roles Section */}
      <section className="section gut">
        <div className="inner">
          <div className="sec-head">
            <h2>Roles and their status</h2>
            <span className="muted" id="count">
              {filteredJobs.length} {filteredJobs.length === 1 ? 'role' : 'roles'} shown
            </span>
          </div>

          <div className="filters">
            <div className="pills" role="group" aria-label="Role status">
              {[
                ['all', 'All'],
                ['open', 'Open'],
                ['soon', 'Closing soon'],
                ['done', 'Filled or closed']
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className="pill"
                  aria-pressed={careersFilter.status === key}
                  onClick={() =>
                    setCareersFilter(prev => ({
                      ...prev,
                      status: key as CareersFilter['status']
                    }))
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="sr" htmlFor="f-cat">
              Category
            </label>
            <select
              id="f-cat"
              value={careersFilter.cat}
              onChange={e =>
                setCareersFilter(prev => ({ ...prev, cat: e.target.value }))
              }
            >
              <option value="">All categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label className="sr" htmlFor="f-type">
              Work type
            </label>
            <select
              id="f-type"
              value={careersFilter.type}
              onChange={e =>
                setCareersFilter(prev => ({ ...prev, type: e.target.value }))
              }
            >
              <option value="">Any work type</option>
              <option value="Full-time">Full-time</option>
              <option value="Contract">Contract</option>
            </select>
          </div>

          <div id="listings">
            {filteredJobs.length ? (
              <div className="jobs">
                {filteredJobs.map(job => {
                  const st = getJobStatus(job);
                  const client = clients.find(c => c.id === job.clientId);
                  const isDone = st === 'Filled' || st === 'Closed';
                  const left = daysDiff(job.closes);
                  const whenText =
                    st === 'Filled'
                      ? 'Role filled'
                      : st === 'Closed'
                      ? 'Applications closed'
                      : left === 0
                      ? 'Closes today'
                      : `Closes in ${left} day${left === 1 ? '' : 's'}`;

                  return (
                    <article
                      key={job.id}
                      className={`card job ${isDone ? 'dim' : ''}`}
                    >
                      <div className="row spread">
                        <StatusChip status={st} />
                        <span className="xs muted">{whenText}</span>
                      </div>
                      <h3>
                        <button
                          type="button"
                          onClick={() =>
                            openModal({ type: 'job', id: job.id, mode: 'detail' })
                          }
                        >
                          {job.title}
                        </button>
                      </h3>
                      <p className="muted">
                        {job.listing.confidential
                          ? `Confidential client · ${client ? client.industry : 'Corporate'}`
                          : client?.name}
                      </p>
                      <ul className="meta">
                        <li>
                          <MapPin size={15} />
                          {job.location}
                        </li>
                        <li>{job.type}</li>
                        <li>{job.category}</li>
                        {job.listing.showSalary && (
                          <li>
                            {formatNaira(job.salary[0])} to {formatNaira(job.salary[1])} a
                            month
                          </li>
                        )}
                      </ul>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty">
                <b>No roles match these filters.</b>
                <p style={{ marginTop: '6px' }}>Clear a filter or search a broader skill.</p>
                <p style={{ marginTop: '12px' }}>
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3 Steps section */}
      <section className="section gut" style={{ paddingTop: '8px' }}>
        <div className="inner">
          <div className="steps3">
            <div className="card">
              <b>1</b>
              <h3 className="caps" style={{ margin: '8px 0 6px', fontSize: '22px' }}>
                Apply once
              </h3>
              <p className="muted">
                Upload your CV as a PDF or DOCX, or use our Google Form, and answer three
                quick questions. We score every CV the same way against the role.
              </p>
            </div>
            <div className="card">
              <b>2</b>
              <h3 className="caps" style={{ margin: '8px 0 6px', fontSize: '22px' }}>
                Get a reference
              </h3>
              <p className="muted">
                Your reference number appears as soon as you submit. Keep it to check your
                status later.
              </p>
            </div>
            <div className="card">
              <b>3</b>
              <h3 className="caps" style={{ margin: '8px 0 6px', fontSize: '22px' }}>
                Track every step
              </h3>
              <p className="muted">
                Confirm a one-time code and see where your application stands, from
                received to placed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div style={{ marginTop: 'auto' }}>
        <PublicFooter />
      </div>
    </div>
  );
};
