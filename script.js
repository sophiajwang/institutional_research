// Global variables
let nodes = [];
let edges = [];
let steps = [];
let selectedStep = null;
let nodePositions = new Map();
let hoveredNode = null;
let hoveredEdge = null;
let tooltip;
let stepCounter;

// Camera/view controls - anchored to center
let viewX = 0, viewY = 0;
let targetViewX = 0, targetViewY = 0;
let zoomLevel = 1;
let targetZoom = 1;
let isDraggingView = false;
let lastMouseX = 0, lastMouseY = 0;

// Physics controls (adjustable)
let repelForce = 0.8;
let repelDist = 120;
let springForce = 0.02;
let springLength = 100;
let centerForce = 0.001;
let containForce = 0.05;
let maxVelocity = 3;
let minVelocity = 0.01;

// UI controls
let repelForceSlider, repelDistSlider, springForceSlider, springLengthSlider;
let controlsPanel;

// Color scheme (SDS style)
let bgColor, bgColorDark, textColor, textColorDark;
let h1Color, h1ColorDark, h2Color, h2ColorDark, h3Color, h3ColorDark;
let darkMode = true;

// Edge display management
let edgeOffsets = new Map(); // For handling multiple edges between same nodes

function preload() {
    // Load JSON files with error handling
    loadJSON('nodes.json', 
        (data) => { nodes = data; },
        (error) => { 
            console.error('Failed to load nodes.json:', error);
            nodes = []; 
        }
    );
    
    loadJSON('edges.json', 
        (data) => { edges = data; },
        (error) => { 
            console.error('Failed to load edges.json:', error);
            edges = []; 
        }
    );
    
    loadJSON('steps.json', 
        (data) => { steps = data; },
        (error) => { 
            console.error('Failed to load steps.json:', error);
            steps = []; 
        }
    );
}

function setup() {
    let canvas = createCanvas(windowWidth - 350, windowHeight);
    canvas.parent('canvas-container');
    
    tooltip = select('#tooltip');
    stepCounter = select('#step-counter');
    
    // Initialize colors (SDS style)
    initColors();
    
    // Check if data loaded properly, if not use fallback data
    if (!Array.isArray(nodes) || nodes.length === 0) {
        console.log('Using fallback data - JSON files may not have loaded properly');
        loadFallbackData();
    }
    
    initializeVisualization();
    createStepList();
    createPhysicsControls();
    createLegend();
    calculateEdgeOffsets();
}

function initColors() {
    // SDS color scheme
    bgColor = color(20, 20, 20);
    bgColorDark = color(10, 10, 10);
    textColor = color(242, 242, 242);
    textColorDark = color(200, 200, 200);
    h1Color = color(93, 192, 217); // Individual nodes
    h1ColorDark = color(73, 160, 185);
    h2Color = color(120, 180, 120); // Theme nodes  
    h2ColorDark = color(100, 150, 100);
    h3Color = color(150, 150, 150); // Category nodes
    h3ColorDark = color(120, 120, 120);
}

function loadFallbackData() {
    // Use embedded fallback data with physics properties
    nodes = [
        {"node_id": 0, "node_name": "Mervin Kelly", "node_description": "Executive Vice President", "node_parent_id": 1, "node_grandparent_id": 2},
        {"node_id": 1, "node_name": "Bell Labs Administration", "node_description": "Executive", "node_parent_id": 2, "node_grandparent_id": null},
        {"node_id": 2, "node_name": "Bell Labs", "node_description": "AT&T research arm", "node_parent_id": null, "node_grandparent_id": null},
        {"node_id": 3, "node_name": "AT&T", "node_description": "Management and Holding Company of the Bell System", "node_parent_id": null, "node_grandparent_id": null},
        {"node_id": 4, "node_name": "William Shockley", "node_description": "Lead theorist of solid-state research group", "node_parent_id": 5, "node_grandparent_id": 2},
        {"node_id": 5, "node_name": "Solid-State Research Group", "node_description": "Research team", "node_parent_id": 2, "node_grandparent_id": null},
        {"node_id": 6, "node_name": "Walter Houser Brattain", "node_description": "Experimental Physicist", "node_parent_id": 5, "node_grandparent_id": 2},
        {"node_id": 7, "node_name": "John Bardeen", "node_description": "Theoretical Physicist", "node_parent_id": 5, "node_grandparent_id": 2}
    ];

    edges = [
        {"interaction_id": 0, "from_nodes": [2], "to_nodes": [3], "interaction_description": "Initial funding relationship", "step_id": 0, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 1, "from_nodes": [0], "to_nodes": [2], "interaction_description": "Executive oversight", "step_id": 1, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 2, "from_nodes": [4], "to_nodes": [6, 7], "interaction_description": "Research collaboration", "step_id": 1, "bidirectional": 1, "unused": 0, "violated": 0}
    ];

    steps = [
        {"step_id": 0, "step_description": "Initial project approval", "date": "06.21.1945", "phase": "research"},
        {"step_id": 1, "step_description": "Team formation", "date": "07.1945", "phase": "research"}
    ];
}

function initializeVisualization() {
    generateNodePositions();
}

function generateNodePositions() {
    console.log('Generating node positions...');
    
    if (!Array.isArray(nodes)) {
        console.error('Cannot generate positions: nodes is not an array');
        return;
    }
    
    // Use larger canvas area for initial positioning
    const canvasWidth = width * 1.5;
    const canvasHeight = height * 1.5;
    
    // Initialize physics properties for each node with better spread
    nodes.forEach((node, i) => {
        // Random positioning with better spread across larger area
        let x = random(-canvasWidth/2, canvasWidth/2);
        let y = random(-canvasHeight/2, canvasHeight/2);
        
        // Add some structure based on hierarchy but with more space
        if (!node.node_parent_id) {
            // Root nodes - spread around center with large radius
            const rootNodes = nodes.filter(n => !n.node_parent_id);
            const rootIndex = rootNodes.findIndex(n => n.node_id === node.node_id);
            if (rootIndex >= 0) {
                const angle = (rootIndex / rootNodes.length) * TWO_PI;
                const radius = 400;
                x = cos(angle) * radius;
                y = sin(angle) * radius;
            }
        }
        
        nodePositions.set(node.node_id, {
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            fixed: false
        });
    });
    
    console.log('Generated positions for', nodePositions.size, 'nodes');
}

function calculateEdgeOffsets() {
    // Calculate offsets for multiple edges between same nodes
    edgeOffsets.clear();
    
    // Group edges by from-to node pairs
    const edgeGroups = new Map();
    
    edges.forEach(edge => {
        edge.from_nodes.forEach(fromId => {
            edge.to_nodes.forEach(toId => {
                const key = `${Math.min(fromId, toId)}-${Math.max(fromId, toId)}`;
                if (!edgeGroups.has(key)) {
                    edgeGroups.set(key, []);
                }
                edgeGroups.get(key).push({
                    edge: edge,
                    fromId: fromId,
                    toId: toId
                });
            });
        });
    });
    
    // Assign offsets to edges with multiple connections
    edgeGroups.forEach((edgeList, key) => {
        if (edgeList.length > 1) {
            edgeList.forEach((edgeInfo, index) => {
                const offset = (index - (edgeList.length - 1) / 2) * 15; // 15px spacing
                const edgeKey = `${edgeInfo.edge.interaction_id}-${edgeInfo.fromId}-${edgeInfo.toId}`;
                edgeOffsets.set(edgeKey, offset);
            });
        }
    });
}

function createLegend() {
    let legend = createDiv('');
    legend.id('legend');
    legend.position(width - 250, height - 150);
    legend.style('background', 'rgba(20, 20, 20, 0.9)');
    legend.style('padding', '15px');
    legend.style('border-radius', '4px');
    legend.style('border', '1px solid #444444');
    legend.style('font-family', 'Helvetica, sans-serif');
    legend.style('color', '#F2F2F2');
    legend.style('font-size', '11px');
    legend.style('width', '200px');
    
    let title = createDiv('Legend');
    title.parent(legend);
    title.style('color', '#5DC0D9');
    title.style('font-weight', 'bold');
    title.style('margin-bottom', '8px');
    
    // Edge types
    let edgeTypes = createDiv(`
        <div style="margin: 4px 0;"><span style="color: #78B478;">━━━</span> Active Edge</div>
        <div style="margin: 4px 0;"><span style="color: #999999;">━━━</span> Inactive Edge</div>
        <div style="margin: 4px 0;"><span style="color: #FF6464;">┅┅┅</span> Violated Edge</div>
        <div style="margin: 4px 0;"><span style="color: #666666;">━━━</span> Unused Edge</div>
        <div style="margin: 4px 0;"><span style="color: #78B478;">━━▶</span> Directional</div>
        <div style="margin: 4px 0;"><span style="color: #78B478;">◀━▶</span> Bidirectional</div>
    `);
    edgeTypes.parent(legend);
    
    // Node types
    let nodeTypes = createDiv(`
        <div style="margin: 6px 0 4px 0; font-weight: bold;">Nodes:</div>
        <div style="margin: 2px 0;"><span style="color: #5DC0D9;">■</span> Individual/Child</div>
        <div style="margin: 2px 0;"><span style="color: #78B478;">■</span> Group/Parent</div>
        <div style="margin: 2px 0;"><span style="color: #999999;">■</span> Organization/Root</div>
    `);
    nodeTypes.parent(legend);
}

function createPhysicsControls() {
    // Create controls panel
    controlsPanel = createDiv('');
    controlsPanel.id('physics-controls');
    controlsPanel.position(20, 120);
    controlsPanel.style('background', 'rgba(20, 20, 20, 0.9)');
    controlsPanel.style('padding', '15px');
    controlsPanel.style('border-radius', '4px');
    controlsPanel.style('border', '1px solid #444444');
    controlsPanel.style('font-family', 'Helvetica, sans-serif');
    controlsPanel.style('color', '#F2F2F2');
    controlsPanel.style('font-size', '12px');
    controlsPanel.style('width', '200px');
    
    // Title
    let title = createDiv('Physics Controls');
    title.parent(controlsPanel);
    title.style('color', '#5DC0D9');
    title.style('font-weight', 'bold');
    title.style('margin-bottom', '10px');
    
    // Repel Force
    let repelLabel = createDiv('Repel Force: ' + repelForce.toFixed(2));
    repelLabel.parent(controlsPanel);
    repelLabel.id('repel-label');
    
    repelForceSlider = createSlider(0.1, 3.0, repelForce, 0.1);
    repelForceSlider.parent(controlsPanel);
    repelForceSlider.style('width', '180px');
    repelForceSlider.style('margin-bottom', '10px');
    
    // Repel Distance
    let distLabel = createDiv('Repel Distance: ' + repelDist);
    distLabel.parent(controlsPanel);
    distLabel.id('dist-label');
    
    repelDistSlider = createSlider(50, 300, repelDist, 10);
    repelDistSlider.parent(controlsPanel);
    repelDistSlider.style('width', '180px');
    repelDistSlider.style('margin-bottom', '10px');
    
    // Spring Force
    let springLabel = createDiv('Spring Force: ' + springForce.toFixed(3));
    springLabel.parent(controlsPanel);
    springLabel.id('spring-label');
    
    springForceSlider = createSlider(0.005, 0.1, springForce, 0.005);
    springForceSlider.parent(controlsPanel);
    springForceSlider.style('width', '180px');
    springForceSlider.style('margin-bottom', '10px');
    
    // Spring Length
    let lengthLabel = createDiv('Spring Length: ' + springLength);
    lengthLabel.parent(controlsPanel);
    lengthLabel.id('length-label');
    
    springLengthSlider = createSlider(50, 200, springLength, 10);
    springLengthSlider.parent(controlsPanel);
    springLengthSlider.style('width', '180px');
    springLengthSlider.style('margin-bottom', '10px');
    
    // Instructions
    let instructions = createDiv('💡 Drag to pan, scroll to zoom<br>🎯 Click edge when no step selected');
    instructions.parent(controlsPanel);
    instructions.style('color', '#BBBBBB');
    instructions.style('font-size', '10px');
    instructions.style('margin-top', '10px');
    instructions.style('line-height', '1.3');
}

function updatePhysicsControls() {
    if (repelForceSlider.value() !== repelForce) {
        repelForce = repelForceSlider.value();
        select('#repel-label').html('Repel Force: ' + repelForce.toFixed(2));
    }
    
    if (repelDistSlider.value() !== repelDist) {
        repelDist = repelDistSlider.value();
        select('#dist-label').html('Repel Distance: ' + repelDist);
    }
    
    if (springForceSlider.value() !== springForce) {
        springForce = springForceSlider.value();
        select('#spring-label').html('Spring Force: ' + springForce.toFixed(3));
    }
    
    if (springLengthSlider.value() !== springLength) {
        springLength = springLengthSlider.value();
        select('#length-label').html('Spring Length: ' + springLength);
    }
}

function createStepList() {
    const stepList = select('#step-list');
    
    steps.forEach(step => {
        const stepDiv = createDiv();
        stepDiv.class('step-item');
        stepDiv.addClass(step.phase || 'null');
        
        const dateDiv = createDiv(step.date);
        dateDiv.class('step-date');
        dateDiv.parent(stepDiv);
        
        const descDiv = createDiv(step.step_description);
        descDiv.class('step-description');
        descDiv.parent(stepDiv);
        
        // Add edges list for this step
        const relatedEdges = edges.filter(e => e.step_id === step.step_id);
        if (relatedEdges.length > 0) {
            const edgesList = createDiv();
            edgesList.class('edges-list');
            edgesList.style('display', 'none');
            edgesList.style('margin-top', '8px');
            edgesList.style('padding-left', '10px');
            edgesList.style('border-left', '2px solid #444');
            
            relatedEdges.forEach(edge => {
                const edgeItem = createDiv();
                edgeItem.class('edge-item');
                edgeItem.style('font-size', '11px');
                edgeItem.style('color', '#BBBBBB');
                edgeItem.style('margin', '3px 0');
                edgeItem.style('cursor', 'pointer');
                edgeItem.style('padding', '3px');
                edgeItem.style('border-radius', '2px');
                
                // Get node names for display
                const fromNames = edge.from_nodes.map(id => {
                    const node = nodes.find(n => n.node_id === id);
                    return node ? node.node_name : id;
                }).join(', ');
                
                const toNames = edge.to_nodes.map(id => {
                    const node = nodes.find(n => n.node_id === id);
                    return node ? node.node_name : id;
                }).join(', ');
                
                const arrow = edge.bidirectional ? '↔' : '→';
                edgeItem.html(`${fromNames} ${arrow} ${toNames}`);
                
                edgeItem.mouseOver(() => {
                    edgeItem.style('background', '#444');
                    hoveredEdge = edge.interaction_id;
                });
                
                edgeItem.mouseOut(() => {
                    edgeItem.style('background', 'transparent');
                    if (hoveredEdge === edge.interaction_id) hoveredEdge = null;
                });
                
                edgeItem.parent(edgesList);
            });
            
            edgesList.parent(stepDiv);
            
            // Add expand/collapse button
            const expandBtn = createDiv('▶ ' + relatedEdges.length + ' edges');
            expandBtn.class('expand-btn');
            expandBtn.style('font-size', '10px');
            expandBtn.style('color', '#5DC0D9');
            expandBtn.style('cursor', 'pointer');
            expandBtn.style('margin-top', '5px');
            
            let isExpanded = false;
            expandBtn.mousePressed(() => {
                isExpanded = !isExpanded;
                if (isExpanded) {
                    edgesList.style('display', 'block');
                    expandBtn.html('▼ ' + relatedEdges.length + ' edges');
                } else {
                    edgesList.style('display', 'none');
                    expandBtn.html('▶ ' + relatedEdges.length + ' edges');
                }
            });
            
            expandBtn.parent(stepDiv);
        }
        
        stepDiv.mousePressed(() => selectStep(step.step_id));
        stepDiv.parent(stepList);
    });
}

function draw() {
    background(darkMode ? bgColorDark : bgColor);
    
    // Update physics controls
    updatePhysicsControls();
    
    // Smooth camera movement
    viewX = lerp(viewX, targetViewX, 0.1);
    viewY = lerp(viewY, targetViewY, 0.1);
    zoomLevel = lerp(zoomLevel, targetZoom, 0.1);
    
    // Apply camera transformations
    push();
    translate(width/2, height/2);
    scale(zoomLevel);
    translate(viewX, viewY);
    
    // Apply physics forces
    applyForces();
    
    // Draw ALL edges (active and inactive)
    drawAllEdges();
    
    // Draw nodes
    drawNodes();
    
    pop();
    
    // Handle mouse interaction (after pop, so mouse coords are correct)
    handleMouseInteraction();
}

function applyForces() {
    // Update node physics
    nodePositions.forEach((pos, nodeId) => {
        if (pos.fixed) return;
        
        // Apply velocity damping
        pos.vx *= 0.95;
        pos.vy *= 0.95;
        
        // Apply velocity threshold
        if (abs(pos.vx) < minVelocity) pos.vx = 0;
        if (abs(pos.vy) < minVelocity) pos.vy = 0;
        
        // Cap velocity
        let speed = sqrt(pos.vx * pos.vx + pos.vy * pos.vy);
        if (speed > maxVelocity) {
            let scale = maxVelocity / speed;
            pos.vx *= scale;
            pos.vy *= scale;
        }
        
        // Update position
        pos.x += pos.vx;
        pos.y += pos.vy;
    });
    
    // Repulsion forces between nodes
    const nodeArray = Array.from(nodePositions.entries());
    for (let i = 0; i < nodeArray.length; i++) {
        for (let j = i + 1; j < nodeArray.length; j++) {
            const [idA, posA] = nodeArray[i];
            const [idB, posB] = nodeArray[j];
            
            const dx = posB.x - posA.x;
            const dy = posB.y - posA.y;
            const d = dist(posA.x, posA.y, posB.x, posB.y);
            
            if (d < repelDist && d > 0) {
                const force = repelForce / (d * d);
                if (!posA.fixed) {
                    posA.vx -= force * dx;
                    posA.vy -= force * dy;
                }
                if (!posB.fixed) {
                    posB.vx += force * dx;
                    posB.vy += force * dy;
                }
            }
        }
    }
    
    // Spring forces for connected nodes
    edges.forEach(edge => {
        edge.from_nodes.forEach(fromId => {
            edge.to_nodes.forEach(toId => {
                const fromPos = nodePositions.get(fromId);
                const toPos = nodePositions.get(toId);
                
                if (fromPos && toPos) {
                    const dx = toPos.x - fromPos.x;
                    const dy = toPos.y - fromPos.y;
                    const d = dist(fromPos.x, fromPos.y, toPos.x, toPos.y);
                    
                    if (d > 0) {
                        const force = (d - springLength) * springForce;
                        if (!fromPos.fixed) {
                            fromPos.vx += force * dx / d;
                            fromPos.vy += force * dy / d;
                        }
                        if (!toPos.fixed) {
                            toPos.vx -= force * dx / d;
                            toPos.vy -= force * dy / d;
                        }
                    }
                }
            });
        });
    });
    
    // Gentle center force
    nodePositions.forEach((pos, nodeId) => {
        const dxCenter = -pos.x;
        const dyCenter = -pos.y;
        pos.vx += dxCenter * centerForce;
        pos.vy += dyCenter * centerForce;
    });
}

function drawNodes() {
    noStroke();
    
    nodes.forEach(node => {
        const pos = nodePositions.get(node.node_id);
        if (!pos) return;
        
        // Determine node color and visibility
        let nodeColor = color(textColor);
        let alpha = 255;
        
        if (selectedStep !== null) {
            const relevantEdges = edges.filter(e => 
                e.step_id === selectedStep && 
                (e.from_nodes.includes(node.node_id) || e.to_nodes.includes(node.node_id))
            );
            
            if (relevantEdges.length === 0) {
                alpha = 100; // Dim unrelated nodes
                nodeColor = h3Color;
            } else {
                nodeColor = h1Color; // Highlight active nodes
            }
        } else {
            // Default coloring by hierarchy
            if (node.node_grandparent_id) {
                nodeColor = h1Color; // Individual level - cyan
            } else if (node.node_parent_id) {
                nodeColor = h2Color; // Group level - green  
            } else {
                nodeColor = h3Color; // Organization level - gray
            }
        }
        
        // Hover effect
        if (hoveredNode === node.node_id) {
            nodeColor = color(255, 200, 100);
            alpha = 255;
        }
        
        fill(red(nodeColor), green(nodeColor), blue(nodeColor), alpha);
        
        // All nodes are simple rectangles (SDS style)
        rectMode(CENTER);
        rect(pos.x, pos.y, 10, 10);
        
        // Node label
        fill(red(textColor), green(textColor), blue(textColor), alpha);
        textAlign(CENTER, CENTER);
        textSize(11);
        textFont('Helvetica, sans-serif');
        text(node.node_name, pos.x, pos.y - 18);
    });
}

function drawAllEdges() {
    edges.forEach(edge => {
        edge.from_nodes.forEach(fromId => {
            edge.to_nodes.forEach(toId => {
                drawSingleEdge(edge, fromId, toId);
            });
        });
    });
}

function drawSingleEdge(edge, fromId, toId) {
    const fromPos = getNodeOrCloudPosition(fromId);
    const toPos = getNodeOrCloudPosition(toId);
    
    if (!fromPos || !toPos) return;
    
    // Calculate offset for multiple edges between same nodes
    const edgeKey = `${edge.interaction_id}-${fromId}-${toId}`;
    const offset = edgeOffsets.get(edgeKey) || 0;
    
    // Calculate perpendicular offset
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const len = sqrt(dx*dx + dy*dy);
    if (len === 0) return;
    
    const perpX = -dy / len * offset;
    const perpY = dx / len * offset;
    
    const startX = fromPos.x + perpX;
    const startY = fromPos.y + perpY;
    const endX = toPos.x + perpX;
    const endY = toPos.y + perpY;
    
    // Determine edge color and style based on step selection
    let edgeColor = h3Color; // Default grey
    let alpha = 80; // Dimmed by default
    let strokeW = 1;
    let isActiveEdge = false;
    
    // Check if this edge is active for the selected step
    if (selectedStep !== null && edge.step_id === selectedStep) {
        isActiveEdge = true;
        edgeColor = h2Color; // Bright green for active edges
        alpha = 200;
        strokeW = 2;
    } else if (selectedStep === null) {
        // When no step is selected, show all edges dimmed
        alpha = 60;
    }
    
    // Special cases override step coloring
    if (edge.violated === 1) {
        edgeColor = color(255, 100, 100); // Red for violated
        strokeW = 2;
        alpha = Math.max(alpha, 180); // Ensure violated edges are visible
    } else if (edge.unused === 1) {
        alpha = Math.min(alpha, 40); // Even more dimmed for unused
    }
    
    // Hover effect - only show for active edges or when no step selected
    if (hoveredEdge === edge.interaction_id && (isActiveEdge || selectedStep === null)) {
        edgeColor = color(255, 255, 100); // Yellow on hover
        strokeW = 3;
        alpha = 255;
    }
    
    stroke(red(edgeColor), green(edgeColor), blue(edgeColor), alpha);
    strokeWeight(strokeW);
    
    if (edge.violated === 1) {
        // Draw broken line for violated edges
        drawBrokenLine({ x: startX, y: startY }, { x: endX, y: endY }, 8);
    } else {
        // Draw solid line
        line(startX, startY, endX, endY);
    }
    
    // Draw directional arrows
    drawArrows(startX, startY, endX, endY, edge.bidirectional, edgeColor, alpha);
}

function drawArrows(startX, startY, endX, endY, bidirectional, edgeColor, alpha) {
    const dx = endX - startX;
    const dy = endY - startY;
    const len = sqrt(dx*dx + dy*dy);
    if (len === 0) return;
    
    const unitX = dx / len;
    const unitY = dy / len;
    
    fill(red(edgeColor), green(edgeColor), blue(edgeColor), alpha);
    noStroke();
    
    const arrowSize = 8;
    
    if (bidirectional) {
        // Draw arrow at both ends
        // End arrow
        const endArrowX = endX - unitX * 15; // Move back from node
        const endArrowY = endY - unitY * 15;
        
        push();
        translate(endArrowX, endArrowY);
        rotate(atan2(dy, dx));
        triangle(0, 0, -arrowSize, -arrowSize/2, -arrowSize, arrowSize/2);
        pop();
        
        // Start arrow (pointing opposite direction)
        const startArrowX = startX + unitX * 15; // Move forward from node
        const startArrowY = startY + unitY * 15;
        
        push();
        translate(startArrowX, startArrowY);
        rotate(atan2(-dy, -dx));
        triangle(0, 0, -arrowSize, -arrowSize/2, -arrowSize, arrowSize/2);
        pop();
        
    } else {
        // Draw arrow only at end
        const endArrowX = endX - unitX * 15; // Move back from node
        const endArrowY = endY - unitY * 15;
        
        push();
        translate(endArrowX, endArrowY);
        rotate(atan2(dy, dx));
        triangle(0, 0, -arrowSize, -arrowSize/2, -arrowSize, arrowSize/2);
        pop();
    }
}

function drawBrokenLine(from, to, segments) {
    const dx = (to.x - from.x) / segments;
    const dy = (to.y - from.y) / segments;
    
    for (let i = 0; i < segments; i += 2) {
        const x1 = from.x + dx * i;
        const y1 = from.y + dy * i;
        const x2 = from.x + dx * (i + 1);
        const y2 = from.y + dy * (i + 1);
        
        line(x1, y1, x2, y2);
    }
}

function getNodeOrCloudPosition(nodeId) {
    // Always return direct node position - no more cloud positions
    return nodePositions.get(nodeId);
}

function handleMouseInteraction() {
    // Transform mouse coordinates to world space
    let worldMouseX = (mouseX - width/2) / zoomLevel - viewX;
    let worldMouseY = (mouseY - height/2) / zoomLevel - viewY;
    
    // Check for node hover
    let newHoveredNode = null;
    let newHoveredEdge = null;
    
    // Only check interactions in canvas area
    if (mouseX < width - 350) {
        // Check nodes
        nodes.forEach(node => {
            const pos = nodePositions.get(node.node_id);
            if (pos && dist(worldMouseX, worldMouseY, pos.x, pos.y) < 15) {
                newHoveredNode = node.node_id;
            }
        });
        
        // Check edges if not hovering a node
        if (!newHoveredNode) {
            edges.forEach(edge => {
                edge.from_nodes.forEach(fromId => {
                    edge.to_nodes.forEach(toId => {
                        const fromPos = getNodeOrCloudPosition(fromId);
                        const toPos = getNodeOrCloudPosition(toId);
                        if (fromPos && toPos) {
                            // Check if edge should be hoverable
                            const shouldShowTooltip = selectedStep === null || edge.step_id === selectedStep;
                            
                            if (shouldShowTooltip) {
                                // Calculate offset for multiple edges
                                const edgeKey = `${edge.interaction_id}-${fromId}-${toId}`;
                                const offset = edgeOffsets.get(edgeKey) || 0;
                                
                                const dx = toPos.x - fromPos.x;
                                const dy = toPos.y - fromPos.y;
                                const len = sqrt(dx*dx + dy*dy);
                                if (len === 0) return;
                                
                                const perpX = -dy / len * offset;
                                const perpY = dx / len * offset;
                                
                                const startX = fromPos.x + perpX;
                                const startY = fromPos.y + perpY;
                                const endX = toPos.x + perpX;
                                const endY = toPos.y + perpY;
                                
                                // Check distance to line
                                const distToLine = distanceToLineSegment(
                                    worldMouseX, worldMouseY,
                                    startX, startY, endX, endY
                                );
                                
                                if (distToLine < 8) {
                                    newHoveredEdge = edge.interaction_id;
                                }
                            }
                        }
                    });
                });
            });
        }
    }
    
    hoveredNode = newHoveredNode;
    hoveredEdge = newHoveredEdge;
    
    // Update tooltip
    updateTooltip();
}

function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = sqrt(dx*dx + dy*dy);
    
    if (length === 0) return dist(px, py, x1, y1);
    
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    
    return dist(px, py, projX, projY);
}

function selectStep(stepId) {
    selectedStep = selectedStep === stepId ? null : stepId;
    
    // Update UI
    selectAll('.step-item').forEach(item => item.removeClass('active'));
    if (selectedStep !== null) {
        selectAll('.step-item')[selectedStep].addClass('active');
        stepCounter.html(`Step: ${selectedStep} (${steps[selectedStep].date})`);
    } else {
        stepCounter.html('Step: None Selected');
    }
}

function updateTooltip() {
    if (hoveredNode !== null) {
        const node = nodes.find(n => n.node_id === hoveredNode);
        if (node) {
            const desc = node.node_description || "No description available";
            tooltip.html(`<strong>${node.node_name}</strong><br>${desc}`);
            tooltip.style('display', 'block');
            tooltip.position(mouseX + 10, mouseY - 10);
        }
    } else if (hoveredEdge !== null) {
        const edge = edges.find(e => e.interaction_id === hoveredEdge);
        if (edge) {
            tooltip.html(`<strong>Interaction</strong><br>${edge.interaction_description}`);
            tooltip.style('display', 'block');
            tooltip.position(mouseX + 10, mouseY - 10);
        }
    } else {
        tooltip.style('display', 'none');
    }
}

function mousePressed() {
    if (mouseX < width - 350) {
        // Check if clicking on an edge when no step is selected
        if (selectedStep === null && hoveredEdge !== null) {
            const edge = edges.find(e => e.interaction_id === hoveredEdge);
            if (edge) {
                selectStep(edge.step_id);
                return;
            }
        }
        
        isDraggingView = false;
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }
}

function mouseDragged() {
    if (mouseX < width - 350) { // Only in canvas area
        if (!isDraggingView) {
            // Check if we're dragging a node
            let worldMouseX = (mouseX - width/2) / zoomLevel - viewX;
            let worldMouseY = (mouseY - height/2) / zoomLevel - viewY;
            let worldPMouseX = (pmouseX - width/2) / zoomLevel - viewX;
            let worldPMouseY = (pmouseY - height/2) / zoomLevel - viewY;
            
            let draggedNode = false;
            nodes.forEach(node => {
                const pos = nodePositions.get(node.node_id);
                if (pos && dist(worldPMouseX, worldPMouseY, pos.x, pos.y) < 15) {
                    pos.x = worldMouseX;
                    pos.y = worldMouseY;
                    pos.fixed = true;
                    pos.vx = 0;
                    pos.vy = 0;
                    draggedNode = true;
                }
            });
            
            // If not dragging a node, drag the view
            if (!draggedNode) {
                isDraggingView = true;
                lastMouseX = mouseX;
                lastMouseY = mouseY;
            }
        }
        
        if (isDraggingView) {
            // Pan the view
            let deltaX = (mouseX - lastMouseX) / zoomLevel;
            let deltaY = (mouseY - lastMouseY) / zoomLevel;
            targetViewX += deltaX;
            targetViewY += deltaY;
            lastMouseX = mouseX;
            lastMouseY = mouseY;
        }
    }
}

function mouseReleased() {
    // Release fixed nodes and stop view dragging
    nodePositions.forEach((pos, nodeId) => {
        pos.fixed = false;
    });
    isDraggingView = false;
}

function mouseWheel(event) {
    if (mouseX < width - 350) { // Only in canvas area
        // Zoom in/out
        let zoomFactor = 1 + (event.delta * -0.001);
        targetZoom *= zoomFactor;
        targetZoom = constrain(targetZoom, 0.2, 3.0);
        return false;
    }
}

function windowResized() {
    resizeCanvas(windowWidth - 350, windowHeight);
}