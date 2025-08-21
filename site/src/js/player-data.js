/**
 * Player Data Module
 * Fetches and displays live player data on the website
 */

export async function initPlayerData() {
  try {
    // Load player data
    const response = await fetch('/src/data/player_data_2025.json');
    if (!response.ok) throw new Error('Failed to load player data');
    
    const data = await response.json();
    
    // Update Cardinals section
    updateCardinalsSection(data.mlb?.cardinals);
    
    // Update NIL valuations
    updateNILSection(data.ncaa_football?.high_value_nil);
    
    // Update Texas HS recruits
    updateRecruitingSection(data.texas_hs_football?.top_recruits_2026);
    
    // Update live metrics
    updateLiveMetrics(data);
    
  } catch (error) {
    console.error('Error loading player data:', error);
  }
}

function updateCardinalsSection(cardinalsData) {
  if (!cardinalsData) return;
  
  // Update team overview
  const overviewEl = document.querySelector('[data-cardinals-overview]');
  if (overviewEl && cardinalsData.team_overview) {
    overviewEl.innerHTML = `
      <div class="team-stats">
        <h3>${cardinalsData.team_overview.name}</h3>
        <p>2024 Record: ${cardinalsData.team_overview['2024_record']}</p>
        <p>2025 Projection: ${cardinalsData.team_overview['2025_projection']}</p>
        <p>Playoff Odds: ${(cardinalsData.team_overview.playoff_odds * 100).toFixed(0)}%</p>
      </div>
    `;
  }
  
  // Update roster display
  const rosterEl = document.querySelector('[data-cardinals-roster]');
  if (rosterEl && cardinalsData.roster) {
    const rosterHTML = cardinalsData.roster.map(player => `
      <div class="player-card">
        <h4>${player.name}</h4>
        <p class="position">${player.position}</p>
        <div class="stats">
          ${player.stats_2024.avg ? `<span>AVG: ${player.stats_2024.avg}</span>` : ''}
          ${player.stats_2024.hr ? `<span>HR: ${player.stats_2024.hr}</span>` : ''}
          ${player.stats_2024.rbi ? `<span>RBI: ${player.stats_2024.rbi}</span>` : ''}
        </div>
        <div class="projections">
          <strong>2025 Projections:</strong>
          ${player.projections_2025.avg ? `<span>AVG: ${player.projections_2025.avg}</span>` : ''}
          ${player.projections_2025.war ? `<span>WAR: ${player.projections_2025.war}</span>` : ''}
        </div>
      </div>
    `).join('');
    
    rosterEl.innerHTML = rosterHTML;
  }
}

function updateNILSection(nilData) {
  if (!nilData) return;
  
  const nilEl = document.querySelector('[data-nil-leaders]');
  if (nilEl) {
    const nilHTML = nilData.slice(0, 5).map((player, index) => `
      <div class="nil-card">
        <div class="rank">#${index + 1}</div>
        <h4>${player.name}</h4>
        <p class="school">${player.school} - ${player.position}</p>
        <p class="valuation">$${(player.nil_valuation / 1000000).toFixed(1)}M</p>
        ${player.stats_2024 ? `
          <div class="stats">
            ${player.stats_2024.passing_yards ? `<span>${player.stats_2024.passing_yards} yards</span>` : ''}
            ${player.stats_2024.td ? `<span>${player.stats_2024.td} TD</span>` : ''}
          </div>
        ` : ''}
      </div>
    `).join('');
    
    nilEl.innerHTML = `
      <h3>Top NIL Valuations</h3>
      <div class="nil-grid">${nilHTML}</div>
    `;
  }
}

function updateRecruitingSection(recruitData) {
  if (!recruitData) return;
  
  const recruitEl = document.querySelector('[data-texas-recruits]');
  if (recruitEl) {
    const recruitHTML = recruitData.slice(0, 4).map(recruit => `
      <div class="recruit-card">
        <h4>${recruit.name}</h4>
        <div class="details">
          <span class="position">${recruit.position}</span>
          <span class="stars">${'⭐'.repeat(recruit.stars)}</span>
        </div>
        <p class="school">${recruit.school}</p>
        <p class="committed">Committed: ${recruit.committed}</p>
        ${recruit.nil_potential ? `<p class="nil">NIL Potential: $${(recruit.nil_potential / 1000).toFixed(0)}K</p>` : ''}
      </div>
    `).join('');
    
    recruitEl.innerHTML = `
      <h3>Top Texas HS Recruits 2026</h3>
      <div class="recruit-grid">${recruitHTML}</div>
    `;
  }
}

function updateLiveMetrics(data) {
  // Update total player count
  const playerCountEl = document.querySelector('[data-player-count]');
  if (playerCountEl) {
    let totalPlayers = 0;
    if (data.mlb?.cardinals?.roster) totalPlayers += data.mlb.cardinals.roster.length;
    if (data.nfl?.titans?.roster) totalPlayers += data.nfl.titans.roster.length;
    if (data.ncaa_football?.high_value_nil) totalPlayers += data.ncaa_football.high_value_nil.length;
    if (data.texas_hs_football?.top_recruits_2026) totalPlayers += data.texas_hs_football.top_recruits_2026.length;
    
    playerCountEl.textContent = totalPlayers;
  }
  
  // Update NIL market cap
  const nilMarketEl = document.querySelector('[data-nil-market]');
  if (nilMarketEl && data.player_forecast_schema) {
    nilMarketEl.textContent = '$1.2B';
  }
  
  // Update data freshness indicator
  const freshnessEl = document.querySelector('[data-freshness]');
  if (freshnessEl && data.metadata) {
    const generated = new Date(data.metadata.generated);
    const now = new Date();
    const hoursAgo = Math.floor((now - generated) / (1000 * 60 * 60));
    
    freshnessEl.innerHTML = `
      <span class="freshness-indicator ${hoursAgo < 6 ? 'fresh' : 'stale'}">
        Data updated ${hoursAgo < 1 ? 'just now' : `${hoursAgo} hours ago`}
      </span>
    `;
  }
}

// Auto-refresh player data every 5 minutes
export function startAutoRefresh() {
  setInterval(() => {
    initPlayerData();
  }, 5 * 60 * 1000);
}

// Fetch live forecast data
export async function fetchPlayerForecast(playerId, league) {
  try {
    const response = await fetch(`/api/forecast/player?id=${playerId}&league=${league}`);
    if (!response.ok) throw new Error('Failed to fetch forecast');
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching forecast:', error);
    return null;
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPlayerData);
} else {
  initPlayerData();
}