// Debug version with console logging
let nodes = [];
let edges = [];
let steps = [];
let selectedStep = null;
let nodePositions = new Map();
let hoveredNode = null;
let hoveredEdge = null;
let camera = { rotation: 0, elevation: 0, distance: 600 };
let clouds = new Map();
let tooltip;
let stepCounter;

function preload() {
    console.log('Preload started...');
    
    // Load JSON files with detailed error handling
    loadJSON('nodes.json', 
        (data) => { 
            console.log('nodes.json loaded successfully:', data);
            nodes = data;
        },
        (error) => { 
            console.error('Failed to load nodes.json:', error);
            console.log('Check if nodes.json exists and is valid JSON');
            nodes = []; 
        }
    );
    
    loadJSON('edges.json', 
        (data) => { 
            console.log('edges.json loaded successfully:', data);
            edges = data;
        },
        (error) => { 
            console.error('Failed to load edges.json:', error);
            console.log('Check if edges.json exists and is valid JSON');
            edges = []; 
        }
    );
    
    loadJSON('steps.json', 
        (data) => { 
            console.log('steps.json loaded successfully:', data);
            steps = data;
        },
        (error) => { 
            console.error('Failed to load steps.json:', error);
            console.log('Check if steps.json exists and is valid JSON');
            steps = []; 
        }
    );
}

function setup() {
    console.log('Setup started...');
    console.log('nodes:', nodes);
    console.log('edges:', edges);
    console.log('steps:', steps);
    
    let canvas = createCanvas(windowWidth - 350, windowHeight, WEBGL);
    canvas.parent('canvas-container');
    
    tooltip = select('#tooltip');
    stepCounter = select('#step-counter');
    
    // Check if data loaded properly
    if (!Array.isArray(nodes)) {
        console.error('nodes is not an array:', typeof nodes, nodes);
        loadFallbackData();
    }
    if (!Array.isArray(edges)) {
        console.error('edges is not an array:', typeof edges, edges);
    }
    if (!Array.isArray(steps)) {
        console.error('steps is not an array:', typeof steps, steps);
    }
    
    console.log('Final data check:');
    console.log('- nodes length:', nodes.length);
    console.log('- edges length:', edges.length);
    console.log('- steps length:', steps.length);
    
    initializeVisualization();
    createStepList();
}

function loadFallbackData() {
    console.log('Loading fallback data...');
    
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
    
    console.log('Fallback data loaded');
}

function initializeVisualization() {
    console.log('Initializing visualization...');
    generateNodePositions();
    generateClouds();
    console.log('Visualization initialized');
}

function generateNodePositions() {
    console.log('Generating node positions...');
    
    if (!Array.isArray(nodes)) {
        console.error('Cannot generate positions: nodes is not an array');
        return;
    }
    
    const rootNodes = nodes.filter(n => !n.node_parent_id);
    const parentNodes = nodes.filter(n => n.node_parent_id && !n.node_grandparent_id);
    const childNodes = nodes.filter(n => n.node_grandparent_id);
    
    console.log('Node categories:');
    console.log('- Root nodes:', rootNodes.length);
    console.log('- Parent nodes:', parentNodes.length);
    console.log('- Child nodes:', childNodes.length);
    
    // Position root nodes
    rootNodes.forEach((node, i) => {
        const angle = (i / rootNodes.length) * TWO_PI;
        const radius = 300;
        nodePositions.set(node.node_id, {
            x: cos(angle) * radius,
            y: sin(angle) * radius,
            z: 0
        });
    });
    
    // Position parent nodes around their roots
    parentNodes.forEach(node => {
        const parentPos = nodePositions.get(node.node_parent_id);
        if (parentPos) {
            const siblings = parentNodes.filter(n => n.node_parent_id === node.node_parent_id);
            const index = siblings.indexOf(node);
            const angle = (index / Math.max(siblings.length, 1)) * TWO_PI;
            const radius = 150;
            
            nodePositions.set(node.node_id, {
                x: parentPos.x + cos(angle) * radius,
                y: parentPos.y + sin(angle) * radius,
                z: parentPos.z + (Math.random() - 0.5) * 80
            });
        }
    });
    
    // Position child nodes around their parents
    childNodes.forEach(node => {
        const parentPos = nodePositions.get(node.node_parent_id);
        if (parentPos) {
            const siblings = childNodes.filter(n => n.node_parent_id === node.node_parent_id);
            const index = siblings.indexOf(node);
            const angle = (index / Math.max(siblings.length, 1)) * TWO_PI;
            const radius = 80;
            
            nodePositions.set(node.node_id, {
                x: parentPos.x + cos(angle) * radius,
                y: parentPos.y + sin(angle) * radius,
                z: parentPos.z + (Math.random() - 0.5) * 60
            });
        }
    });
    
    console.log('Generated positions for', nodePositions.size, 'nodes');
}

function generateClouds() {
    const parentNodes = [1, 5, 15, 21];
    const grandparentNodes = [2];
    
    parentNodes.forEach(parentId => {
        const children = nodes.filter(n => n.node_parent_id === parentId && n.node_id !== parentId);
        if (children.length > 0) {
            const positions = children.map(child => nodePositions.get(child.node_id)).filter(p => p);
            if (positions.length > 0) {
                const center = calculateCenter(positions);
                clouds.set(parentId, { center, radius: 100, children });
            }
        }
    });
    
    grandparentNodes.forEach(grandparentId => {
        const descendants = nodes.filter(n => n.node_grandparent_id === grandparentId);
        if (descendants.length > 0) {
            const positions = descendants.map(desc => nodePositions.get(desc.node_id)).filter(p => p);
            if (positions.length > 0) {
                const center = calculateCenter(positions);
                clouds.set(grandparentId, { center, radius: 200, children: descendants });
            }
        }
    });
}

function calculateCenter(positions) {
    if (positions.length === 0) return { x: 0, y: 0, z: 0 };
    
    return {
        x: positions.reduce((sum, p) => sum + p.x, 0) / positions.length,
        y: positions.reduce((sum, p) => sum + p.y, 0) / positions.length,
        z: positions.reduce((sum, p) => sum + p.z, 0) / positions.length
    };
}

function draw() {
    background(20, 25, 35);
    
    // Apply camera transformations
    scale(600 / camera.distance);
    rotateY(camera.rotation);
    rotateX(camera.elevation);
    
    // Lighting
    ambientLight(60);
    directionalLight(100, 100, 100, -1, 0.5, -1);
    pointLight(150, 150, 150, 200, -200, 200);
    
    // Draw clouds first
    drawClouds();
    
    // Draw edges
    drawEdges();
    
    // Draw nodes
    drawNodes();
    
    // Handle mouse interaction
    handleMouseInteraction();
}

function drawClouds() {
    clouds.forEach((cloud, nodeId) => {
        push();
        translate(cloud.center.x, cloud.center.y, cloud.center.z);
        
        let isActive = false;
        if (selectedStep !== null) {
            const relevantEdges = edges.filter(e => 
                e.step_id === selectedStep && 
                (e.from_nodes.includes(nodeId) || e.to_nodes.includes(nodeId))
            );
            isActive = relevantEdges.length > 0;
        }
        
        if (isActive) {
            fill(100, 255, 150, 50);
        } else {
            fill(100, 150, 255, 30);
        }
        noStroke();
        sphere(cloud.radius);
        
        if (isActive) {
            stroke(100, 255, 150, 120);
        } else {
            stroke(100, 150, 255, 80);
        }
        strokeWeight(1);
        noFill();
        sphere(cloud.radius);
        
        pop();
    });
}

function drawNodes() {
    nodes.forEach(node => {
        const pos = nodePositions.get(node.node_id);
        if (!pos) return;
        
        push();
        translate(pos.x, pos.y, pos.z);
        
        let nodeColor = color(100, 200, 255);
        let alpha = 255;
        
        if (selectedStep !== null) {
            const relevantEdges = edges.filter(e => 
                e.step_id === selectedStep && 
                (e.from_nodes.includes(node.node_id) || e.to_nodes.includes(node.node_id))
            );
            
            if (relevantEdges.length === 0) {
                alpha = 50;
            } else {
                nodeColor = color(255, 200, 100);
            }
        }
        
        if (hoveredNode === node.node_id) {
            nodeColor = color(255, 100, 100);
        }
        
        fill(red(nodeColor), green(nodeColor), blue(nodeColor), alpha);
        stroke(255, alpha);
        strokeWeight(1);
        
        sphere(10);
        
        // Node label
        push();
        translate(0, -20, 0);
        rotateY(-camera.rotation);
        rotateX(-camera.elevation);
        fill(255, alpha);
        textAlign(CENTER);
        textSize(8);
        text(node.node_name, 0, 0);
        pop();
        
        pop();
    });
}

function drawEdges() {
    edges.forEach(edge => {
        if (selectedStep !== null && edge.step_id !== selectedStep) return;
        
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
    
    let edgeColor = color(150, 150, 150);
    let alpha = 200;
    let strokeW = 1;
    
    if (edge.violated === 1) {
        edgeColor = color(255, 100, 100);
        strokeW = 2;
    } else if (edge.unused === 1) {
        alpha = 80;
    }
    
    if (selectedStep !== null && edge.step_id === selectedStep) {
        edgeColor = color(100, 255, 150);
        strokeW = 2;
    }
    
    if (hoveredEdge === edge.interaction_id) {
        edgeColor = color(255, 255, 100);
        strokeW = 3;
    }
    
    stroke(red(edgeColor), green(edgeColor), blue(edgeColor), alpha);
    strokeWeight(strokeW);
    
    if (edge.violated === 1) {
        drawBrokenLine(fromPos, toPos, 10);
    } else {
        line(fromPos.x, fromPos.y, fromPos.z, toPos.x, toPos.y, toPos.z);
    }
    
    if (edge.bidirectional !== 1) {
        drawArrow(fromPos, toPos, edgeColor, alpha);
    }
}

function getNodeOrCloudPosition(nodeId) {
    if (clouds.has(nodeId)) {
        return clouds.get(nodeId).center;
    }
    return nodePositions.get(nodeId);
}

function drawBrokenLine(from, to, segments) {
    const dx = (to.x - from.x) / segments;
    const dy = (to.y - from.y) / segments;
    const dz = (to.z - from.z) / segments;
    
    for (let i = 0; i < segments; i += 2) {
        const x1 = from.x + dx * i;
        const y1 = from.y + dy * i;
        const z1 = from.z + dz * i;
        const x2 = from.x + dx * (i + 1);
        const y2 = from.y + dy * (i + 1);
        const z2 = from.z + dz * (i + 1);
        
        line(x1, y1, z1, x2, y2, z2);
    }
}

function drawArrow(from, to, edgeColor, alpha) {
    push();
    
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const midZ = (from.z + to.z) / 2;
    
    translate(midX, midY, midZ);
    
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    
    const angleY = atan2(dx, dz);
    const angleX = atan2(dy, sqrt(dx*dx + dz*dz));
    
    rotateY(angleY);
    rotateX(-angleX);
    
    fill(red(edgeColor), green(edgeColor), blue(edgeColor), alpha);
    noStroke();
    
    translate(0, 0, 5);
    cone(3, 10);
    
    pop();
}

function handleMouseInteraction() {
    let newHoveredNode = null;
    let newHoveredEdge = null;
    
    const mousePos = screenToWorld(mouseX - width/2, mouseY - height/2);
    
    nodes.forEach(node => {
        const pos = nodePositions.get(node.node_id);
        if (pos && dist(mousePos.x, mousePos.y, pos.x, pos.y) < 25) {
            newHoveredNode = node.node_id;
        }
    });
    
    if (!newHoveredNode) {
        edges.forEach(edge => {
            if (selectedStep === null || edge.step_id === selectedStep) {
                edge.from_nodes.forEach(fromId => {
                    edge.to_nodes.forEach(toId => {
                        const fromPos = getNodeOrCloudPosition(fromId);
                        const toPos = getNodeOrCloudPosition(toId);
                        if (fromPos && toPos) {
                            const midX = (fromPos.x + toPos.x) / 2;
                            const midY = (fromPos.y + toPos.y) / 2;
                            if (dist(mousePos.x, mousePos.y, midX, midY) < 20) {
                                newHoveredEdge = edge.interaction_id;
                            }
                        }
                    });
                });
            }
        });
    }
    
    hoveredNode = newHoveredNode;
    hoveredEdge = newHoveredEdge;
    
    updateTooltip();
}

function screenToWorld(screenX, screenY) {
    const scale = camera.distance / 600;
    return {
        x: screenX * scale * cos(camera.rotation) - screenY * scale * sin(camera.rotation),
        y: screenX * scale * sin(camera.rotation) + screenY * scale * cos(camera.rotation)
    };
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
        
        stepDiv.mousePressed(() => selectStep(step.step_id));
        stepDiv.parent(stepList);
    });
}

function selectStep(stepId) {
    selectedStep = selectedStep === stepId ? null : stepId;
    
    selectAll('.step-item').forEach(item => item.removeClass('active'));
    if (selectedStep !== null) {
        selectAll('.step-item')[selectedStep].addClass('active');
        stepCounter.html(`Step: ${selectedStep} (${steps[selectedStep].date})`);
    } else {
        stepCounter.html('Step: None Selected');
    }
}

function mouseDragged() {
    if (mouseX < width - 350) {
        camera.rotation += (mouseX - pmouseX) * 0.01;
        camera.elevation += (mouseY - pmouseY) * 0.01;
        camera.elevation = constrain(camera.elevation, -PI/2, PI/2);
    }
}

function mouseWheel(event) {
    if (mouseX < width - 350) {
        camera.distance += event.delta * 5;
        camera.distance = constrain(camera.distance, 200, 1500);
        return false;
    }
}

function windowResized() {
    resizeCanvas(windowWidth - 350, windowHeight);
}