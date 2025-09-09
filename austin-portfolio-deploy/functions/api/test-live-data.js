// Cloudflare Pages Function to test live sports data
export async function onRequest() {
  try {
    // Test Cardinals data from ESPN API
    const cardinalsResponse = await fetch('https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/24');
    const cardinalsData = await cardinalsResponse.json();
    
    // Test MLB scoreboard
    const scoreboardResponse = await fetch('https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard');
    const scoreboardData = await scoreboardResponse.json();
    
    // Process Cardinals info
    const team = cardinalsData.team;
    const record = team.record?.items?.[0]?.summary || 'N/A';
    
    const result = {
      timestamp: new Date().toISOString(),
      status: 'success',
      data: {
        cardinals: {
          id: team.id,
          name: team.displayName,
          abbreviation: team.abbreviation,
          record: record,
          espnId: '24'
        },
        scoreboard: {
          games: scoreboardData.events?.length || 0,
          date: scoreboardData.day?.date || 'N/A'
        }
      },
      apiStatus: {
        espnTeams: cardinalsResponse.ok,
        espnScoreboard: scoreboardResponse.ok
      }
    };
    
    return new Response(JSON.stringify(result, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}