import { Clock, ExternalLink, Filter, LayoutGrid, List, Newspaper, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

type NewsItem = {
  title: string;
  url: string;
  published_at: string;
  category: string;
};

const DISASTERS = ['flood', 'earthquake', 'hurricane', 'wildfire', 'landslide'];

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  flood:      { label: 'Flood',      icon: '🌊', color: '#3b82f6' },
  earthquake: { label: 'Earthquake', icon: '🌍', color: '#f59e0b' },
  hurricane:  { label: 'Hurricane',  icon: '🌀', color: '#8b5cf6' },
  wildfire:   { label: 'Wildfire',   icon: '🔥', color: '#ef4444' },
  landslide:  { label: 'Landslide',  icon: '⛰️', color: '#10b981' },
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  .news-root {
    --bg:          #0f1117;
    --surface:     #181c25;
    --surface-2:   #1e2330;
    --border:      #2a2f3d;
    --text-primary:#e8eaf0;
    --text-muted:  #6b7280;
    --text-dim:    #4b5563;
    --accent:      #c9a84c;
    --accent-soft: rgba(201,168,76,0.12);
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    min-height: 100vh;
    color: var(--text-primary);
  }

  /* ---------- HEADER ---------- */
  .nw-header {
    padding: 3.5rem 0 2.5rem;
    border-bottom: 1px solid var(--border);
    margin-bottom: 2rem;
  }
  .nw-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
    background: var(--accent-soft);
    border: 1px solid rgba(201,168,76,0.25);
    padding: 0.3rem 0.75rem;
    border-radius: 4px;
    margin-bottom: 1.25rem;
  }
  .nw-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: clamp(2rem, 4vw, 2.9rem);
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.01em;
    color: var(--text-primary);
    margin: 0 0 0.6rem;
  }
  .nw-subtitle {
    font-size: 0.9rem;
    color: var(--text-muted);
    font-weight: 300;
    margin: 0 0 1.75rem;
  }

  /* ---------- TOOLBAR ---------- */
  .nw-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .nw-filters {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .nw-filter-label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-right: 0.25rem;
  }
  .nw-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    border-radius: 100px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.18s ease;
    user-select: none;
  }
  .nw-chip:hover {
    border-color: #3a3f52;
    color: var(--text-primary);
  }
  .nw-chip.active {
    background: var(--accent-soft);
    border-color: rgba(201,168,76,0.45);
    color: var(--accent);
  }
  .nw-chip-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* ---------- ACTIONS (right side) ---------- */
  .nw-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .nw-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.18s ease;
  }
  .nw-icon-btn:hover, .nw-icon-btn.active {
    border-color: #3a3f52;
    color: var(--text-primary);
    background: var(--surface-2);
  }
  .nw-refresh-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.45rem 1rem;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-muted);
    font-size: 0.8rem;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.18s ease;
  }
  .nw-refresh-btn:hover {
    color: var(--text-primary);
    border-color: #3a3f52;
    background: var(--surface-2);
  }
  .nw-refresh-btn.spinning svg {
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ---------- STATUS STRIP ---------- */
  .nw-status {
    padding: 0.75rem 1.1rem;
    border-radius: 8px;
    font-size: 0.82rem;
    margin-bottom: 1.5rem;
  }
  .nw-status.loading { background: rgba(59,130,246,0.08); color: #60a5fa; border: 1px solid rgba(59,130,246,0.15); }
  .nw-status.error   { background: rgba(239,68,68,0.08);  color: #f87171; border: 1px solid rgba(239,68,68,0.15); }

  /* ---------- RESULT COUNT ---------- */
  .nw-count {
    font-size: 0.78rem;
    color: var(--text-dim);
    margin-bottom: 1.25rem;
    font-weight: 400;
  }
  .nw-count strong { color: var(--text-muted); font-weight: 600; }

  /* ---------- GRID ---------- */
  .nw-grid {
    display: grid;
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }
  .nw-grid.grid-cols {
    grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  }
  .nw-grid.list-cols {
    grid-template-columns: 1fr;
  }

  /* ---------- CARD ---------- */
  .nw-card {
    background: var(--surface);
    padding: 1.5rem;
    transition: background 0.15s ease;
    cursor: default;
  }
  .nw-card:hover { background: var(--surface-2); }

  .nw-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.85rem;
  }
  .nw-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    border-width: 1px;
    border-style: solid;
  }
  .nw-date {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.72rem;
    color: var(--text-dim);
  }
  .nw-card-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.02rem;
    font-weight: 600;
    line-height: 1.45;
    color: var(--text-primary);
    margin: 0 0 1rem;
    letter-spacing: -0.01em;
  }
  /* List view title is bigger */
  .list-cols .nw-card-title {
    font-size: 1.12rem;
  }
  .nw-read-link {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--accent);
    text-decoration: none;
    letter-spacing: 0.04em;
    transition: opacity 0.15s;
  }
  .nw-read-link:hover { opacity: 0.75; }

  /* ---------- EMPTY ---------- */
  .nw-empty {
    text-align: center;
    padding: 5rem 1rem;
    color: var(--text-dim);
    border: 1px solid var(--border);
    border-radius: 12px;
  }
  .nw-empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
  .nw-empty p { font-size: 0.9rem; }

  /* ---------- DIVIDER (list mode) ---------- */
  .list-cols .nw-card + .nw-card {
    border-top: 1px solid var(--border);
  }
`;

export default function News() {
  const [news, setNews]               = useState<NewsItem[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [viewMode, setViewMode]       = useState<'grid' | 'list'>('grid');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(DISASTERS));

  // ── unchanged backend logic ──────────────────────────────────────────────
  const fetchAllNews = async () => {
    try {
      setLoading(true);
      setError(null);

      const requests = DISASTERS.map((type) =>
        fetch(`http://localhost:5000/news/latest?disaster=${type}&limit=2`)
          .then((res) => {
            if (!res.ok) throw new Error(`Failed ${type}`);
            return res.json();
          })
          .then((data) => ({ type, items: data.news || [] }))
      );

      const results = await Promise.all(requests);

      const allNews: NewsItem[] = results.flatMap((r) =>
        r.items.map((item: any) => ({
          title:        item.title,
          url:          item.url,
          published_at: item.published_at,
          category:     r.type,
        }))
      );

      allNews.sort(() => Math.random() - 0.5);
      setNews(allNews);
    } catch (err: any) {
      setError(err.message || 'Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllNews(); }, []);
  // ────────────────────────────────────────────────────────────────────────

  const toggleFilter = (cat: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size === 1) return prev;  // keep at least one active
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const visible = news.filter((n) => activeFilters.has(n.category));

  return (
    <>
      <style>{styles}</style>

      <div className="news-root">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem 4rem' }}>

          {/* ── HEADER ── */}
          <header className="nw-header">
            <div className="nw-eyebrow">
              <Newspaper size={10} />
              Disaster Intelligence
            </div>

            <h1 className="nw-title">Global Disaster<br />News Feed</h1>
            <p className="nw-subtitle">Real-time updates from verified international sources</p>

            {/* ── TOOLBAR ── */}
            <div className="nw-toolbar">
              {/* Category filter chips */}
              <div className="nw-filters">
                <span className="nw-filter-label">
                  <Filter size={11} /> Filter
                </span>
                {DISASTERS.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const on   = activeFilters.has(cat);
                  return (
                    <button
                      key={cat}
                      className={`nw-chip${on ? ' active' : ''}`}
                      onClick={() => toggleFilter(cat)}
                    >
                      <span
                        className="nw-chip-dot"
                        style={{ background: on ? meta.color : '#374151' }}
                      />
                      {meta.icon} {meta.label}
                    </button>
                  );
                })}
              </div>

              {/* View toggle + refresh */}
              <div className="nw-actions">
                <button
                  className={`nw-icon-btn${viewMode === 'grid' ? ' active' : ''}`}
                  title="Grid view"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  className={`nw-icon-btn${viewMode === 'list' ? ' active' : ''}`}
                  title="List view"
                  onClick={() => setViewMode('list')}
                >
                  <List size={15} />
                </button>

                <button
                  className={`nw-refresh-btn${loading ? ' spinning' : ''}`}
                  onClick={fetchAllNews}
                  disabled={loading}
                >
                  <RefreshCw size={13} />
                  {loading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
            </div>
          </header>

          {/* ── STATUS ── */}
          {loading && !news.length && (
            <div className="nw-status loading">Fetching latest reports across all categories…</div>
          )}
          {error && (
            <div className="nw-status error">⚠ {error}</div>
          )}

          {/* ── COUNT ── */}
          {!loading && visible.length > 0 && (
            <p className="nw-count">
              Showing <strong>{visible.length}</strong> of {news.length} articles
            </p>
          )}

          {/* ── CARDS ── */}
          {visible.length > 0 ? (
            <div className={`nw-grid ${viewMode === 'grid' ? 'grid-cols' : 'list-cols'}`}>
              {visible.map((item, i) => {
                const meta = CATEGORY_META[item.category] ?? { label: item.category, icon: '📰', color: '#6b7280' };
                return (
                  <article key={i} className="nw-card">
                    <div className="nw-card-top">
                      <span
                        className="nw-badge"
                        style={{
                          color:           meta.color,
                          borderColor:     meta.color + '33',
                          backgroundColor: meta.color + '14',
                        }}
                      >
                        {meta.icon} {meta.label}
                      </span>

                      <div className="nw-date">
                        <Clock size={10} />
                        {item.published_at
                          ? new Date(item.published_at).toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })
                          : 'Recent'}
                      </div>
                    </div>

                    <h3 className="nw-card-title">{item.title}</h3>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="nw-read-link"
                    >
                      Read article <ExternalLink size={11} />
                    </a>
                  </article>
                );
              })}
            </div>
          ) : !loading && (
            <div className="nw-empty">
              <div className="nw-empty-icon">🔍</div>
              <p>No articles match the selected filters.</p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
