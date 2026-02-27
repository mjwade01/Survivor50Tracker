import { useState, useEffect, useRef } from 'react'
import { players as initialPlayers } from './data/players'

// ==========================================================================
// COUNTDOWN TIMER — Road to the 50th Season
// ==========================================================================
function CountdownTimer() {
  // Premiere: Wednesday, February 25th, 2026 at 7:00 PM CST (UTC-6)
  const premiereDate = new Date('2026-02-25T19:00:00-06:00');

  const calcTimeLeft = () => {
    const now = new Date();
    const diff = premiereDate - now;
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      expired: false
    };
  };

  const [timeLeft, setTimeLeft] = useState(calcTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (timeLeft.expired) {
    return (
      <div className="countdown-section">
        <div className="countdown-label">🔥 The 50th Season Has Begun! 🔥</div>
      </div>
    );
  }

  return (
    <div className="countdown-section">
      <div className="countdown-label">Road to the 50th Season</div>
      <div className="countdown-timer">
        <div className="countdown-unit">
          <span className="countdown-value">{String(timeLeft.days).padStart(2, '0')}</span>
          <span className="countdown-unit-label">Days</span>
        </div>
        <div className="countdown-unit">
          <span className="countdown-value">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="countdown-unit-label">Hours</span>
        </div>
        <div className="countdown-unit">
          <span className="countdown-value">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="countdown-unit-label">Min</span>
        </div>
        <div className="countdown-unit">
          <span className="countdown-value">{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="countdown-unit-label">Sec</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// HYPE BUTTON — Per-player upvote with localStorage
// ==========================================================================
function HypeButton({ playerId }) {
  const storageKey = 'survivor_50_hype';

  const getHypeCounts = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch { return {}; }
  };

  const [count, setCount] = useState(() => getHypeCounts()[playerId] || 0);
  const [animating, setAnimating] = useState(false);

  const handleHype = (e) => {
    e.stopPropagation();
    const newCount = count + 1;
    setCount(newCount);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);

    const all = getHypeCounts();
    all[playerId] = newCount;
    localStorage.setItem(storageKey, JSON.stringify(all));
  };

  return (
    <div className="hype-meter">
      <button
        className={`hype-btn ${animating ? 'hyped' : ''}`}
        onClick={handleHype}
        title="Hype this player!"
      >
        🔥
      </button>
      {count > 0 && <span className="hype-count">{count}</span>}
    </div>
  );
}

// ==========================================================================
// MAIN APP
// ==========================================================================
function App() {
  const [tribeFilter, setTribeFilter] = useState('All');
  const [eraFilter, setEraFilter] = useState('All');

  // Persistence
  const saveToStats = (key, data) => {
    localStorage.setItem(`survivor_50_${key}`, JSON.stringify(data));
  };

  const [playerList, setPlayerList] = useState(() => {
    const saved = localStorage.getItem('survivor_50_players');
    if (saved) {
      // Merge saved data with any new fields from initialPlayers
      const savedPlayers = JSON.parse(saved);
      return savedPlayers.map(sp => {
        const init = initialPlayers.find(ip => ip.id === sp.id);
        return init ? { ...init, ...sp, originalSeason: init.originalSeason, era: init.era, daysPlayed: init.daysPlayed } : sp;
      });
    }
    return initialPlayers;
  });

  const [tribes, setTribes] = useState(() => {
    const saved = localStorage.getItem('survivor_50_tribes');
    return saved ? JSON.parse(saved) : [
      { name: 'Cila', color: '#ff8c00' },
      { name: 'Kalo', color: '#008080' },
      { name: 'Vatu', color: '#9b30ff' }
    ];
  });

  const [challengeLog, setChallengeLog] = useState(() => {
    const saved = localStorage.getItem('survivor_50_log');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { saveToStats('players', playerList); }, [playerList]);
  useEffect(() => { saveToStats('tribes', tribes); }, [tribes]);
  useEffect(() => { saveToStats('log', challengeLog); }, [challengeLog]);

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showTribeManager, setShowTribeManager] = useState(false);

  // Combined filtering: tribe + era
  const filteredPlayers = playerList.filter(p => {
    const tribeMatch = tribeFilter === 'All' || p.tribe === tribeFilter;
    let eraMatch = true;
    if (eraFilter === 'Old School') eraMatch = p.originalSeason >= 1 && p.originalSeason <= 20;
    else if (eraFilter === 'Middle Era') eraMatch = p.originalSeason >= 21 && p.originalSeason <= 40;
    else if (eraFilter === 'New Era') eraMatch = p.originalSeason >= 41;
    return tribeMatch && eraMatch;
  });

  const toggleStatus = (id, e) => {
    e.stopPropagation();
    setPlayerList(prev => {
      const player = prev.find(p => p.id === id);
      if (!player) return prev;

      let newStatus;
      if (player.status === 'Active') newStatus = 'Voted Out';
      else if (player.status === 'Voted Out') newStatus = 'Medically Evacuated';
      else newStatus = 'Active';

      let updatedList = [...prev];

      if (newStatus === 'Voted Out' || newStatus === 'Medically Evacuated') {
        const boomerangIdols = player.advantages.filter(a => a.type === 'Boomerang Idol');
        if (boomerangIdols.length > 0) {
          boomerangIdols.forEach(idol => {
            if (idol.originalFinderId && idol.originalFinderId !== id) {
              updatedList = updatedList.map(p => {
                if (p.id === idol.originalFinderId) {
                  return { ...p, advantages: [...p.advantages, idol] };
                }
                return p;
              });
            }
          });

          updatedList = updatedList.map(p => {
            if (p.id === id) {
              return { ...p, advantages: p.advantages.filter(a => a.type !== 'Boomerang Idol') };
            }
            return p;
          });
        }
      }

      return updatedList.map(p =>
        p.id === id ? { ...p, status: newStatus } : p
      );
    });
  };

  const handleUpdatePlayer = (updatedPlayer) => {
    setPlayerList(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
    setSelectedPlayer(null);
  };

  const handleTransferAdvantage = (fromId, toId, advantageId) => {
    setPlayerList(prev => {
      const fromPlayer = prev.find(p => p.id === fromId);
      if (!fromPlayer) return prev;
      const advToTransfer = fromPlayer.advantages.find(a => a.id === advantageId);
      if (!advToTransfer) return prev;

      return prev.map(p => {
        if (p.id === fromId) {
          return { ...p, advantages: p.advantages.filter(a => a.id !== advantageId) };
        }
        if (p.id === toId) {
          return { ...p, advantages: [...p.advantages, advToTransfer] };
        }
        return p;
      });
    });
    setSelectedPlayer(null); // Close modal
  };

  const handleLogAdventure = (winnerId, loserId, sentBackId) => {
    setPlayerList(prev => prev.map(p => {
      if (p.id === winnerId) {
        return {
          ...p,
          advantages: [...p.advantages, { id: Date.now(), name: "Block-a-Vote", type: "Extra Vote", status: "Active" }],
          adventures: [{ id: Date.now(), date: new Date().toLocaleDateString(), description: "Won the adventure competition.", outcome: "Block-a-Vote" }, ...p.adventures]
        };
      }
      if (p.id === loserId) {
        return {
          ...p,
          advantages: [...p.advantages, { id: Date.now() + 1, name: "Lost Vote", type: "Disadvantage", status: "Active" }],
          adventures: [{ id: Date.now() + 1, date: new Date().toLocaleDateString(), description: "Lost the adventure competition.", outcome: "Lost Vote" }, ...p.adventures]
        };
      }
      if (p.id === sentBackId) {
        return {
          ...p,
          adventures: [{ id: Date.now() + 2, date: new Date().toLocaleDateString(), description: "Sent back from the adventure without competing.", outcome: "None" }, ...p.adventures]
        };
      }
      return p;
    }));
    alert("Adventure logged successfully!");
  };

  const logChallengeResult = (type, winnerTribe, secondTribe = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const newEntry = { type, winner: winnerTribe, second: secondTribe, time: timestamp };
    setChallengeLog(prev => [newEntry, ...prev]);

    setPlayerList(prev => prev.map(player => {
      let updatedWins = { ...player.wins };
      if (player.tribe === winnerTribe) {
        updatedWins[type.toLowerCase()] += 1;
      }
      if (secondTribe && player.tribe === secondTribe) {
        updatedWins[type.toLowerCase()] += 0.5;
      }
      return { ...player, wins: updatedWins };
    }));
  };

  const handleUpdateTribe = (oldName, newTribeData) => {
    setTribes(prev => prev.map(t => t.name === oldName ? newTribeData : t));
    setPlayerList(prev => prev.map(p => p.tribe === oldName ? { ...p, tribe: newTribeData.name } : p));
    if (tribeFilter === oldName) setTribeFilter(newTribeData.name);
  };

  const exportData = () => {
    const data = { playerList, tribes, challengeLog };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `survivor_50_backup_${new Date().toLocaleDateString()}.json`;
    a.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.playerList) setPlayerList(data.playerList);
        if (data.tribes) setTribes(data.tribes);
        if (data.challengeLog) setChallengeLog(data.challengeLog);
        alert('Data imported successfully!');
      } catch (err) {
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const eraOptions = [
    { label: 'All Eras', value: 'All' },
    { label: 'Old School (1-20)', value: 'Old School' },
    { label: 'Middle Era (21-40)', value: 'Middle Era' },
    { label: 'New Era (41+)', value: 'New Era' },
  ];

  return (
    <div className="container">
      <header className="app-header">
        <h1 className="hero-title">Survivor 50</h1>
        <p className="hero-subtitle">The Greatest Game Ever Played</p>
        <img
          src="/pics/Survivor_50_logo.png"
          alt="Survivor 50 Logo"
          className="app-logo"
        />
        <CountdownTimer />
      </header>

      <main>
        {/* Era Filter Bar */}
        <div className="era-filters">
          {eraOptions.map(opt => (
            <button
              key={opt.value}
              className={`era-btn ${eraFilter === opt.value ? 'active' : ''}`}
              onClick={() => setEraFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="management-controls">
          <button className="tribe-mgr-toggle" onClick={() => setShowTribeManager(!showTribeManager)}>
            {showTribeManager ? 'Close Tribe Manager' : 'Open Tribe Manager'}
          </button>
        </div>

        {showTribeManager && (
          <TribeManager tribes={tribes} onUpdate={handleUpdateTribe} onAdd={(t) => setTribes([...tribes, t])} />
        )}

        {/* Tribe Filters */}
        <div className="tribe-filters">
          <button
            className={`filter-btn ${tribeFilter === 'All' ? 'active' : ''}`}
            onClick={() => setTribeFilter('All')}
          >
            All Tribes
          </button>
          {tribes.map(tribe => (
            <button
              key={tribe.name}
              className={`filter-btn ${tribeFilter === tribe.name ? 'active' : ''}`}
              style={{ borderColor: tribeFilter === tribe.name ? tribe.color : 'transparent', color: tribeFilter === tribe.name ? tribe.color : '' }}
              onClick={() => setTribeFilter(tribe.name)}
            >
              {tribe.name}
            </button>
          ))}
        </div>

        {/* Player Card Grid */}
        <div className="dashboard-grid">
          {filteredPlayers.map(player => {
            const tribeColor = tribes.find(t => t.name === player.tribe)?.color || 'var(--color-sand)';
            return (
              <div
                key={player.id}
                className={`player-card ${player.status === 'Voted Out' || player.status === 'Medically Evacuated' ? 'eliminated' : ''} ${player.status === 'Medically Evacuated' ? 'med-evac' : ''}`}
                style={{
                  '--tribe-color': tribeColor,
                  '--focal-point': player.focalPoint || '15%',
                  backgroundImage: `url(${player.image})`
                }}
                onClick={() => player.status === 'Active' && setSelectedPlayer(player)}
              >
                {/* Hype Meter — top left */}
                <HypeButton playerId={player.id} />

                <div className="card-overlay">
                  {/* Win Badges — top right (positioned via CSS) */}
                  <div className="win-badges">
                    {player.wins.immunity > 0 && <span className="win-badge immunity" title="Immunity Wins">🛡️ {player.wins.immunity}</span>}
                    {player.wins.reward > 0 && <span className="win-badge reward" title="Reward Wins">🏆 {player.wins.reward}</span>}
                    {player.totalVotes > 0 && <span className="win-badge votes" title="Votes Received">💀 {player.totalVotes}</span>}
                  </div>

                  <div className="player-name">{player.name.split(' ')[0]}</div>
                  <div className="player-meta">
                    {player.tribe} Tribe • {player.from}
                  </div>

                  {/* Season & Days Played Badges */}
                  <div className="metadata-badges">
                    <span className="meta-badge">S{player.originalSeason}</span>
                    <span className="meta-badge">{player.daysPlayed}d played</span>
                    <span className="meta-badge era-badge">{player.era}</span>
                  </div>

                  {/* Advantage Icons */}
                  <div className="advantage-icons">
                    {player.advantages.map((adv, idx) => (
                      <span key={idx} className={`icon-tag ${adv.type === 'Beware' ? 'beware' : 'idol'}`}>
                        {adv.type === 'Idol' ? '🛡️' : '⚠️'} {adv.name}
                      </span>
                    ))}
                    {player.alliances.length > 0 && (
                      <span className="icon-tag" style={{ borderColor: '#8ce', color: '#8ce' }}>
                        🤝 {player.alliances.join(', ')}
                      </span>
                    )}
                  </div>

                  <div className="status-container">
                    <span className={`player-status ${player.status === 'Voted Out' || player.status === 'Medically Evacuated' ? 'voted-out-tag' : ''} ${player.status === 'Medically Evacuated' ? 'med-evac-tag' : ''}`}>
                      {player.status}
                    </span>
                    <button
                      className="status-toggle"
                      onClick={(e) => toggleStatus(player.id, e)}
                      title="Toggle Status"
                    >
                      {player.status === 'Active' ? '🔥' : player.status === 'Voted Out' ? '🚑' : '🔄'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Persistence Controls */}
        <div className="management-controls persistence-partition">
          <div className="persistence-controls">
            <button className="btn-persist" onClick={exportData}>Export Data</button>
            <label className="btn-persist import-label">
              Import Data
              <input type="file" onChange={importData} style={{ display: 'none' }} accept=".json" />
            </label>
            <button className="btn-persist reset" onClick={() => { if (confirm('Reset all data?')) { localStorage.clear(); window.location.reload(); } }}>Reset</button>
          </div>
        </div>

        {/* Twists Section */}
        <section className="twist-tracker">
          <h2>Twists &amp; Global Advantages</h2>
          <div className="twists-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="twist-card">
              <h3>Billie Eilish Boomerang Idol</h3>
              <p>The "Billie Eilish Boomerang Idol" - a unique guest advantage. Details revealed during premiere.</p>
            </div>
            <div className="twist-card">
              <h3>Jimmy Fallon Modifier</h3>
              <p>Game element influenced by fan-voted results.</p>
            </div>
            <div className="twist-card">
              <h3>Zac Brown Tribe Visit</h3>
              <p>Special "Fish Delivery" visit by Zac Brown. A source of protein and morale for one lucky tribe.</p>
            </div>
            <div className="twist-card">
              <h3>MrBeast Mystery</h3>
              <p>High stakes mystery briefcase delivery arriving mid-season.</p>
            </div>
          </div>
        </section>

        {/* Game Actions */}
        <div className="management-controls game-actions-bottom">
          <ChallengePanel tribes={tribes} onLog={logChallengeResult} history={challengeLog} />
          <AdventurePanel players={playerList} onLogAdventure={handleLogAdventure} />
          <TribalCouncil tribes={tribes} players={playerList} onVotes={setPlayerList} />
        </div>
      </main >

      {/* Edit Modal */}
      {
        selectedPlayer && (
          <EditPlayerModal
            player={selectedPlayer}
            players={playerList}
            onClose={() => setSelectedPlayer(null)}
            onSave={handleUpdatePlayer}
            onTransfer={handleTransferAdvantage}
          />
        )
      }

      <footer style={{ textAlign: 'center', padding: '4rem', opacity: 0.4 }}>
        Built for the Survivor 50 Anniversary • Outplay, Outwit, Outlast
      </footer>
    </div >
  )
}

// ==========================================================================
// CHALLENGE PANEL
// ==========================================================================
function ChallengePanel({ tribes, onLog, history }) {
  const [type, setType] = useState('Immunity');
  const [winner, setWinner] = useState(tribes[0]?.name || '');
  const [second, setSecond] = useState('');

  return (
    <div className="challenge-panel">
      <h3>Record Challenge</h3>
      <div className="challenge-controls">
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="Immunity">Immunity</option>
          <option value="Reward">Reward</option>
        </select>

        <div className="winner-selection">
          <label>Winner:</label>
          <select value={winner} onChange={e => setWinner(e.target.value)}>
            {tribes.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
          </select>
        </div>

        <div className="second-selection">
          <label>2nd Place (Optional):</label>
          <select value={second} onChange={e => setSecond(e.target.value)}>
            <option value="">None</option>
            {tribes.filter(t => t.name !== winner).map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
          </select>
        </div>

        <button onClick={() => onLog(type, winner, second)} className="btn-log">LOG WIN</button>
      </div>

      {history.length > 0 && (
        <div className="challenge-history">
          <h4>Recent Activity</h4>
          <ul>
            {history.slice(0, 3).map((entry, idx) => (
              <li key={idx}>
                {entry.winner} won {entry.type} {entry.second ? `(2nd: ${entry.second})` : ''} - <small>{entry.time}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ==========================================================================
// ADVENTURE PANEL
// ==========================================================================
function AdventurePanel({ players, onLogAdventure }) {
  const activePlayers = players.filter(p => p.status === 'Active');
  const [winner, setWinner] = useState('');
  const [loser, setLoser] = useState('');
  const [sentBack, setSentBack] = useState('');

  const handleLog = () => {
    if (!winner && !loser && !sentBack) {
      alert("Please select at least one player for the adventure.");
      return;
    }
    const wId = winner ? parseInt(winner) : null;
    const lId = loser ? parseInt(loser) : null;
    const sId = sentBack ? parseInt(sentBack) : null;

    if ((wId && (wId === lId || wId === sId)) || (lId && lId === sId)) {
      alert("Players must be distinct.");
      return;
    }

    onLogAdventure(wId, lId, sId);
    setWinner('');
    setLoser('');
    setSentBack('');
  };

  return (
    <div className="challenge-panel">
      <h3>Record Adventure</h3>
      <div className="challenge-controls">
        <div className="winner-selection">
          <label>Winner (Block-a-Vote):</label>
          <select value={winner} onChange={e => setWinner(e.target.value)}>
            <option value="">-- Select Winner --</option>
            {activePlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.tribe})</option>)}
          </select>
        </div>
        <div className="second-selection">
          <label>Loser (Lost Vote):</label>
          <select value={loser} onChange={e => setLoser(e.target.value)}>
            <option value="">-- Select Loser --</option>
            {activePlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.tribe})</option>)}
          </select>
        </div>
        <div className="second-selection">
          <label>Sent Back (No Advantage):</label>
          <select value={sentBack} onChange={e => setSentBack(e.target.value)}>
            <option value="">-- Select Sent Back --</option>
            {activePlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.tribe})</option>)}
          </select>
        </div>
        <button onClick={handleLog} className="btn-log">LOG ADVENTURE</button>
      </div>
    </div>
  );
}

// ==========================================================================
// TRIBE MANAGER
// ==========================================================================
function TribeManager({ tribes, onUpdate, onAdd }) {
  const [newTribe, setNewTribe] = useState({ name: '', color: '#ffffff' });

  return (
    <div className="tribe-manager">
      <h3>Tribe Management</h3>
      <div className="tribe-list">
        {tribes.map(tribe => (
          <div key={tribe.name} className="tribe-edit-row">
            <input
              type="text"
              value={tribe.name}
              onChange={e => onUpdate(tribe.name, { ...tribe, name: e.target.value })}
            />
            <input
              type="color"
              value={tribe.color}
              onChange={e => onUpdate(tribe.name, { ...tribe, color: e.target.value })}
            />
          </div>
        ))}
      </div>
      <div className="add-tribe">
        <input
          type="text"
          placeholder="New tribe name..."
          value={newTribe.name}
          onChange={e => setNewTribe({ ...newTribe, name: e.target.value })}
        />
        <input
          type="color"
          value={newTribe.color}
          onChange={e => setNewTribe({ ...newTribe, color: e.target.value })}
        />
        <button onClick={() => { onAdd(newTribe); setNewTribe({ name: '', color: '#ffffff' }); }}>Add Tribe</button>
      </div>
    </div>
  );
}

// ==========================================================================
// EDIT PLAYER MODAL
// ==========================================================================
function EditPlayerModal({ player, players, onClose, onSave, onTransfer }) {
  const [editedPlayer, setEditedPlayer] = useState({ ...player });
  const [newAdvantage, setNewAdvantage] = useState({ name: '', type: 'Idol' });
  const [newAlliance, setNewAlliance] = useState('');
  const [newAdventure, setNewAdventure] = useState({ description: '', outcome: 'None' });
  const [autoAddAdvantage, setAutoAddAdvantage] = useState(false);

  const addAdventure = () => {
    if (!newAdventure.description) return;
    const adventure = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      description: newAdventure.description,
      outcome: newAdventure.outcome
    };

    let updatedAdvantages = [...editedPlayer.advantages];
    if (autoAddAdvantage) {
      updatedAdvantages.push({
        id: Date.now() + 1,
        name: newAdventure.outcome,
        type: newAdventure.outcome.includes('Idol') ? 'Idol' : 'Extra Vote',
        status: 'Active'
      });
    }

    setEditedPlayer({
      ...editedPlayer,
      adventures: [adventure, ...editedPlayer.adventures],
      advantages: updatedAdvantages
    });
    setNewAdventure({ description: '', outcome: 'None' });
    setAutoAddAdvantage(false);
  };

  const addAdvantage = () => {
    if (!newAdvantage.name) return;
    const adv = {
      ...newAdvantage,
      id: Date.now(),
      status: 'Active',
      originalFinderId: newAdvantage.type === 'Boomerang Idol' ? player.id : undefined,
      prerequisites: newAdvantage.type === 'Beware' ? [
        { id: 1, label: 'Find Clue', met: false },
        { id: 2, label: 'Complete Task', met: false },
        { id: 3, label: 'Restore Vote', met: false }
      ] : []
    };
    setEditedPlayer({ ...editedPlayer, advantages: [...editedPlayer.advantages, adv] });
    setNewAdvantage({ name: '', type: 'Idol' });
  };

  const removeAdvantage = (id) => {
    setEditedPlayer({ ...editedPlayer, advantages: editedPlayer.advantages.filter(a => a.id !== id) });
  };

  const togglePrereq = (advId, prereqId) => {
    setEditedPlayer({
      ...editedPlayer,
      advantages: editedPlayer.advantages.map(a =>
        a.id === advId ? {
          ...a,
          prerequisites: a.prerequisites.map(p => p.id === prereqId ? { ...p, met: !p.met } : p)
        } : a
      )
    });
  };

  const addAlliance = () => {
    if (!newAlliance || editedPlayer.alliances.includes(newAlliance)) return;
    setEditedPlayer({ ...editedPlayer, alliances: [...editedPlayer.alliances, newAlliance] });
    setNewAlliance('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 style={{ color: 'var(--color-torch-amber)', marginTop: 0 }}>Edit {player.name}</h2>

        <div className="form-grid">
          <div className="form-section">
            <label className="form-label">Wins History</label>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', opacity: 0.7 }}>Reward</label>
                <input
                  type="number"
                  value={editedPlayer.wins.reward}
                  onChange={e => setEditedPlayer({ ...editedPlayer, wins: { ...editedPlayer.wins, reward: Number(e.target.value) } })}
                  style={{ width: '50px', background: 'var(--color-bg-deep)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '5px', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', opacity: 0.7 }}>Immunity</label>
                <input
                  type="number"
                  value={editedPlayer.wins.immunity}
                  onChange={e => setEditedPlayer({ ...editedPlayer, wins: { ...editedPlayer.wins, immunity: Number(e.target.value) } })}
                  style={{ width: '50px', background: 'var(--color-bg-deep)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '5px', borderRadius: '4px' }}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">Alliances</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                value={newAlliance}
                onChange={e => setNewAlliance(e.target.value)}
                placeholder="Alliance..."
                style={{ background: 'var(--color-bg-deep)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '8px', flex: 1, minWidth: 0, borderRadius: '4px' }}
              />
              <button onClick={addAlliance} className="btn-primary" style={{ padding: '8px 15px' }}>+</button>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {editedPlayer.alliances.map(tag => (
              <span key={tag} className="icon-tag" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {tag} <button onClick={() => setEditedPlayer({ ...editedPlayer, alliances: editedPlayer.alliances.filter(t => t !== tag) })} style={{ background: 'none', border: 'none', color: '#EF4444', marginLeft: '5px', cursor: 'pointer' }}>x</button>
              </span>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label className="form-label">Adventures</label>
          <div style={{ background: 'var(--color-bg-deep)', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <textarea
              value={newAdventure.description}
              onChange={e => setNewAdventure({ ...newAdventure, description: e.target.value })}
              placeholder="What happened on the adventure?"
              style={{ width: '100%', background: '#000', color: 'white', border: '1px solid rgba(255,255,255,0.15)', padding: '10px', marginBottom: '10px', borderRadius: '4px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={newAdventure.outcome}
                onChange={e => setNewAdventure({ ...newAdventure, outcome: e.target.value })}
                style={{ background: 'var(--color-bg-deep)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', padding: '8px', borderRadius: '4px' }}
              >
                <option value="None">No Advantage</option>
                <option value="Extra Vote">Earned Extra Vote</option>
                <option value="Hidden Immunity Idol">Earned Idol</option>
                <option value="Lost Vote">Lost Vote</option>
              </select>
              <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" checked={autoAddAdvantage} onChange={e => setAutoAddAdvantage(e.target.checked)} />
                Auto-add Advantage?
              </label>
              <button onClick={addAdventure} className="btn-primary" style={{ padding: '8px 15px' }}>LOG ADVENTURE</button>
            </div>
          </div>
          <div className="adventure-history" style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {editedPlayer.adventures.map(adv => (
              <div key={adv.id} style={{ fontSize: '0.85rem', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--color-torch-amber)' }}>{adv.date}:</span> {adv.description}
                <span style={{ color: 'var(--color-torch-amber)', marginLeft: '10px' }}>Result: {adv.outcome}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label className="form-label">Advantages &amp; Idols</label>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input
              type="text"
              value={newAdvantage.name}
              onChange={e => setNewAdvantage({ ...newAdvantage, name: e.target.value })}
              placeholder="Name..."
              style={{ background: 'var(--color-bg-deep)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '8px', flex: 1, borderRadius: '4px' }}
            />
            <select
              value={newAdvantage.type}
              onChange={e => setNewAdvantage({ ...newAdvantage, type: e.target.value })}
              style={{ background: 'var(--color-bg-deep)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: '4px' }}
            >
              <option value="Idol">Idol</option>
              <option value="Beware">Beware Advantage</option>
              <option value="Extra Vote">Extra Vote</option>
              <option value="Boomerang Idol">Boomerang Idol</option>
              <option value="Disadvantage">Disadvantage</option>
            </select>
            <button onClick={addAdvantage} className="btn-primary" style={{ padding: '8px 15px' }}>+</button>
          </div>

          <div className="advantage-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {editedPlayer.advantages.map(adv => (
              <div key={adv.id} style={{ background: 'var(--color-bg-deep)', padding: '15px', borderRadius: '8px', marginBottom: '10px', borderLeft: `4px solid ${adv.type === 'Beware' ? '#ff4500' : adv.type === 'Disadvantage' ? '#EF4444' : '#ffd700'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{adv.name} ({adv.type})</strong>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      onChange={(e) => {
                        if (e.target.value && onTransfer) {
                          onTransfer(player.id, parseInt(e.target.value), adv.id);
                        }
                      }}
                      value=""
                      style={{ background: '#000', color: 'white', border: '1px solid #444', borderRadius: '4px', fontSize: '0.8rem', padding: '4px' }}
                    >
                      <option value="">Gift To...</option>
                      {players && players.filter(p => p.id !== player.id && p.status === 'Active').map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.tribe})</option>
                      ))}
                    </select>
                    <button onClick={() => removeAdvantage(adv.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>Remove</button>
                  </div>
                </div>

                {adv.type === 'Beware' && (
                  <div style={{ marginTop: '10px', paddingLeft: '10px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '5px' }}>Prerequisites:</div>
                    {adv.prerequisites.map(p => (
                      <label key={p.id} className="check-item">
                        <input
                          type="checkbox"
                          checked={p.met}
                          onChange={() => togglePrereq(adv.id, p.id)}
                        />
                        <span style={{ fontSize: '0.9rem', color: p.met ? '#8f8' : '#fff' }}>{p.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '2rem' }}>
          <button onClick={() => onSave(editedPlayer)} className="btn-primary" style={{ flex: 1 }}>SAVE CHANGES</button>
          <button onClick={onClose} style={{ flex: 1, background: 'var(--color-wood-light)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', cursor: 'pointer', padding: '12px', fontWeight: 700 }}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// TRIBAL COUNCIL
// ==========================================================================
function TribalCouncil({ tribes, players, onVotes }) {
  const [selectedTribe, setSelectedTribe] = useState(tribes[0]?.name || '');
  const [voteCasting, setVoteCasting] = useState({});

  const handleVoteChange = (id, val) => {
    setVoteCasting(prev => ({ ...prev, [id]: Math.max(0, parseInt(val) || 0) }));
  };

  const submitVotes = () => {
    onVotes(prev => prev.map(p => ({
      ...p,
      totalVotes: p.totalVotes + (voteCasting[p.id] || 0)
    })));
    setVoteCasting({});
    alert('Votes recorded!');
  };

  const tribePlayers = players.filter(p => p.tribe === selectedTribe && p.status === 'Active');

  return (
    <div className="challenge-panel tribal-panel">
      <h3>Record Tribal Council</h3>
      <div className="tribe-select" style={{ marginBottom: '15px' }}>
        <label style={{ fontSize: '0.7rem', display: 'block', opacity: 0.7 }}>Select Tribe at Tribal:</label>
        <select value={selectedTribe} onChange={e => setSelectedTribe(e.target.value)} style={{ width: '100%', background: 'var(--color-bg-deep)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', padding: '8px', borderRadius: '6px' }}>
          {tribes.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
        </select>
      </div>
      <div className="vote-inputs" style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '15px' }}>
        {tribePlayers.map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <span style={{ fontSize: '0.9rem' }}>{p.name}</span>
            <input
              type="number"
              min="0"
              value={voteCasting[p.id] || ''}
              onChange={e => handleVoteChange(p.id, e.target.value)}
              placeholder="0"
              style={{ width: '50px', background: 'var(--color-bg-deep)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center', borderRadius: '4px' }}
            />
          </div>
        ))}
      </div>
      <button onClick={submitVotes} className="btn-log" style={{ width: '100%' }}>SUBMIT TRIBAL VOTES</button>
    </div>
  );
}

export default App
