// Chemistry Network Graph Visualization
// Dynamic team synergy and familiarity visualization using vis.js

class ChemistryNetwork {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 100,
          springConstant: 0.08
        },
        stabilization: {
          iterations: 100
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: true
      },
      nodes: {
        shape: 'circularImage',
        borderWidth: 3,
        borderWidthSelected: 5,
        color: {
          border: '#112240',
          background: '#0A192F',
          highlight: {
            border: '#BF5700',
            background: '#112240'
          }
        },
        font: {
          color: '#e2e8f0',
          size: 12,
          face: 'Inter, sans-serif'
        }
      },
      edges: {
        smooth: {
          type: 'continuous',
          roundness: 0.5
        },
        scaling: {
          min: 1,
          max: 10
        },
        color: {
          color: 'rgba(155, 203, 235, 0.4)',
          highlight: '#BF5700',
          hover: '#9BCBEB'
        },
        arrows: {
          to: {
            enabled: false
          }
        }
      },
      ...options
    };
    
    this.nodes = new vis.DataSet();
    this.edges = new vis.DataSet();
    this.network = null;
    this.familiarityIndex = new Map();
    
    this.init();
  }
  
  init() {
    // Create network visualization
    const data = {
      nodes: this.nodes,
      edges: this.edges
    };
    
    this.network = new vis.Network(this.container, data, this.options);
    
    // Event listeners
    this.network.on('selectNode', (params) => {
      this.onNodeSelect(params.nodes[0]);
    });
    
    this.network.on('hoverNode', (params) => {
      this.onNodeHover(params.node);
    });
    
    // Custom tooltip
    this.network.on('showPopup', (nodeId) => {
      const node = this.nodes.get(nodeId);
      if (node) {
        return this.createTooltip(node);
      }
    });
  }
  
  // Add or update player node
  addPlayer(player) {
    const nodeData = {
      id: player.id,
      label: player.name || `Player ${player.id}`,
      title: this.createPlayerTooltip(player),
      image: player.image || this.generatePlayerAvatar(player),
      size: 25 + (player.usage || 0) * 0.5,  // Size based on usage rate
      group: player.position || 'default',
      stats: player.stats || {},
      borderWidth: player.isStarter ? 4 : 2,
      color: {
        border: player.isStarter ? '#BF5700' : '#112240'
      }
    };
    
    try {
      this.nodes.update(nodeData);
    } catch (error) {
      this.nodes.add(nodeData);
    }
  }
  
  // Update edge (connection) between players
  updateConnection(fromId, toId, data) {
    const edgeId = `${fromId}-${toId}`;
    const reverseId = `${toId}-${fromId}`;
    
    // Check if edge exists in either direction
    let existingEdge = this.edges.get(edgeId) || this.edges.get(reverseId);
    
    if (existingEdge) {
      // Update existing edge
      const currentValue = existingEdge.value || 0;
      const currentEfficiency = existingEdge.efficiency || 0;
      
      this.edges.update({
        id: existingEdge.id,
        value: currentValue + (data.count || 1),
        efficiency: ((currentEfficiency * currentValue) + (data.efficiency || 0)) / (currentValue + 1),
        width: Math.min(10, 1 + Math.log(currentValue + 1)),
        color: this.getEfficiencyColor(data.efficiency || currentEfficiency),
        title: this.createEdgeTooltip(fromId, toId, {
          value: currentValue + (data.count || 1),
          efficiency: data.efficiency || currentEfficiency,
          type: data.type || 'interaction'
        })
      });
    } else {
      // Create new edge
      this.edges.add({
        id: edgeId,
        from: fromId,
        to: toId,
        value: data.count || 1,
        efficiency: data.efficiency || 0,
        width: 1,
        color: this.getEfficiencyColor(data.efficiency || 0),
        title: this.createEdgeTooltip(fromId, toId, data)
      });
    }
    
    // Update familiarity index
    this.updateFamiliarityIndex(fromId, toId, data);
  }
  
  // Calculate and update familiarity index
  updateFamiliarityIndex(player1Id, player2Id, interaction) {
    const key = [player1Id, player2Id].sort().join('-');
    const current = this.familiarityIndex.get(key) || {
      minutes: 0,
      interactions: 0,
      efficiency: 0,
      deltaEff: 0
    };
    
    // Update familiarity metrics
    current.minutes += interaction.minutes || 0;
    current.interactions += interaction.count || 1;
    
    // Calculate efficiency delta (improvement over time)
    if (interaction.efficiency !== undefined) {
      const oldEff = current.efficiency;
      current.efficiency = ((current.efficiency * (current.interactions - 1)) + interaction.efficiency) / current.interactions;
      current.deltaEff = current.efficiency - oldEff;
    }
    
    this.familiarityIndex.set(key, current);
    
    // Trigger familiarity update event
    this.onFamiliarityUpdate(player1Id, player2Id, current);
  }
  
  // Get familiarity between two players
  getFamiliarity(player1Id, player2Id) {
    const key = [player1Id, player2Id].sort().join('-');
    return this.familiarityIndex.get(key) || null;
  }
  
  // Simulate lineup change
  simulateLineupChange(outPlayerId, inPlayerId) {
    const predictions = {
      efficiencyDelta: 0,
      chemistryDelta: 0,
      synergyPairs: []
    };
    
    // Get current lineup
    const currentLineup = this.nodes.get({
      filter: (node) => node.group === 'court'
    });
    
    // Calculate current chemistry
    let currentChemistry = 0;
    currentLineup.forEach((player1, i) => {
      currentLineup.slice(i + 1).forEach(player2 => {
        const familiarity = this.getFamiliarity(player1.id, player2.id);
        if (familiarity) {
          currentChemistry += familiarity.efficiency * familiarity.interactions;
        }
      });
    });
    
    // Simulate new chemistry with substitution
    let newChemistry = 0;
    const newLineup = currentLineup.filter(p => p.id !== outPlayerId);
    
    // Add chemistry for incoming player
    newLineup.forEach(player => {
      const familiarity = this.getFamiliarity(player.id, inPlayerId);
      if (familiarity) {
        newChemistry += familiarity.efficiency * familiarity.interactions;
        predictions.synergyPairs.push({
          player1: player.label,
          player2: this.nodes.get(inPlayerId)?.label,
          efficiency: familiarity.efficiency
        });
      }
    });
    
    // Calculate remaining chemistry
    newLineup.forEach((player1, i) => {
      newLineup.slice(i + 1).forEach(player2 => {
        if (player1.id !== outPlayerId && player2.id !== outPlayerId) {
          const familiarity = this.getFamiliarity(player1.id, player2.id);
          if (familiarity) {
            newChemistry += familiarity.efficiency * familiarity.interactions;
          }
        }
      });
    });
    
    predictions.chemistryDelta = newChemistry - currentChemistry;
    predictions.efficiencyDelta = predictions.chemistryDelta * 0.02; // 2% efficiency change per chemistry unit
    
    return predictions;
  }
  
  // Generate player avatar (fallback for missing images)
  generatePlayerAvatar(player) {
    const canvas = document.createElement('canvas');
    canvas.width = 60;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    
    // Draw circle background
    ctx.fillStyle = '#112240';
    ctx.beginPath();
    ctx.arc(30, 30, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player number or initials
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const text = player.number || player.name?.split(' ').map(n => n[0]).join('') || '?';
    ctx.fillText(text, 30, 30);
    
    return canvas.toDataURL();
  }
  
  // Get color based on efficiency
  getEfficiencyColor(efficiency) {
    if (efficiency > 0.7) return '#10b981';  // Green - excellent
    if (efficiency > 0.5) return '#9BCBEB';  // Blue - good
    if (efficiency > 0.3) return '#f59e0b';  // Yellow - moderate
    return '#ef4444';  // Red - poor
  }
  
  // Create player tooltip
  createPlayerTooltip(player) {
    return `
      <div style="padding: 10px; background: #0A192F; border: 1px solid #112240; border-radius: 4px;">
        <strong style="color: #e2e8f0;">${player.name || 'Unknown'}</strong><br>
        <span style="color: #64748b;">Position: ${player.position || 'N/A'}</span><br>
        <span style="color: #9BCBEB;">Usage: ${(player.usage * 100).toFixed(1)}%</span><br>
        <span style="color: #BF5700;">Efficiency: ${(player.efficiency * 100).toFixed(1)}%</span>
      </div>
    `;
  }
  
  // Create edge tooltip
  createEdgeTooltip(fromId, toId, data) {
    const from = this.nodes.get(fromId);
    const to = this.nodes.get(toId);
    const familiarity = this.getFamiliarity(fromId, toId);
    
    return `
      <div style="padding: 10px; background: #0A192F; border: 1px solid #112240; border-radius: 4px;">
        <strong style="color: #e2e8f0;">${from?.label} ↔ ${to?.label}</strong><br>
        <span style="color: #64748b;">Interactions: ${data.value || 0}</span><br>
        <span style="color: #9BCBEB;">Efficiency: ${((data.efficiency || 0) * 100).toFixed(1)}%</span><br>
        ${familiarity ? `
          <span style="color: #BF5700;">Familiarity: ${familiarity.minutes} min</span><br>
          <span style="color: ${familiarity.deltaEff > 0 ? '#10b981' : '#ef4444'};">
            Δ Efficiency: ${familiarity.deltaEff > 0 ? '+' : ''}${(familiarity.deltaEff * 100).toFixed(1)}%
          </span>
        ` : ''}
      </div>
    `;
  }
  
  // Event handlers
  onNodeSelect(nodeId) {
    // Highlight connected edges
    const connectedEdges = this.network.getConnectedEdges(nodeId);
    this.network.selectEdges(connectedEdges);
    
    // Emit custom event
    const event = new CustomEvent('chemistryNodeSelect', {
      detail: { nodeId, node: this.nodes.get(nodeId) }
    });
    this.container.dispatchEvent(event);
  }
  
  onNodeHover(nodeId) {
    // Show player stats overlay
    const event = new CustomEvent('chemistryNodeHover', {
      detail: { nodeId, node: this.nodes.get(nodeId) }
    });
    this.container.dispatchEvent(event);
  }
  
  onFamiliarityUpdate(player1Id, player2Id, familiarity) {
    // Emit familiarity update event
    const event = new CustomEvent('familiarityUpdate', {
      detail: { player1Id, player2Id, familiarity }
    });
    this.container.dispatchEvent(event);
  }
  
  // Handle live game events
  handleGameEvent(event) {
    switch (event.type) {
      case 'PASS':
        this.updateConnection(event.from, event.to, {
          count: 1,
          efficiency: event.success ? 1 : 0,
          type: 'pass'
        });
        break;
        
      case 'ASSIST':
        this.updateConnection(event.from, event.to, {
          count: 1,
          efficiency: 1,
          type: 'assist'
        });
        break;
        
      case 'SCREEN':
        this.updateConnection(event.setter, event.beneficiary, {
          count: 1,
          efficiency: event.scored ? 1 : 0.5,
          type: 'screen'
        });
        break;
        
      case 'SUBSTITUTION':
        // Remove outgoing player
        const outNode = this.nodes.get(event.out);
        if (outNode) {
          outNode.group = 'bench';
          this.nodes.update(outNode);
        }
        
        // Add incoming player
        const inNode = this.nodes.get(event.in);
        if (inNode) {
          inNode.group = 'court';
          this.nodes.update(inNode);
        } else {
          this.addPlayer({
            id: event.in,
            name: event.playerName,
            position: event.position,
            group: 'court'
          });
        }
        
        // Show lineup change prediction
        const prediction = this.simulateLineupChange(event.out, event.in);
        this.showLineupPrediction(prediction);
        break;
    }
  }
  
  // Show lineup prediction overlay
  showLineupPrediction(prediction) {
    const overlay = document.createElement('div');
    overlay.className = 'chemistry-prediction-overlay';
    overlay.innerHTML = `
      <div class="prediction-card">
        <h3>Lineup Impact Prediction</h3>
        <div class="prediction-metric">
          <span>Chemistry Change:</span>
          <span class="${prediction.chemistryDelta > 0 ? 'positive' : 'negative'}">
            ${prediction.chemistryDelta > 0 ? '+' : ''}${prediction.chemistryDelta.toFixed(2)}
          </span>
        </div>
        <div class="prediction-metric">
          <span>Efficiency Impact:</span>
          <span class="${prediction.efficiencyDelta > 0 ? 'positive' : 'negative'}">
            ${prediction.efficiencyDelta > 0 ? '+' : ''}${(prediction.efficiencyDelta * 100).toFixed(1)}%
          </span>
        </div>
        ${prediction.synergyPairs.length > 0 ? `
          <div class="synergy-pairs">
            <h4>Key Synergies:</h4>
            ${prediction.synergyPairs.map(pair => `
              <div class="synergy-pair">
                ${pair.player1} ↔ ${pair.player2}: 
                <span class="efficiency">${(pair.efficiency * 100).toFixed(0)}%</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
    
    this.container.appendChild(overlay);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 500);
    }, 5000);
  }
  
  // Export network data
  exportData() {
    return {
      nodes: this.nodes.get(),
      edges: this.edges.get(),
      familiarityIndex: Array.from(this.familiarityIndex.entries())
    };
  }
  
  // Import network data
  importData(data) {
    if (data.nodes) this.nodes.clear() && this.nodes.add(data.nodes);
    if (data.edges) this.edges.clear() && this.edges.add(data.edges);
    if (data.familiarityIndex) {
      this.familiarityIndex.clear();
      data.familiarityIndex.forEach(([key, value]) => {
        this.familiarityIndex.set(key, value);
      });
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChemistryNetwork;
} else {
  window.ChemistryNetwork = ChemistryNetwork;
}