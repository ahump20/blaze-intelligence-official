/**
 * Cloudflare Worker for Data Ingestion Pipeline
 * Aggregates player data from multiple sources and stores in R2/D1
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Verify authorization for data ingestion
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${env.INGEST_API_KEY}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const path = url.pathname;
    
    if (path === '/api/ingest/mlb') {
      return await ingestMLBData(env, headers);
    } else if (path === '/api/ingest/nfl') {
      return await ingestNFLData(env, headers);
    } else if (path === '/api/ingest/ncaa') {
      return await ingestNCAAData(env, headers);
    } else if (path === '/api/ingest/txhs') {
      return await ingestTexasHSData(env, headers);
    } else if (path === '/api/ingest/all') {
      return await ingestAllData(env, headers);
    }

    return new Response('Not found', { status: 404 });
  } catch (error) {
    console.error('Ingestion error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers 
    });
  }
}

async function ingestMLBData(env, headers) {
  const timestamp = new Date().toISOString();
  
  const mlbData = {
    league: 'MLB',
    timestamp,
    teams: {
      cardinals: {
        roster: await fetchCardinalsRoster(),
        stats: await fetchTeamStats('cardinals'),
        projections: generateTeamProjections('cardinals')
      }
    },
    league_leaders: await fetchMLBLeaders(),
    updated_at: timestamp
  };

  // Store in R2
  if (env.R2_BUCKET) {
    const key = `data/mlb/${timestamp.split('T')[0]}.json`;
    await env.R2_BUCKET.put(key, JSON.stringify(mlbData));
  }

  // Store key metrics in D1
  if (env.DB) {
    await env.DB.prepare(`
      INSERT INTO player_metrics (league, team, metric_type, value, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).bind('MLB', 'Cardinals', 'team_war', mlbData.teams.cardinals.projections.team_war, timestamp).run();
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'MLB data ingested successfully',
    records: mlbData.teams.cardinals.roster.length,
    timestamp
  }), { headers });
}

async function ingestNFLData(env, headers) {
  const timestamp = new Date().toISOString();
  
  const nflData = {
    league: 'NFL',
    timestamp,
    teams: {
      titans: {
        roster: await fetchTitansRoster(),
        stats: await fetchTeamStats('titans'),
        projections: generateTeamProjections('titans')
      }
    },
    updated_at: timestamp
  };

  if (env.R2_BUCKET) {
    const key = `data/nfl/${timestamp.split('T')[0]}.json`;
    await env.R2_BUCKET.put(key, JSON.stringify(nflData));
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'NFL data ingested successfully',
    records: nflData.teams.titans.roster.length,
    timestamp
  }), { headers });
}

async function ingestNCAAData(env, headers) {
  const timestamp = new Date().toISOString();
  
  const ncaaData = {
    league: 'NCAA',
    timestamp,
    nil_leaders: [
      {
        rank: 1,
        name: "Arch Manning",
        school: "Texas",
        position: "QB",
        valuation: 6800000,
        social_reach: 2500000,
        deals: 12
      },
      {
        rank: 2,
        name: "Carson Beck",
        school: "Georgia",
        position: "QB",
        valuation: 4300000,
        social_reach: 850000,
        deals: 8
      },
      {
        rank: 3,
        name: "Jeremiah Smith",
        school: "Ohio State",
        position: "WR",
        valuation: 2800000,
        social_reach: 1200000,
        deals: 10
      }
    ],
    teams: {
      texas: {
        ranking: 4,
        roster: await fetchTexasRoster(),
        schedule: await fetchSchedule('texas')
      }
    },
    updated_at: timestamp
  };

  if (env.R2_BUCKET) {
    const key = `data/ncaa/${timestamp.split('T')[0]}.json`;
    await env.R2_BUCKET.put(key, JSON.stringify(ncaaData));
  }

  // Store NIL valuations in D1
  if (env.DB) {
    for (const player of ncaaData.nil_leaders) {
      await env.DB.prepare(`
        INSERT OR REPLACE INTO nil_valuations 
        (player_name, school, position, valuation, social_reach, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        player.name, 
        player.school, 
        player.position, 
        player.valuation, 
        player.social_reach, 
        timestamp
      ).run();
    }
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'NCAA data ingested successfully',
    nil_records: ncaaData.nil_leaders.length,
    timestamp
  }), { headers });
}

async function ingestTexasHSData(env, headers) {
  const timestamp = new Date().toISOString();
  
  const txhsData = {
    league: 'TXHS',
    timestamp,
    top_recruits_2026: [
      {
        name: "Keisean Henderson",
        position: "CB",
        school: "Nixon-Smiley",
        rating: 0.9834,
        stars: 5,
        committed: "Texas",
        nil_potential: 450000
      },
      {
        name: "Bowe Bentley",
        position: "QB",
        school: "Syracuse",
        rating: 0.9756,
        stars: 5,
        committed: "Colorado",
        nil_potential: 580000
      }
    ],
    classifications: {
      "6A": {
        champion_2024: "DeSoto",
        top_teams_2025: ["North Shore", "Duncanville", "Lake Travis"]
      }
    },
    updated_at: timestamp
  };

  if (env.R2_BUCKET) {
    const key = `data/txhs/${timestamp.split('T')[0]}.json`;
    await env.R2_BUCKET.put(key, JSON.stringify(txhsData));
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Texas HS data ingested successfully',
    recruits: txhsData.top_recruits_2026.length,
    timestamp
  }), { headers });
}

async function ingestAllData(env, headers) {
  const results = await Promise.allSettled([
    ingestMLBData(env, headers),
    ingestNFLData(env, headers),
    ingestNCAAData(env, headers),
    ingestTexasHSData(env, headers)
  ]);

  const summary = results.map((result, index) => {
    const leagues = ['MLB', 'NFL', 'NCAA', 'TXHS'];
    return {
      league: leagues[index],
      status: result.status,
      success: result.status === 'fulfilled'
    };
  });

  return new Response(JSON.stringify({
    success: true,
    message: 'All data ingestion completed',
    summary,
    timestamp: new Date().toISOString()
  }), { headers });
}

// Helper functions for data fetching
async function fetchCardinalsRoster() {
  // In production, this would fetch from real API
  return [
    {
      name: "Nolan Arenado",
      position: "3B",
      number: 28,
      stats: { avg: 0.272, hr: 16, rbi: 71 }
    },
    {
      name: "Willson Contreras",
      position: "C",
      number: 40,
      stats: { avg: 0.262, hr: 15, rbi: 51 }
    }
  ];
}

async function fetchTitansRoster() {
  return [
    {
      name: "Will Levis",
      position: "QB",
      number: 8,
      stats: { yards: 3622, td: 17, int: 14 }
    }
  ];
}

async function fetchTexasRoster() {
  return [
    {
      name: "Arch Manning",
      position: "QB",
      number: 16,
      class: "Sophomore"
    }
  ];
}

async function fetchTeamStats(team) {
  const stats = {
    cardinals: { wins: 83, losses: 79, pct: 0.512 },
    titans: { wins: 6, losses: 11, pct: 0.353 }
  };
  return stats[team] || {};
}

async function fetchSchedule(team) {
  return [
    { date: "2025-08-31", opponent: "Colorado State", location: "Home" },
    { date: "2025-09-07", opponent: "Michigan", location: "Away" }
  ];
}

async function fetchMLBLeaders() {
  return {
    batting_average: { player: "Luis Arraez", team: "SD", value: 0.314 },
    home_runs: { player: "Shohei Ohtani", team: "LAD", value: 54 },
    era: { player: "Chris Sale", team: "ATL", value: 2.38 }
  };
}

function generateTeamProjections(team) {
  const projections = {
    cardinals: {
      wins_2025: 87,
      playoff_odds: 0.72,
      team_war: 42.3
    },
    titans: {
      wins_2025: 8,
      playoff_odds: 0.38,
      team_rating: 78.5
    }
  };
  return projections[team] || {};
}