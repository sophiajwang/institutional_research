// Global variables
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
    // Load JSON files with error handling
    loadJSON('nodes.json', 
        (data) => { nodes = data; },
        (error) => { 
            console.error('Failed to load nodes.json:', error);
            nodes = []; // fallback to empty array
        }
    );
    
    loadJSON('edges.json', 
        (data) => { edges = data; },
        (error) => { 
            console.error('Failed to load edges.json:', error);
            edges = []; // fallback to empty array
        }
    );
    
    loadJSON('steps.json', 
        (data) => { steps = data; },
        (error) => { 
            console.error('Failed to load steps.json:', error);
            steps = []; // fallback to empty array
        }
    );
}

function setup() {
    let canvas = createCanvas(windowWidth - 350, windowHeight, WEBGL);
    canvas.parent('canvas-container');
    
    tooltip = select('#tooltip');
    stepCounter = select('#step-counter');
    
    // Check if data loaded properly, if not use fallback data
    if (!Array.isArray(nodes) || nodes.length === 0) {
        console.log('Using fallback data - JSON files may not have loaded properly');
        loadFallbackData();
    }
    
    initializeVisualization();
    createStepList();
}

function loadFallbackData() {
    // Use the embedded data as fallback
    nodes = [
        {
            "node_id": 0,
            "node_name": "Mervin Kelly",
            "node_description": "Executive Vice President",
            "node_parent_id": 1,
            "node_grandparent_id": 2
        },
        {
            "node_id": 1,
            "node_name": "Bell Labs Administration",
            "node_description": "Executive",
            "node_parent_id": 2,
            "node_grandparent_id": null
        },
        {
            "node_id": 2,
            "node_name": "Bell Labs",
            "node_description": "AT&T research arm",
            "node_parent_id": null,
            "node_grandparent_id": null
        },
        {
            "node_id": 3,
            "node_name": "AT&T",
            "node_description": "Management and Holding Company of the Bell System",
            "node_parent_id": null,
            "node_grandparent_id": null
        },
        {
            "node_id": 4,
            "node_name": "William Shockley",
            "node_description": "Lead theorist of solid-state research group",
            "node_parent_id": 5,
            "node_grandparent_id": 2
        },
        {
            "node_id": 5,
            "node_name": "Solid-State Research Group",
            "node_description": "Research team focusing on solid-state physics",
            "node_parent_id": 2,
            "node_grandparent_id": null
        },
        {
            "node_id": 6,
            "node_name": "Walter Houser Brattain",
            "node_description": "Experimental Physicist",
            "node_parent_id": 5,
            "node_grandparent_id": 2
        },
        {
            "node_id": 7,
            "node_name": "John Bardeen",
            "node_description": "Theoretical Physicist",
            "node_parent_id": 5,
            "node_grandparent_id": 2
        },
        {
            "node_id": 8,
            "node_name": "Robert Gibney",
            "node_description": "Electrochemist",
            "node_parent_id": 5,
            "node_grandparent_id": 2
        },
        {
            "node_id": 9,
            "node_name": "Gerald Pearson",
            "node_description": "Experimental Physicist",
            "node_parent_id": 5,
            "node_grandparent_id": 2
        },
        {
            "node_id": 10,
            "node_name": "Frank Jewett",
            "node_description": "Bell Labs Chairman",
            "node_parent_id": 1,
            "node_grandparent_id": 2
        },
        {
            "node_id": 11,
            "node_name": "Oliver Ellsworth Buckley",
            "node_description": "Bell Labs President",
            "node_parent_id": 1,
            "node_grandparent_id": 2
        },
        {
            "node_id": 12,
            "node_name": "Ralph Bown",
            "node_description": "Vice President of Research at Bell Labs, (later) Research Director at Bell Labs",
            "node_parent_id": 1,
            "node_grandparent_id": 2
        },
        {
            "node_id": 13,
            "node_name": "Bell Labs Lawyers",
            "node_description": "Legal team handling patents and intellectual property",
            "node_parent_id": 2,
            "node_grandparent_id": null
        },
        {
            "node_id": 14,
            "node_name": "Government",
            "node_description": "Government regulatory bodies",
            "node_parent_id": 15,
            "node_grandparent_id": null
        },
        {
            "node_id": 15,
            "node_name": "External",
            "node_description": "Agents and institutions external to Bell System",
            "node_parent_id": null,
            "node_grandparent_id": null
        },
        {
            "node_id": 16,
            "node_name": "Military",
            "node_description": "Military organizations and defense contractors",
            "node_parent_id": 15,
            "node_grandparent_id": null
        },
        {
            "node_id": 17,
            "node_name": "Competitors",
            "node_description": "Competing telephony communications technologies companies and later, electronics companies",
            "node_parent_id": 15,
            "node_grandparent_id": null
        },
        {
            "node_id": 18,
            "node_name": "Academia",
            "node_description": "Foremost science and engineering academic-research organizations in the country",
            "node_parent_id": 15,
            "node_grandparent_id": null
        },
        {
            "node_id": 19,
            "node_name": "Public Domain",
            "node_description": "Public knowledge and open research",
            "node_parent_id": 15,
            "node_grandparent_id": null
        },
        {
            "node_id": 20,
            "node_name": "Jack Morton",
            "node_description": "Lead of transistor development team, (later) Vice President of Device Development",
            "node_parent_id": 21,
            "node_grandparent_id": 2
        },
        {
            "node_id": 21,
            "node_name": "Transistor Development Team",
            "node_description": "Engineering team focused on transistor development and manufacturing",
            "node_parent_id": 2,
            "node_grandparent_id": null
        },
        {
            "node_id": 22,
            "node_name": "Gordon Teal",
            "node_description": "Metallurgist",
            "node_parent_id": 21,
            "node_grandparent_id": 2
        },
        {
            "node_id": 23,
            "node_name": "Morgan Sparks",
            "node_description": "Chemist, (later) Director of Solid State Research at Bell Labs, Vice President of Electronics Technology, Director of Sandia National Laboratories",
            "node_parent_id": 21,
            "node_grandparent_id": 2
        },
        {
            "node_id": 24,
            "node_name": "Western Electric",
            "node_description": "AT&T manufacturing arm",
            "node_parent_id": null,
            "node_grandparent_id": null
        }
    ];

    edges = [
        {
            "interaction_id": 0,
            "from_nodes": [2],
            "to_nodes": [3],
            "interaction_description": "Initial cost of $417,000 (mostly salaries) billed to AT&T. Under Bell System protocol, work at Bell Labs had to be billed to either AT&T, Western Electric, or the local operating companies like Pacific Telephone.",
            "step_id": 0,
            "bidirectional": 0,
            "unused": 0,
            "violated": 0
        },
        {
            "interaction_id": 1,
            "from_nodes": [2],
            "to_nodes": [2],
            "interaction_description": "The existing 'knowledge reservoir' included silicon and germanium of p- and n-type controller impurity developed in the late 1930s during the war by Bell Labs metallurgists Scaff and Ohl.",
            "step_id": 0,
            "bidirectional": 0,
            "unused": 0,
            "violated": 0
        },
        {
            "interaction_id": 2,
            "from_nodes": [0],
            "to_nodes": [2],
            "interaction_description": "Combines chemists, physicists, metallurgists, and engineers -- theoreticians with experimentalists -- to work on new electronic technologies.",
            "step_id": 1,
            "bidirectional": 0,
            "unused": 0,
            "violated": 0
        },
        {
            "interaction_id": 3,
            "from_nodes": [0],
            "to_nodes": [2],
            "interaction_description": "Assigns Shockley as research group leader, mandating work that constitutes 'invention,' settling for nothing less than 'starting a new field.'",
            "step_id": 1,
            "bidirectional": 0,
            "unused": 0,
            "violated": 0
        },
        {
            "interaction_id": 4,
            "from_nodes": [0],
            "to_nodes": [4, 6, 7, 8, 9],
            "interaction_description": "Formed solid-state research group.",
            "step_id": 1,
            "bidirectional": 0,
            "unused": 0,
            "violated": 0
        },
        {
            "interaction_id": 5,
            "from_nodes": [4, 6, 7, 8, 9],
            "to_nodes": [0],
            "interaction_description": "Freedom to say 'no.'",
            "step_id": 1,
            "bidirectional": 0,
            "unused": 1,
            "violated": 0
        },
        {
            "interaction_id": 6,
            "from_nodes": [4, 7],
            "to_nodes": [6],
            "interaction_description": "Theorists worked on blackboards, attempting to 'see,' at a subatomic level, the surfaces and interiors of semiconductor crystals. The experimentalists tested the theorists' blackboard predictions at their lab benches with carefully calibrated instruments.",
            "step_id": 1,
            "bidirectional": 0,
            "unused": 0,
            "violated": 0
        },
        {
            "interaction_id": 7,
            "from_nodes": [6],
            "to_nodes": [4, 7],
            "interaction_description": "Theorists would try to interpret the data that emerged from the experimentalists' attempts to investigate the theorists' original ideas.",
            "step_id": 1,
            "bidirectional": 0,
            "unused": 0,
            "violated": 0
        },
        {
            "interaction_id": 8,
            "from_nodes": [0, 10, 11],
            "to_nodes": [2],
            "interaction_description": "Designed Murray Hill (1942). Building shaped like an H with long corridors meant to intersect, forcing researchers to intersect. The building was designed after a university instead of a factory to avoid fixed geographical delineations between departments and increase interchange and close contact.",
            "step_id": 1,
            "bidirectional": 0,
            "unused": 0,
            "violated": 0
        },
        {
            "interaction_id": 9,
            "from_nodes": [5],
            "to_nodes": [5],
            "interaction_description": "Shockley formulated a theory called the 'field effect.' The team attempted to apply an electrical current to the surface of a semiconductor slice to increase the conductivity, resulting in an amplifier. But it didn't. The observable effects were at least 1,500 times smaller than predicted.",
            "step_id": 2,
            "bidirectional": 0,
            "unused": 0,
            "violated": 0
        },
        {
            "interaction_id": 19,
            "from_nodes": [4],
            "to_nodes": [6, 7],
            "interaction_description": "Supervisor authorized to guide, not interfere with, the people he managed, and to absolutely never compete with underlings.",
            "step_id": 6,
            "bidirectional": 0,
            "unused": 0,
            "violated": 1
        }
    ];

    steps = [
        {
            "step_id": 0,
            "step_description": "Mervin Kelly signed off on Case 38,139: unified approach to all of our solid state problems.",
            "date": "06.21.1945",
            "phase": "research"
        },
        {
            "step_id": 1,
            "step_description": "Kelly signed off on Case 38,139: unified approach to all of our solid state problems. Initial cost was $417,000 mostly salaries, billed to AT&T.",
            "date": "07.1945 -- 10.1945",
            "phase": "research"
        },
        {
            "step_id": 2,
            "step_description": "Failures in demonstrating the 'field effect'.",
            "date": "06.1945 -- 01.1946",
            "phase": "research"
        },
        {
            "step_id": 6,
            "step_description": "Shockley makes a transgression; he is spurred into conceptualizing the initial junction transistor after unable to partake in the point-contact transistor's patent (and unable to patent the 'field effect').",
            "date": "01.1948 -- 02.1948",
            "phase": "research"
        }
    ];
}

function initializeVisualization() {
    generateNodePositions();
    generateClouds();
}

function generateNodePositions() {
    // Create a more organized hierarchical layout
    const rootNodes = nodes.filter(n => !n.node_parent_id);
    const parentNodes = nodes.filter(n => n.node_parent_id && !n.node_grandparent_id);
    const childNodes = nodes.filter(n => n.node_grandparent_id);
    
    // Position root nodes (Bell Labs, AT&T, External, Western Electric)
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
}

function generateClouds() {
    // Generate clouds for parent nodes that have children
    const parentNodes = [1, 5, 15, 21]; // Bell Labs Administration, Solid-State Research Group, External, Transistor Development Team
    const grandparentNodes = [2]; // Bell Labs
    
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
    
    // Draw clouds first (behind nodes)
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
        
        // Check if this cloud should be highlighted
        let isActive = false;
        if (selectedStep !== null) {
            const relevantEdges = edges.filter(e => 
                e.step_id === selectedStep && 
                (e.from_nodes.includes(nodeId) || e.to_nodes.includes(nodeId))
            );
            isActive = relevantEdges.length > 0;
        }
        
        // Semi-transparent cloud
        if (isActive) {
            fill(100, 255, 150, 50);
        } else {
            fill(100, 150, 255, 30);
        }
        noStroke();
        sphere(cloud.radius);
        
        // Cloud outline
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
        
        // Determine node color and visibility
        let nodeColor = color(100, 200, 255);
        let alpha = 255;
        
        if (selectedStep !== null) {
            const relevantEdges = edges.filter(e => 
                e.step_id === selectedStep && 
                (e.from_nodes.includes(node.node_id) || e.to_nodes.includes(node.node_id))
            );
            
            if (relevantEdges.length === 0) {
                alpha = 50; // Grey out irrelevant nodes
            } else {
                nodeColor = color(255, 200, 100); // Highlight active nodes
            }
        }
        
        // Hover effect
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
        // Skip if not relevant to selected step
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
    
    // Determine edge color and style
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
        // Draw broken line
        drawBrokenLine(fromPos, toPos, 10);
    } else {
        // Draw solid line
        line(fromPos.x, fromPos.y, fromPos.z, toPos.x, toPos.y, toPos.z);
    }
    
    // Draw arrow for directional edges
    if (edge.bidirectional !== 1) {
        drawArrow(fromPos, toPos, edgeColor, alpha);
    }
}

function getNodeOrCloudPosition(nodeId) {
    // Check if this node should use cloud position
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
    
    // Rotate to point in direction of edge
    const angleY = atan2(dx, dz);
    const angleX = atan2(dy, sqrt(dx*dx + dz*dz));
    
    rotateY(angleY);
    rotateX(-angleX);
    
    fill(red(edgeColor), green(edgeColor), blue(edgeColor), alpha);
    noStroke();
    
    // Draw simple cone arrow
    translate(0, 0, 5);
    cone(3, 10);
    
    pop();
}

function handleMouseInteraction() {
    // Check for node hover
    let newHoveredNode = null;
    let newHoveredEdge = null;
    
    const mousePos = screenToWorld(mouseX - width/2, mouseY - height/2);
    
    // Check nodes
    nodes.forEach(node => {
        const pos = nodePositions.get(node.node_id);
        if (pos && dist(mousePos.x, mousePos.y, pos.x, pos.y) < 25) {
            newHoveredNode = node.node_id;
        }
    });
    
    // Check edges (simplified)
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
    
    // Update tooltip
    updateTooltip();
}

function screenToWorld(screenX, screenY) {
    // Simplified screen to world conversion
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
    
    // Update UI
    selectAll('.step-item').forEach(item => item.removeClass('active'));
    if (selectedStep !== null) {
        selectAll('.step-item')[selectedStep].addClass('active');
        stepCounter.html(`Step: ${selectedStep} (${steps[selectedStep].date})`);
    } else {
        stepCounter.html('Step: None Selected');
    }
}

function mouseDragged() {
    if (mouseX < width - 350) { // Only in canvas area
        camera.rotation += (mouseX - pmouseX) * 0.01;
        camera.elevation += (mouseY - pmouseY) * 0.01;
        camera.elevation = constrain(camera.elevation, -PI/2, PI/2);
    }
}

function mouseWheel(event) {
    if (mouseX < width - 350) { // Only in canvas area
        // More sensitive zoom for trackpad
        camera.distance += event.delta * 2;
        camera.distance = constrain(camera.distance, 200, 1500);
        return false;
    }
}

// Add touch support for mobile and trackpad gestures
let touches = [];
let lastPinchDistance = 0;

function touchStarted() {
    if (touches.length < 2) {
        touches.push({ x: mouseX, y: mouseY });
    }
    return false;
}

function touchMoved() {
    if (touches.length === 1 && mouseX < width - 350) {
        // Single finger - rotate
        camera.rotation += (mouseX - pmouseX) * 0.01;
        camera.elevation += (mouseY - pmouseY) * 0.01;
        camera.elevation = constrain(camera.elevation, -PI/2, PI/2);
        
        touches[0] = { x: mouseX, y: mouseY };
    } else if (touches.length === 2) {
        // Two finger - zoom (pinch gesture)
        const currentDistance = dist(touches[0].x, touches[0].y, mouseX, mouseY);
        if (lastPinchDistance > 0) {
            const zoomChange = (lastPinchDistance - currentDistance) * 3;
            camera.distance += zoomChange;
            camera.distance = constrain(camera.distance, 200, 1500);
        }
        lastPinchDistance = currentDistance;
    }
    return false;
}

function touchEnded() {
    touches = [];
    lastPinchDistance = 0;
    return false;
}

function windowResized() {
    resizeCanvas(windowWidth - 350, windowHeight);
}