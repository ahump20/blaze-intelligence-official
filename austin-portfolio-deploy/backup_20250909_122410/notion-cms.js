/**
 * Blaze Intelligence Notion CMS Integration
 * Manages blog posts, insights, and content creation workflow
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      if (url.pathname === '/api/notion/posts' && request.method === 'GET') {
        return await getBlogPosts(env, corsHeaders);
      }
      
      if (url.pathname === '/api/notion/insights' && request.method === 'GET') {
        return await getInsights(env, corsHeaders);
      }
      
      if (url.pathname === '/api/notion/content' && request.method === 'POST') {
        return await createContent(request, env, corsHeaders);
      }
      
      if (url.pathname.startsWith('/api/notion/page/') && request.method === 'GET') {
        const pageId = url.pathname.split('/').pop();
        return await getPageContent(pageId, env, corsHeaders);
      }
      
      if (url.pathname === '/api/notion/analytics-report' && request.method === 'POST') {
        return await createAnalyticsReport(request, env, corsHeaders);
      }
      
      return new Response('Not Found', { status: 404, headers: corsHeaders });
      
    } catch (error) {
      console.error('Notion API Error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error', message: error.message }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
  }
};

/**
 * Get all published blog posts from Notion
 */
async function getBlogPosts(env, corsHeaders) {
  const databaseId = env.NOTION_BLOG_DATABASE_ID;
  
  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      filter: {
        property: 'Status',
        select: {
          equals: 'Published'
        }
      },
      sorts: [
        {
          property: 'Published Date',
          direction: 'descending'
        }
      ]
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Notion API error: ${data.message}`);
  }
  
  // Transform Notion data to blog post format
  const posts = data.results.map(page => ({
    id: page.id,
    title: getPlainText(page.properties.Title.title),
    slug: getPlainText(page.properties.Slug?.rich_text) || generateSlug(getPlainText(page.properties.Title.title)),
    excerpt: getPlainText(page.properties.Excerpt?.rich_text) || '',
    publishedDate: page.properties['Published Date']?.date?.start || page.created_time,
    author: getPlainText(page.properties.Author?.rich_text) || 'Austin Humphrey',
    category: page.properties.Category?.select?.name || 'Analytics',
    tags: page.properties.Tags?.multi_select?.map(tag => tag.name) || [],
    featured: page.properties.Featured?.checkbox || false,
    team: page.properties.Team?.select?.name || null,
    sport: page.properties.Sport?.select?.name || null,
    readingTime: page.properties['Reading Time']?.number || estimateReadingTime(page),
    coverImage: page.cover?.external?.url || page.cover?.file?.url || null,
    lastModified: page.last_edited_time
  }));
  
  return new Response(
    JSON.stringify({ posts, total: posts.length }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Get analytics insights from Notion
 */
async function getInsights(env, corsHeaders) {
  const databaseId = env.NOTION_INSIGHTS_DATABASE_ID;
  
  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      filter: {
        property: 'Status',
        select: {
          equals: 'Active'
        }
      },
      sorts: [
        {
          property: 'Priority',
          direction: 'descending'
        }
      ]
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Notion API error: ${data.message}`);
  }
  
  const insights = data.results.map(page => ({
    id: page.id,
    title: getPlainText(page.properties.Title.title),
    type: page.properties.Type?.select?.name || 'General',
    priority: page.properties.Priority?.select?.name || 'Medium',
    team: page.properties.Team?.select?.name || null,
    metric: page.properties.Metric?.rich_text ? getPlainText(page.properties.Metric.rich_text) : null,
    value: page.properties.Value?.number || null,
    trend: page.properties.Trend?.select?.name || 'Stable',
    description: getPlainText(page.properties.Description?.rich_text) || '',
    dateCreated: page.properties['Date Created']?.date?.start || page.created_time,
    confidence: page.properties.Confidence?.number || 95,
    source: getPlainText(page.properties.Source?.rich_text) || 'Blaze Intelligence'
  }));
  
  return new Response(
    JSON.stringify({ insights, total: insights.length }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Get page content from Notion
 */
async function getPageContent(pageId, env, corsHeaders) {
  // Get page properties first
  const pageResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: {
      'Authorization': `Bearer ${env.NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
    },
  });
  
  const pageData = await pageResponse.json();
  
  if (!pageResponse.ok) {
    throw new Error(`Notion API error: ${pageData.message}`);
  }
  
  // Get page blocks (content)
  const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
    headers: {
      'Authorization': `Bearer ${env.NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
    },
  });
  
  const blocksData = await blocksResponse.json();
  
  if (!blocksResponse.ok) {
    throw new Error(`Notion API error: ${blocksData.message}`);
  }
  
  // Convert blocks to HTML/Markdown
  const content = await convertBlocksToHTML(blocksData.results);
  
  const page = {
    id: pageData.id,
    title: getPlainText(pageData.properties.Title?.title) || 'Untitled',
    content: content,
    lastModified: pageData.last_edited_time,
    created: pageData.created_time,
    properties: pageData.properties
  };
  
  return new Response(
    JSON.stringify({ page }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Create new content in Notion
 */
async function createContent(request, env, corsHeaders) {
  const { title, type, content, team, sport, category } = await request.json();
  
  const databaseId = type === 'insight' ? env.NOTION_INSIGHTS_DATABASE_ID : env.NOTION_BLOG_DATABASE_ID;
  
  const properties = {
    'Title': {
      title: [
        {
          text: {
            content: title
          }
        }
      ]
    },
    'Status': {
      select: {
        name: 'Draft'
      }
    }
  };
  
  // Add type-specific properties
  if (type === 'blog') {
    properties['Author'] = {
      rich_text: [
        {
          text: {
            content: 'Austin Humphrey'
          }
        }
      ]
    };
    
    if (category) {
      properties['Category'] = {
        select: {
          name: category
        }
      };
    }
    
    if (team) {
      properties['Team'] = {
        select: {
          name: team
        }
      };
    }
    
    if (sport) {
      properties['Sport'] = {
        select: {
          name: sport
        }
      };
    }
  }
  
  if (type === 'insight') {
    properties['Type'] = {
      select: {
        name: 'Analytics'
      }
    };
    
    properties['Priority'] = {
      select: {
        name: 'Medium'
      }
    };
    
    if (team) {
      properties['Team'] = {
        select: {
          name: team
        }
      };
    }
  }
  
  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      parent: {
        database_id: databaseId
      },
      properties: properties,
      children: content ? await convertHTMLToBlocks(content) : []
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Notion API error: ${data.message}`);
  }
  
  return new Response(
    JSON.stringify({ 
      message: `${type === 'blog' ? 'Blog post' : 'Insight'} created successfully`,
      pageId: data.id,
      url: data.url
    }),
    { 
      status: 201, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Create automated analytics report
 */
async function createAnalyticsReport(request, env, corsHeaders) {
  const { team, sport, metrics, insights } = await request.json();
  
  const title = `${team || 'Multi-Team'} ${sport || 'Analytics'} Report - ${new Date().toLocaleDateString()}`;
  
  // Create structured content from metrics
  const content = generateAnalyticsReportContent(team, sport, metrics, insights);
  
  const properties = {
    'Title': {
      title: [
        {
          text: {
            content: title
          }
        }
      ]
    },
    'Status': {
      select: {
        name: 'Published'
      }
    },
    'Category': {
      select: {
        name: 'Analytics Report'
      }
    },
    'Author': {
      rich_text: [
        {
          text: {
            content: 'Blaze Intelligence System'
          }
        }
      ]
    },
    'Published Date': {
      date: {
        start: new Date().toISOString().split('T')[0]
      }
    }
  };
  
  if (team) {
    properties['Team'] = {
      select: {
        name: team
      }
    };
  }
  
  if (sport) {
    properties['Sport'] = {
      select: {
        name: sport
      }
    };
  }
  
  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      parent: {
        database_id: env.NOTION_BLOG_DATABASE_ID
      },
      properties: properties,
      children: content
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Notion API error: ${data.message}`);
  }
  
  return new Response(
    JSON.stringify({ 
      message: 'Analytics report created successfully',
      pageId: data.id,
      url: data.url,
      title: title
    }),
    { 
      status: 201, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Helper Functions
 */
function getPlainText(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) {
    return '';
  }
  return richTextArray.map(item => item.plain_text).join('');
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function estimateReadingTime(page) {
  // Rough estimate: 200 words per minute
  const wordCount = JSON.stringify(page).split(' ').length;
  return Math.ceil(wordCount / 200);
}

async function convertBlocksToHTML(blocks) {
  let html = '';
  
  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
        html += `<p>${getPlainText(block.paragraph.rich_text)}</p>`;
        break;
      case 'heading_1':
        html += `<h1>${getPlainText(block.heading_1.rich_text)}</h1>`;
        break;
      case 'heading_2':
        html += `<h2>${getPlainText(block.heading_2.rich_text)}</h2>`;
        break;
      case 'heading_3':
        html += `<h3>${getPlainText(block.heading_3.rich_text)}</h3>`;
        break;
      case 'bulleted_list_item':
        html += `<li>${getPlainText(block.bulleted_list_item.rich_text)}</li>`;
        break;
      case 'numbered_list_item':
        html += `<li>${getPlainText(block.numbered_list_item.rich_text)}</li>`;
        break;
      case 'code':
        html += `<pre><code>${getPlainText(block.code.rich_text)}</code></pre>`;
        break;
      case 'quote':
        html += `<blockquote>${getPlainText(block.quote.rich_text)}</blockquote>`;
        break;
    }
  }
  
  return html;
}

async function convertHTMLToBlocks(htmlContent) {
  // Simple HTML to Notion blocks conversion
  // In production, you'd want a more sophisticated parser
  const blocks = [];
  
  const lines = htmlContent.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    if (line.startsWith('<h1>')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: line.replace(/<\/?h1>/g, '')
              }
            }
          ]
        }
      });
    } else if (line.startsWith('<h2>')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: line.replace(/<\/?h2>/g, '')
              }
            }
          ]
        }
      });
    } else if (line.startsWith('<p>')) {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: line.replace(/<\/?p>/g, '')
              }
            }
          ]
        }
      });
    }
  }
  
  return blocks;
}

function generateAnalyticsReportContent(team, sport, metrics, insights) {
  const blocks = [];
  
  // Title block
  blocks.push({
    object: 'block',
    type: 'heading_1',
    heading_1: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: `${team || 'Championship'} Analytics Intelligence Report`
          }
        }
      ]
    }
  });
  
  // Executive Summary
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: 'Executive Summary'
          }
        }
      ]
    }
  });
  
  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: `This automated report provides championship-level analytics insights for ${team || 'multiple teams'} across ${sport || 'multiple sports'}, generated by the Blaze Intelligence system on ${new Date().toLocaleDateString()}.`
          }
        }
      ]
    }
  });
  
  // Key Metrics
  if (metrics && Object.keys(metrics).length > 0) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Key Performance Metrics'
            }
          }
        }
      ]
    });
    
    for (const [key, value] of Object.entries(metrics)) {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: `• ${key}: ${value}`
              },
              annotations: {
                bold: true
              }
            }
          ]
        }
      });
    }
  }
  
  // Strategic Insights
  if (insights && insights.length > 0) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Strategic Insights'
            }
          }
        }
      ]
    });
    
    insights.forEach(insight => {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: insight
              }
            }
          ]
        }
      });
    });
  }
  
  // Footer
  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: 'Generated by Blaze Intelligence - Turn instinct into intelligence.'
          },
          annotations: {
            italic: true
          }
        }
      ]
    }
  });
  
  return blocks;
}