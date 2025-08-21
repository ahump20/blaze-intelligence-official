/**
 * Cloudflare Worker for Player Forecast API
 * Provides projection data and AI insights for players across leagues
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=300' // 5 minute cache
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    // Route handlers
    if (path === '/api/forecast/player') {
      return handlePlayerForecast(url, env, headers);
    } else if (path === '/api/forecast/team') {
      return handleTeamForecast(url, env, headers);
    } else if (path === '/api/forecast/league') {
      return handleLeagueForecast(url, env, headers);
    } else if (path === '/api/forecast/nil') {
      return handleNILValuations(url, env, headers);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { 
      status: 404, 
      headers 
    });
  } catch (error) {
    console.error('Forecast error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500, 
      headers 
    });
  }
}

async function handlePlayerForecast(url, env, headers) {
  const playerId = url.searchParams.get('id');
  const league = url.searchParams.get('league');
  
  if (!playerId || !league) {
    return new Response(JSON.stringify({ 
      error: 'Missing required parameters: id and league' 
    }), { 
      status: 400, 
      headers 
    });
  }

  // Generate forecast based on player data
  const forecast = generatePlayerForecast(playerId, league);
  
  // Store in R2 if configured
  if (env.R2_BUCKET) {
    const key = `forecasts/${league}/${playerId}/${Date.now()}.json`;
    await env.R2_BUCKET.put(key, JSON.stringify(forecast));
  }

  return new Response(JSON.stringify(forecast), { headers });
}

async function handleTeamForecast(url, env, headers) {
  const team = url.searchParams.get('team');
  const league = url.searchParams.get('league');
  
  if (!team || !league) {
    return new Response(JSON.stringify({ 
      error: 'Missing required parameters: team and league' 
    }), { 
      status: 400, 
      headers 
    });
  }

  const forecast = {
    team,
    league,
    timestamp: new Date().toISOString(),
    projections: {
      wins: league === 'MLB' ? 87 : 8,
      playoff_probability: 0.72,
      championship_odds: 0.12,
      key_factors: [
        "Strong pitching rotation depth",
        "Improved offensive consistency",
        "Veteran leadership in clubhouse"
      ]
    },
    roster_analysis: {
      strengths: ["Starting rotation", "Bullpen depth", "Defense"],
      weaknesses: ["Power hitting", "Bench depth"],
      injury_concerns: ["Minor shoulder issues for key reliever"]
    }
  };

  return new Response(JSON.stringify(forecast), { headers });
}

async function handleLeagueForecast(url, env, headers) {
  const league = url.searchParams.get('league') || 'MLB';
  
  const forecast = {
    league,
    timestamp: new Date().toISOString(),
    season: "2025",
    trends: {
      scoring: "Up 8% from 2024",
      pace_of_play: "Improved by 12 minutes average",
      competitive_balance: 0.78
    },
    championship_favorites: getChampionshipFavorites(league),
    breakout_candidates: getBreakoutCandidates(league),
    key_storylines: [
      "Impact of new rule changes",
      "Emerging young talent wave",
      "Contract year performances"
    ]
  };

  return new Response(JSON.stringify(forecast), { headers });
}

async function handleNILValuations(url, env, headers) {
  const position = url.searchParams.get('position');
  const school = url.searchParams.get('school');
  
  const valuations = {
    timestamp: new Date().toISOString(),
    market_overview: {
      total_market_size: 1200000000,
      average_deal_size: 125000,
      growth_rate: 0.35
    },
    top_earners: [
      {
        name: "Arch Manning",
        school: "Texas",
        position: "QB",
        valuation: 6800000,
        deals: 12,
        social_following: 2500000
      },
      {
        name: "Carson Beck",
        school: "Georgia",
        position: "QB",
        valuation: 4300000,
        deals: 8,
        social_following: 850000
      },
      {
        name: "Jeremiah Smith",
        school: "Ohio State",
        position: "WR",
        valuation: 2800000,
        deals: 10,
        social_following: 1200000
      }
    ],
    position_averages: {
      QB: 2100000,
      RB: 450000,
      WR: 680000,
      OL: 285000,
      EDGE: 520000,
      CB: 410000
    },
    filters: { position, school }
  };

  return new Response(JSON.stringify(valuations), { headers });
}

function generatePlayerForecast(playerId, league) {
  // Simplified forecast generation - in production this would pull from R2/D1
  return {
    player_id: playerId,
    league,
    timestamp: new Date().toISOString(),
    performance_metrics: {
      current_form: 0.82,
      injury_risk: 0.15,
      consistency_score: 0.78,
      trend: "improving"
    },
    projections: {
      next_game: {
        confidence: 0.75,
        key_stats: league === 'MLB' ? {
          hits: 1.8,
          runs: 0.9,
          rbi: 1.2
        } : {
          yards: 285,
          touchdowns: 2.1,
          turnovers: 0.8
        }
      },
      season_2025: {
        games_played: league === 'MLB' ? 145 : 16,
        all_star_probability: 0.42,
        award_chances: {
          mvp: 0.08,
          all_star: 0.42,
          gold_glove: 0.31
        }
      }
    },
    ai_insights: {
      breakout_potential: 0.68,
      comparison_players: [
        "Similar trajectory to Player X in 2019",
        "Mechanical adjustments mirror Player Y's breakout"
      ],
      key_factors: [
        "Improved plate discipline",
        "Enhanced defensive positioning",
        "Strong spring training performance"
      ],
      recommendation: "BUY - Expected to exceed projections"
    },
    market_value: {
      current_value: 18500000,
      projected_value: 22000000,
      contract_status: "2 years remaining",
      market_trend: "rising"
    }
  };
}

function getChampionshipFavorites(league) {
  const favorites = {
    MLB: [
      { team: "Dodgers", odds: 0.18 },
      { team: "Braves", odds: 0.15 },
      { team: "Astros", odds: 0.12 }
    ],
    NFL: [
      { team: "Chiefs", odds: 0.16 },
      { team: "Bills", odds: 0.14 },
      { team: "49ers", odds: 0.13 }
    ],
    NCAA: [
      { team: "Georgia", odds: 0.20 },
      { team: "Texas", odds: 0.18 },
      { team: "Ohio State", odds: 0.15 }
    ]
  };
  return favorites[league] || [];
}

function getBreakoutCandidates(league) {
  const candidates = {
    MLB: [
      "Jordan Walker - Cardinals OF",
      "Masyn Winn - Cardinals SS",
      "Nolan Gorman - Cardinals 2B"
    ],
    NFL: [
      "Will Levis - Titans QB",
      "Calvin Ridley - Titans WR",
      "Peter Skoronski - Titans OL"
    ],
    NCAA: [
      "Arch Manning - Texas QB",
      "Dylan Raiola - Nebraska QB",
      "Jeremiah Smith - Ohio State WR"
    ]
  };
  return candidates[league] || [];
}