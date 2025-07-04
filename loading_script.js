// =================================================================
// GLOBAL VARIABLES
// =================================================================

// Data storage arrays - will be populated from JSON files
let nodes = [];
let edges = [];
let steps = [];
let documents = [];

// UI state variables
let selectedStep = null;
let selectedEdges = new Set(); // Track which edges are checked
let hoveredNode = null;
let hoveredEdge = null;
let tooltip;
let stepCounter;

// 2D Camera controls for pan/zoom functionality
let viewX = 0, viewY = 0;
let targetViewX = 0, targetViewY = 0;
let zoomLevel = 1;
let targetZoom = 1;
let isDragging = false;
let isShiftPressed = false;
let lastMouseX = 0, lastMouseY = 0;

// Layout parameters for node positioning
let nodeSpacing = 150;
let groupRadius = 300;

// Color scheme variables (SDS style)
let bgColor, bgColorDark, textColor, textColorDark;
let h1Color, h1ColorDark, h2Color, h2ColorDark, h3Color, h3ColorDark;
let darkMode = true;

// Data structures for visualization
let nodePositions = new Map(); // Maps node_id to {x, y} position
let edgeOffsets = new Map(); // Maps edge keys to offset values for multiple edges

// =================================================================
// JSON FILE LOADING FUNCTIONS
// =================================================================

/**
 * Generic function to load a single JSON file with error handling
 * @param {string} filename - The JSON file to load
 * @returns {Promise<Array>} - Promise that resolves to an array of data objects
 */
async function loadJsonFile(filename) {
    try {
        console.log(`📁 Loading ${filename}...`);
        const response = await fetch(filename);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`✅ Successfully loaded ${filename} with ${data.length} items`);
        
        // Ensure we always return an array
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(`❌ Error loading ${filename}:`, error);
        return []; // Return empty array on error to prevent crashes
    }
}

/**
 * Load all JSON files simultaneously for better performance
 * @returns {Promise<Object>} - Promise that resolves to object containing all data
 */
async function loadAllJsonFiles() {
    console.log('🔧 Loading all JSON files...');
    
    // Define the files to load and their corresponding data keys
    const files = ['bell_data/nodes.json', 'bell_data/edges.json', 'bell_data/steps.json', 'bell_data/documents.json'];
    const dataKeys = ['nodes', 'edges', 'steps', 'documents'];
    
    try {
        // Load all files in parallel for better performance
        const promises = files.map(file => loadJsonFile(file));
        const results = await Promise.all(promises);
        
        // Create data object with appropriate keys
        const data = {};
        dataKeys.forEach((key, index) => {
            data[key] = results[index];
        });
        
        console.log('✅ All JSON files loaded successfully:');
        console.log(`   📊 Nodes: ${data.nodes.length}`);
        console.log(`   🔗 Edges: ${data.edges.length}`);
        console.log(`   📅 Steps: ${data.steps.length}`);
        console.log(`   📄 Documents: ${data.documents.length}`);
        
        return data;
    } catch (error) {
        console.error('❌ Error loading JSON files:', error);
        
        // Return empty data structure to prevent crashes
        return {
            nodes: [],
            edges: [],
            steps: [],
            documents: []
        };
    }
}

/**
 * Load JSON files with retry logic for better reliability
 * @param {string} filename - The JSON file to load
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Array>} - Promise that resolves to an array of data objects
 */
async function loadJsonFileWithRetry(filename, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(filename);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log(`✅ Successfully loaded ${filename} on attempt ${attempt}`);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            lastError = error;
            console.warn(`⚠️ Attempt ${attempt} failed for ${filename}:`, error.message);
            
            if (attempt < maxRetries) {
                // Wait before retrying (exponential backoff)
                const waitTime = 1000 * attempt;
                console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
    
    console.error(`❌ Failed to load ${filename} after ${maxRetries} attempts:`, lastError);
    return [];
}

// =================================================================
// DATA LOADING AND INITIALIZATION
// =================================================================

/**
 * Main function to load all data and initialize the visualization
 * Called by p5.js preload() function
 */
async function loadDataFromFiles() {
    console.log('🚀 Starting data loading process...');
    
    try {
        // Load all JSON files
        const data = await loadAllJsonFiles();
        
        // Assign loaded data to global variables
        nodes = data.nodes;
        edges = data.edges;
        steps = data.steps;
        documents = data.documents;
        
        // Validate the loaded data
        validateLoadedData();
        
        console.log('🎉 Data loading complete!');
        return true;
    } catch (error) {
        console.error('💥 Critical error during data loading:', error);
        
        return false;
    }
}

/**
 * Validate loaded data for integrity and completeness
 */
function validateLoadedData() {
    console.log('🔍 Validating loaded data...');
    
    const issues = [];
    
    // Validate nodes
    if (nodes.length === 0) {
        issues.push('No nodes loaded');
    } else {
        nodes.forEach((node, index) => {
            if (typeof node.node_id === 'undefined') {
                issues.push(`Node ${index} missing node_id`);
            }
            if (!node.node_name) {
                issues.push(`Node ${index} missing node_name`);
            }
        });
    }
    
    // Validate edges
    if (edges.length === 0) {
        issues.push('No edges loaded');
    } else {
        edges.forEach((edge, index) => {
            if (typeof edge.interaction_id === 'undefined') {
                issues.push(`Edge ${index} missing interaction_id`);
            }
            if (!Array.isArray(edge.from_nodes) || edge.from_nodes.length === 0) {
                issues.push(`Edge ${index} missing or invalid from_nodes`);
            }
            if (!Array.isArray(edge.to_nodes) || edge.to_nodes.length === 0) {
                issues.push(`Edge ${index} missing or invalid to_nodes`);
            }
        });
    }
    
    // Validate steps
    if (steps.length === 0) {
        issues.push('No steps loaded');
    } else {
        steps.forEach((step, index) => {
            if (typeof step.step_id === 'undefined') {
                issues.push(`Step ${index} missing step_id`);
            }
            if (!step.step_description) {
                issues.push(`Step ${index} missing step_description`);
            }
        });
    }
    
    // Check for data consistency
    const nodeIds = new Set(nodes.map(n => n.node_id));
    const referencedNodeIds = new Set();
    
    edges.forEach(edge => {
        edge.from_nodes.forEach(id => referencedNodeIds.add(id));
        edge.to_nodes.forEach(id => referencedNodeIds.add(id));
    });
    
    const missingNodes = [...referencedNodeIds].filter(id => !nodeIds.has(id));
    if (missingNodes.length > 0) {
        issues.push(`Referenced nodes not found: ${missingNodes.join(', ')}`);
    }
    
    const stepIds = new Set(steps.map(s => s.step_id));
    const referencedStepIds = new Set(edges.map(e => e.step_id));
    const missingSteps = [...referencedStepIds].filter(id => !stepIds.has(id));
    if (missingSteps.length > 0) {
        issues.push(`Referenced steps not found: ${missingSteps.join(', ')}`);
    }
    
    // Report validation results
    if (issues.length > 0) {
        console.warn('⚠️ Data validation issues found:');
        issues.forEach(issue => console.warn(`   - ${issue}`));
    } else {
        console.log('✅ Data validation passed!');
    }
    
    // Log summary statistics
    console.log('📊 Data Summary:');
    console.log(`   Nodes: ${nodes.length}`);
    console.log(`   Edges: ${edges.length}`);
    console.log(`   Steps: ${steps.length}`);
    console.log(`   Documents: ${documents.length}`);
    console.log(`   Phases: ${[...new Set(steps.map(s => s.phase || 'null'))].join(', ')}`);
}

// =================================================================
// P5.JS SETUP AND INITIALIZATION
// =================================================================


// Global flag to track if data is loaded
let dataLoaded = false;
let setupComplete = false;
/**
 * p5.js preload function - called before setup()
 * This is where we load all external data
 */
function preload() {
    console.log('🔄 Starting data loading...');
    
    // Start loading data
    loadDataFromFiles().then((success) => {
        dataLoaded = true;
        console.log('✅ Data loading completed');
        
        // If setup has already run, initialize visualization now
        if (setupComplete) {
            initializeVisualizationAfterDataLoad();
        }
    }).catch((error) => {
        console.error('❌ Data loading failed:', error);
        dataLoaded = true; // Set to true anyway to proceed with fallback
        
        if (setupComplete) {
            initializeVisualizationAfterDataLoad();
        }
    });
}

/**
 * p5.js setup function - called once at the beginning
 * Initialize the canvas, colors, and UI elements
 */
function setup() {
    console.log('🎨 Setup function started');
    
    // Create canvas and UI elements first
    let canvas = createCanvas(windowWidth - 350, windowHeight);
    canvas.parent('canvas-container');
    
    tooltip = select('#tooltip');
    stepCounter = select('#step-counter');
    
    initColors();
    setupComplete = true;
    
    // Check if data is already loaded
    if (dataLoaded) {
        initializeVisualizationAfterDataLoad();
    } else {
        console.log('⏳ Waiting for data to load...');
    }
}

// New function called after data loads
function initializeVisualizationAfterDataLoad() {
    console.log('🚀 Initializing visualization after data load...');
    
    // Check if we have valid data
    if (!Array.isArray(nodes) || nodes.length === 0) {
        console.error('❌ No nodes data, using fallback');
        loadFallbackData();
    }
    
    // Now initialize visualization components
    try {
        initializeVisualization();
        createStepList();
        createLegend();
        calculateEdgeOffsets();
        
        console.log('✅ Visualization ready!');
    } catch (error) {
        console.error('❌ Error during initialization:', error);
    }
}

/**
 * Initialize color scheme for the visualization
 */
function initColors() {
    // SDS (Scientific Data Systems) style color scheme
    bgColor = color(20, 20, 20);           // Dark background
    bgColorDark = color(10, 10, 10);       // Darker background
    textColor = color(242, 242, 242);      // Light text
    textColorDark = color(200, 200, 200);  // Darker text
    h1Color = color(93, 192, 217);         // Individual nodes - cyan
    h1ColorDark = color(73, 160, 185);     // Darker cyan
    h2Color = color(120, 180, 120);        // Group nodes - green
    h2ColorDark = color(100, 150, 100);    // Darker green
    h3Color = color(150, 150, 150);        // Organization nodes - gray
    h3ColorDark = color(120, 120, 120);    // Darker gray
}

/**
 * Initialize the visualization by generating node positions
 */
function initializeVisualization() {
    generateNodePositions();
    console.log('✅ Visualization initialized with', nodes.length, 'nodes and', edges.length, 'edges');
    
    // Log additional debug information
    console.log('📊 Additional Data Summary:');
    console.log('   Steps by phase:', steps.reduce((acc, step) => {
        acc[step.phase || 'null'] = (acc[step.phase || 'null'] || 0) + 1;
        return acc;
    }, {}));
    console.log('   Edges with violations:', edges.filter(e => e.violated === 1).length);
    console.log('   Edges unused:', edges.filter(e => e.unused === 1).length);
}

// =================================================================
// NODE POSITIONING AND LAYOUT
// =================================================================

/**
 * Generate 2D positions for all nodes based on their hierarchical relationships
 */
function generateNodePositions() {
    console.log('📐 Generating 2D node positions...');
    
    if (!Array.isArray(nodes) || nodes.length === 0) {
        console.error('❌ Cannot generate positions: nodes is empty or not an array');
        return;
    }
    
    // Organize nodes by hierarchy for better 2D layout
    const rootNodes = nodes.filter(n => !n.node_parent_id);
    const parentNodes = nodes.filter(n => n.node_parent_id && !n.node_grandparent_id);
    const childNodes = nodes.filter(n => n.node_grandparent_id);
    
    console.log(`   Root nodes: ${rootNodes.length}, Parent nodes: ${parentNodes.length}, Child nodes: ${childNodes.length}`);
    
    // Position root nodes in center with circular arrangement
    rootNodes.forEach((node, i) => {
        const angle = (i / rootNodes.length) * TWO_PI;
        nodePositions.set(node.node_id, {
            x: cos(angle) * groupRadius,
            y: sin(angle) * groupRadius
        });
    });
    
    // Position parent nodes in outer ring
    parentNodes.forEach((node, i) => {
        const angle = (i / parentNodes.length) * TWO_PI + PI/4; // Offset from root nodes
        const radius = groupRadius * 1.5;
        nodePositions.set(node.node_id, {
            x: cos(angle) * radius,
            y: sin(angle) * radius
        });
    });
    
    // Position child nodes around their parents
    const parentGroups = {};
    childNodes.forEach(node => {
        if (!parentGroups[node.node_parent_id]) {
            parentGroups[node.node_parent_id] = [];
        }
        parentGroups[node.node_parent_id].push(node);
    });
    
    // Arrange children around their parent nodes
    Object.entries(parentGroups).forEach(([parentId, children]) => {
        const parentPos = nodePositions.get(parseInt(parentId));
        if (parentPos) {
            children.forEach((child, i) => {
                const angle = (i / children.length) * TWO_PI;
                const radius = nodeSpacing;
                nodePositions.set(child.node_id, {
                    x: parentPos.x + cos(angle) * radius,
                    y: parentPos.y + sin(angle) * radius
                });
            });
        } else {
            // Fallback for orphaned children - spread around outer edge
            children.forEach((child, i) => {
                const angle = (i / children.length) * TWO_PI;
                const radius = groupRadius * 2;
                nodePositions.set(child.node_id, {
                    x: cos(angle) * radius,
                    y: sin(angle) * radius
                });
            });
        }
    });
    
    console.log(`✅ Generated 2D positions for ${nodePositions.size} nodes`);
}

/**
 * Calculate edge offsets for multiple edges between the same nodes
 * This prevents edges from overlapping and makes them easier to distinguish
 */
function calculateEdgeOffsets() {
    console.log('📏 Calculating edge offsets...');
    
    edgeOffsets.clear();
    
    // Group edges by from-to node pairs
    const edgeGroups = new Map();
    
    edges.forEach(edge => {
        edge.from_nodes.forEach(fromId => {
            edge.to_nodes.forEach(toId => {
                // Skip self-loops (circular edges) as they don't need offsets
                if (fromId === toId) return;
                
                // Create a unique key for this node pair (order independent)
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
                // Calculate offset based on position in the group
                const offset = (index - (edgeList.length - 1) / 2) * 30;
                const edgeKey = `${edgeInfo.edge.interaction_id}-${edgeInfo.fromId}-${edgeInfo.toId}`;
                edgeOffsets.set(edgeKey, offset);
            });
        }
    });
    
    console.log(`✅ Calculated offsets for ${edgeOffsets.size} edge pairs`);
}

// =================================================================
// UI CREATION FUNCTIONS
// =================================================================

/**
 * Create the legend showing edge and node types
 */
function createLegend() {
    let legend = createDiv('');
    legend.id('legend');
    legend.position(width - 250, height - 180);
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
    
    // Edge type legend
    let edgeTypes = createDiv(`
        <div style="margin: 4px 0;"><span style="color: #78B478;">━━━</span> Active Edge</div>
        <div style="margin: 4px 0;"><span style="color: #999999;">━━━</span> Inactive Edge</div>
        <div style="margin: 4px 0;"><span style="color: #FF6464;">┅┅┅</span> Violated Edge</div>
        <div style="margin: 4px 0;"><span style="color: #666666;">━━━</span> Unused Edge</div>
        <div style="margin: 4px 0;"><span style="color: #78B478;">⭕</span> Self-Loop</div>
    `);
    edgeTypes.parent(legend);
    
    // Node type legend
    let nodeTypes = createDiv(`
        <div style="margin: 6px 0 4px 0; font-weight: bold;">Nodes:</div>
        <div style="margin: 2px 0;"><span style="color: #5DC0D9;">■</span> Individual/Child</div>
        <div style="margin: 2px 0;"><span style="color: #78B478;">■</span> Group/Parent</div>
        <div style="margin: 2px 0;"><span style="color: #999999;">■</span> Organization/Root</div>
        <div style="margin: 2px 0;"><span style="color: #FFA500;">■</span> Related Children</div>
    `);
    nodeTypes.parent(legend);
}

// Make selectStep globally accessible for navigation buttons
window.selectStep = selectStep;

/**
 * Create the step list in the sidebar with expandable edge details
 */
function createStepList() {
    const stepList = select('#step-list');
    
    // Group steps by phase for better organization
    const phaseGroups = {
        research: steps.filter(s => s.phase === 'research'),
        development: steps.filter(s => s.phase === 'development'),
        impact: steps.filter(s => !s.phase || s.phase === null)
    };
    
    // Create phase sections
    Object.entries(phaseGroups).forEach(([phase, phaseSteps]) => {
        if (phaseSteps.length === 0) return;
        
        // Create phase header
        const phaseHeader = createDiv(phase.charAt(0).toUpperCase() + phase.slice(1));
        phaseHeader.class('phase-header');
        phaseHeader.style('color', '#5DC0D9');
        phaseHeader.style('font-weight', 'bold');
        phaseHeader.style('font-size', '14px');
        phaseHeader.style('margin', '20px 0 10px 0');
        phaseHeader.style('text-transform', 'uppercase');
        phaseHeader.style('letter-spacing', '1px');
        if (phase === 'research') {
            phaseHeader.style('margin-top', '0');
        }
        phaseHeader.parent(stepList);
        
        // Create step items
        phaseSteps.forEach(step => {
            const stepDiv = createDiv();
            stepDiv.class('step-item');
            stepDiv.addClass(step.phase || 'null');
            
            // Step date
            const dateDiv = createDiv(step.date);
            dateDiv.class('step-date');
            dateDiv.parent(stepDiv);
            
            // Step description
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
                
                // Create edge items with checkboxes
                relatedEdges.forEach(edge => {
                    const edgeItem = createDiv();
                    edgeItem.class('edge-item');
                    edgeItem.style('font-size', '11px');
                    edgeItem.style('color', '#BBBBBB');
                    edgeItem.style('margin', '3px 0');
                    edgeItem.style('cursor', 'pointer');
                    edgeItem.style('padding', '3px');
                    edgeItem.style('border-radius', '2px');
                    edgeItem.style('position', 'relative');
                    edgeItem.style('display', 'flex');
                    edgeItem.style('align-items', 'center');
                    
                    // Create checkbox for edge selection
                    const checkbox = createCheckbox('', false);
                    checkbox.style('margin-right', '8px');
                    checkbox.style('transform', 'scale(0.8)');
                    checkbox.changed(() => {
                        if (checkbox.checked()) {
                            selectedEdges.add(edge.interaction_id);
                        } else {
                            selectedEdges.delete(edge.interaction_id);
                        }
                    });
                    
                    // Prevent checkbox events from bubbling to step selection
                    checkbox.elt.addEventListener('click', (e) => {
                        e.stopPropagation();
                    });
                    checkbox.parent(edgeItem);
                    
                    // Get node names for display
                    const fromNames = edge.from_nodes.map(id => {
                        const node = nodes.find(n => n.node_id === id);
                        return node ? node.node_name : id;
                    }).join(', ');
                    
                    const toNames = edge.to_nodes.map(id => {
                        const node = nodes.find(n => n.node_id === id);
                        return node ? node.node_name : id;
                    }).join(', ');
                    
                    // Check for self-loop
                    const isSelfLoop = edge.from_nodes.some(fromId => 
                        edge.to_nodes.includes(fromId)
                    );
                    
                    // Create display string with appropriate arrow
                    const arrow = isSelfLoop ? '↻' : (edge.bidirectional ? '↔' : '→');
                    const display = isSelfLoop ? fromNames + ' ' + arrow : `${fromNames} ${arrow} ${toNames}`;
                    
                    const textSpan = createSpan(display);
                    textSpan.style('vertical-align', 'middle');
                    textSpan.parent(edgeItem);
                    
                    // Add hover effects
                    edgeItem.mouseOver(() => {
                        edgeItem.style('background', '#444');
                        hoveredEdge = edge.interaction_id;
                    });
                    
                    edgeItem.mouseOut(() => {
                        edgeItem.style('background', 'transparent');
                        if (hoveredEdge === edge.interaction_id) hoveredEdge = null;
                    });
                    
                    // Prevent edge item clicks from bubbling to step selection
                    edgeItem.elt.addEventListener('click', (e) => {
                        e.stopPropagation();
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
                expandBtn.mousePressed((e) => {
                    e.stopPropagation(); // Prevent step selection
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
            
            // Make step clickable
            stepDiv.mousePressed(() => selectStep(step.step_id));
            stepDiv.parent(stepList);
        });
    });
}

// =================================================================
// MAIN DRAW LOOP AND RENDERING
// =================================================================

/**
 * p5.js main draw loop - called continuously
 */
function draw() {
    // Set background color
    background(darkMode ? bgColorDark : bgColor);
    
    // If data isn't loaded yet, show loading screen
    if (!dataLoaded || !Array.isArray(nodes) || nodes.length === 0) {
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(16);
        text('Loading data...', width/2, height/2);
        return;
    }
    
    // Smooth camera interpolation for smooth pan/zoom
    viewX = lerp(viewX, targetViewX, 0.05);
    viewY = lerp(viewY, targetViewY, 0.05);
    zoomLevel = lerp(zoomLevel, targetZoom, 0.05);
    
    // Apply 2D transformations
    push();
    translate(width/2, height/2);
    scale(zoomLevel);
    translate(viewX, viewY);
    
    // Draw all edges first (so they appear behind nodes)
    drawAllEdges();
    
    // Draw all nodes
    drawNodes();
    
    pop();
    
    // Handle mouse interaction (outside of transformed space)
    handleMouseInteraction();
}

/**
 * Draw all nodes with appropriate colors and styling
 */
function drawNodes() {
    nodes.forEach(node => {
        const pos = nodePositions.get(node.node_id);
        if (!pos) return;
        
        // Determine node color and visibility based on current selection
        let nodeColor = color(textColor);
        let alpha = 255;
        let isRelevantNode = false;
        let isHighlightedChild = false;
        
        if (selectedStep !== null) {
            // Check if this node is involved in the selected step
            const relevantEdges = edges.filter(e => 
                e.step_id === selectedStep && 
                (e.from_nodes.includes(node.node_id) || e.to_nodes.includes(node.node_id))
            );
            
            isRelevantNode = relevantEdges.length > 0;
            
            // Check if this node should be highlighted as part of parent/grandparent organization
            const stepEdges = edges.filter(e => e.step_id === selectedStep);
            stepEdges.forEach(edge => {
                edge.from_nodes.concat(edge.to_nodes).forEach(nodeId => {
                    const targetNode = nodes.find(n => n.node_id === nodeId);
                    if (targetNode) {
                        // If edge references parent/grandparent, highlight their children
                        if (targetNode.node_parent_id && !targetNode.node_grandparent_id) {
                            // This is a parent node, highlight its children
                            if (node.node_parent_id === targetNode.node_id) {
                                isHighlightedChild = true;
                            }
                        } else if (!targetNode.node_parent_id) {
                            // This is a grandparent node, highlight its children and grandchildren
                            if (node.node_parent_id === targetNode.node_id || node.node_grandparent_id === targetNode.node_id) {
                                isHighlightedChild = true;
                            }
                        }
                    }
                });
            });
            
            // Apply appropriate styling based on relevance
            if (isRelevantNode) {
                nodeColor = h1Color;
                alpha = 255;
            } else if (isHighlightedChild) {
                nodeColor = color(255, 165, 0); // Orange for highlighted children
                alpha = 200;
            } else {
                // Show other nodes greyed out but visible
                alpha = 80;
                nodeColor = h3Color;
            }
        } else {
            // Default coloring by hierarchy when no step is selected
            isRelevantNode = true;
            if (node.node_grandparent_id) {
                nodeColor = h1Color; // Individual level - cyan
            } else if (node.node_parent_id) {
                nodeColor = h2Color; // Group level - green  
            } else {
                nodeColor = h3Color; // Organization level - gray
            }
        }
        
        // Apply hover effect
        if (hoveredNode === node.node_id) {
            if (selectedStep === null || isRelevantNode) {
                nodeColor = color(255, 200, 100);
                alpha = 255;
            }
        }
        
        // Draw node
        fill(red(nodeColor), green(nodeColor), blue(nodeColor), alpha);
        stroke(255, alpha * 0.5);
        strokeWeight(1);
        
        // Draw 2D rectangle nodes
        rectMode(CENTER);
        rect(pos.x, pos.y, 12, 12);
        
        // Draw node label
        fill(red(textColor), green(textColor), blue(textColor), alpha);
        textAlign(CENTER, CENTER);
        textSize(10);
        text(node.node_name, pos.x, pos.y - 20);
    });
}

/**
 * Draw all edges with appropriate styling
 */
function drawAllEdges() {
    edges.forEach(edge => {
        edge.from_nodes.forEach(fromId => {
            edge.to_nodes.forEach(toId => {
                drawSingleEdge(edge, fromId, toId);
            });
        });
    });
}

/**
 * Draw a single edge between two nodes
 * @param {Object} edge - The edge data object
 * @param {number} fromId - ID of the source node
 * @param {number} toId - ID of the target node
 */
function drawSingleEdge(edge, fromId, toId) {
    const fromPos = nodePositions.get(fromId);
    const toPos = nodePositions.get(toId);
    
    if (!fromPos || !toPos) return;
    
    // Handle self-loops (circular edges)
    if (fromId === toId) {
        drawCircularEdge(edge, fromPos);
        return;
    }
    
    // Get edge offset for multiple edges between same nodes
    const edgeKey = `${edge.interaction_id}-${fromId}-${toId}`;
    const offset = edgeOffsets.get(edgeKey) || 0;
    
    // Determine edge color and style based on selection and edge properties
    let edgeColor = h3Color;
    let alpha = 80;
    let strokeW = 1;
    let isActiveEdge = false;
    let shouldShow = true;
    
    if (selectedStep !== null) {
        if (edge.step_id === selectedStep) {
            isActiveEdge = true;
            // Check if this specific edge is selected in the UI
            if (selectedEdges.size > 0) {
                shouldShow = selectedEdges.has(edge.interaction_id);
                if (shouldShow) {
                    edgeColor = h2Color;
                    alpha = 200;
                    strokeW = 2;
                } else {
                    alpha = 30;
                }
            } else {
                edgeColor = h2Color;
                alpha = 200;
                strokeW = 2;
            }
        } else {
            // Show other edges greyed out when step is selected
            edgeColor = h3Color;
            alpha = 30;
            shouldShow = true;
        }
    } else {
        alpha = 60;
        // When no step is selected, violated edges should be greyed out
        if (edge.violated === 1) {
            edgeColor = h3Color;
            alpha = 40;
        }
    }
    
    // Apply special styling for active edges
    if (isActiveEdge && shouldShow) {
        if (edge.violated === 1) {
            edgeColor = color(255, 100, 100);
            strokeW = 2;
            alpha = Math.max(alpha, 180);
        } else if (edge.unused === 1) {
            alpha = Math.min(alpha, 80);
        }
    }
    
    // Apply hover effect
    if (hoveredEdge === edge.interaction_id && (selectedStep === null || shouldShow)) {
        edgeColor = color(255, 255, 100);
        strokeW = 3;
        alpha = 255;
    }
    
    if (alpha <= 0) return;
    
    // Set stroke properties
    stroke(red(edgeColor), green(edgeColor), blue(edgeColor), alpha);
    strokeWeight(strokeW);
    
    // Draw curved line if there's an offset, straight line otherwise
    if (offset !== 0) {
        drawCurvedEdge(fromPos, toPos, offset, edge.violated === 1 && isActiveEdge);
    } else {
        if (edge.violated === 1 && isActiveEdge) {
            drawBrokenLine2D(fromPos, toPos, 8);
        } else {
            line(fromPos.x, fromPos.y, toPos.x, toPos.y);
        }
    }
}

/**
 * Draw a curved edge between two positions
 * @param {Object} fromPos - Starting position {x, y}
 * @param {Object} toPos - Ending position {x, y}
 * @param {number} offset - Curve offset amount
 * @param {boolean} isBroken - Whether to draw as broken line
 */
function drawCurvedEdge(fromPos, toPos, offset, isBroken) {
    // Calculate midpoint
    const midX = (fromPos.x + toPos.x) / 2;
    const midY = (fromPos.y + toPos.y) / 2;
    
    // Calculate perpendicular vector for curve
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const len = sqrt(dx*dx + dy*dy);
    
    if (len === 0) return;
    
    const perpX = -dy / len * offset;
    const perpY = dx / len * offset;
    
    const controlX = midX + perpX;
    const controlY = midY + perpY;
    
    if (isBroken) {
        // Draw broken curved line
        const segments = 20;
        for (let i = 0; i < segments; i += 2) {
            const t1 = i / segments;
            const t2 = (i + 1) / segments;
            
            const x1 = bezierPoint(fromPos.x, controlX, controlX, toPos.x, t1);
            const y1 = bezierPoint(fromPos.y, controlY, controlY, toPos.y, t1);
            const x2 = bezierPoint(fromPos.x, controlX, controlX, toPos.x, t2);
            const y2 = bezierPoint(fromPos.y, controlY, controlY, toPos.y, t2);
            
            line(x1, y1, x2, y2);
        }
    } else {
        // Draw smooth curved line
        noFill();
        bezier(fromPos.x, fromPos.y, controlX, controlY, controlX, controlY, toPos.x, toPos.y);
    }
}

/**
 * Draw a circular edge (self-loop) around a node
 * @param {Object} edge - The edge data object
 * @param {Object} nodePos - Position of the node {x, y}
 */
function drawCircularEdge(edge, nodePos) {
    // Determine styling based on selection state
    let edgeColor = h3Color;
    let alpha = 80;
    let strokeW = 1;
    let isActiveEdge = false;
    let shouldShow = true;
    
    if (selectedStep !== null) {
        if (edge.step_id === selectedStep) {
            isActiveEdge = true;
            if (selectedEdges.size > 0) {
                shouldShow = selectedEdges.has(edge.interaction_id);
                if (shouldShow) {
                    edgeColor = h2Color;
                    alpha = 200;
                    strokeW = 2;
                } else {
                    alpha = 30;
                }
            } else {
                edgeColor = h2Color;
                alpha = 200;
                strokeW = 2;
            }
        } else {
            // Show other edges greyed out when step is selected
            edgeColor = h3Color;
            alpha = 30;
            shouldShow = true;
        }
    } else {
        alpha = 60;
        if (edge.violated === 1) {
            edgeColor = h3Color;
            alpha = 40;
        }
    }
    
    // Apply special styling for active edges
    if (isActiveEdge && shouldShow) {
        if (edge.violated === 1) {
            edgeColor = color(255, 100, 100);
            strokeW = 2;
            alpha = Math.max(alpha, 180);
        } else if (edge.unused === 1) {
            alpha = Math.min(alpha, 80);
        }
    }
    
    // Apply hover effect
    if (hoveredEdge === edge.interaction_id && (selectedStep === null || shouldShow)) {
        edgeColor = color(255, 255, 100);
        strokeW = 3;
        alpha = 255;
    }
    
    if (alpha <= 0) return;
    
    // Set stroke properties
    stroke(red(edgeColor), green(edgeColor), blue(edgeColor), alpha);
    strokeWeight(strokeW);
    noFill();
    
    // Draw circular loop
    const radius = 25;
    const nodeRadius = 6;
    
    // Calculate starting point on the node perimeter
    const startAngle = -PI/4;
    const startX = nodePos.x + cos(startAngle) * nodeRadius;
    const startY = nodePos.y + sin(startAngle) * nodeRadius;
    
    if (edge.violated === 1 && isActiveEdge) {
        // Draw broken circular line
        const segments = 8;
        for (let i = 0; i < segments; i += 2) {
            const t1 = i / segments;
            const t2 = (i + 1) / segments;
            
            const angle1 = startAngle + t1 * TWO_PI;
            const angle2 = startAngle + t2 * TWO_PI;
            
            const x1 = nodePos.x + cos(angle1) * (nodeRadius + radius * 0.7);
            const y1 = nodePos.y + sin(angle1) * (nodeRadius + radius * 0.7);
            const x2 = nodePos.x + cos(angle2) * (nodeRadius + radius * 0.7);
            const y2 = nodePos.y + sin(angle2) * (nodeRadius + radius * 0.7);
            
            line(x1, y1, x2, y2);
        }
    } else {
        // Draw smooth circular loop
        const controlRadius = radius * 1.2;
        bezier(
            startX, startY,
            nodePos.x + controlRadius, nodePos.y - controlRadius,
            nodePos.x + controlRadius, nodePos.y + controlRadius,
            startX, startY
        );
        
        // Add arrow head for direction
        const arrowSize = 3;
        const endAngle = startAngle + PI/6;
        const arrowX = startX + cos(endAngle) * arrowSize;
        const arrowY = startY + sin(endAngle) * arrowSize;
        
        line(startX, startY, arrowX, arrowY);
        line(startX, startY, startX + cos(endAngle - PI/2) * arrowSize, startY + sin(endAngle - PI/2) * arrowSize);
    }
}

/**
 * Draw a broken line (for violated edges)
 * @param {Object} from - Starting position {x, y}
 * @param {Object} to - Ending position {x, y}
 * @param {number} segments - Number of line segments
 */
function drawBrokenLine2D(from, to, segments) {
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

// =================================================================
// MOUSE AND KEYBOARD INTERACTION
// =================================================================

/**
 * Handle mouse interaction for hovering and clicking
 */
function handleMouseInteraction() {
    // Transform mouse coordinates to world space
    let worldMouseX = (mouseX - width/2) / zoomLevel - viewX;
    let worldMouseY = (mouseY - height/2) / zoomLevel - viewY;
    
    let newHoveredNode = null;
    let newHoveredEdge = null;
    
    // Only check for interactions within the canvas area (not sidebar)
    if (mouseX < width - 350) {
        // Check for node hover
        nodes.forEach(node => {
            const pos = nodePositions.get(node.node_id);
            if (pos && dist(worldMouseX, worldMouseY, pos.x, pos.y) < 20) {
                if (selectedStep === null) {
                    newHoveredNode = node.node_id;
                } else {
                    // Check if node is relevant to selected step
                    const relevantEdges = edges.filter(e => 
                        e.step_id === selectedStep && 
                        (e.from_nodes.includes(node.node_id) || e.to_nodes.includes(node.node_id))
                    );
                    if (relevantEdges.length > 0) {
                        newHoveredNode = node.node_id;
                    }
                }
            }
        });
        
        // Check for edge hover if not hovering a node
        if (!newHoveredNode) {
            edges.forEach(edge => {
                let shouldShowTooltip = false;
                
                if (selectedStep === null) {
                    shouldShowTooltip = true;
                } else if (edge.step_id === selectedStep) {
                    if (selectedEdges.size > 0) {
                        shouldShowTooltip = selectedEdges.has(edge.interaction_id);
                    } else {
                        shouldShowTooltip = true;
                    }
                } else {
                    shouldShowTooltip = true;
                }
                
                if (shouldShowTooltip) {
                    edge.from_nodes.forEach(fromId => {
                        edge.to_nodes.forEach(toId => {
                            const fromPos = nodePositions.get(fromId);
                            const toPos = nodePositions.get(toId);
                            if (fromPos && toPos) {
                                // Handle self-loops
                                if (fromId === toId) {
                                    const distToCenter = dist(worldMouseX, worldMouseY, fromPos.x, fromPos.y);
                                    if (distToCenter > 15 && distToCenter < 35) {
                                        newHoveredEdge = edge.interaction_id;
                                    }
                                } else {
                                    // Check distance to edge
                                    const edgeKey = `${edge.interaction_id}-${fromId}-${toId}`;
                                    const offset = edgeOffsets.get(edgeKey) || 0;
                                    
                                    let distToLine;
                                    if (offset !== 0) {
                                        distToLine = distanceToCurve(worldMouseX, worldMouseY, fromPos, toPos, offset);
                                    } else {
                                        distToLine = distanceToLineSegment(
                                            worldMouseX, worldMouseY,
                                            fromPos.x, fromPos.y, toPos.x, toPos.y
                                        );
                                    }
                                    
                                    if (distToLine < 8) {
                                        newHoveredEdge = edge.interaction_id;
                                    }
                                }
                            }
                        });
                    });
                }
            });
        }
    }
    
    // Update hover state
    hoveredNode = newHoveredNode;
    hoveredEdge = newHoveredEdge;
    
    // Update tooltip
    updateTooltip();
}

/**
 * Calculate distance from point to curved line
 * @param {number} px - Point x coordinate
 * @param {number} py - Point y coordinate
 * @param {Object} fromPos - Start position {x, y}
 * @param {Object} toPos - End position {x, y}
 * @param {number} offset - Curve offset
 * @returns {number} Distance to curve
 */
function distanceToCurve(px, py, fromPos, toPos, offset) {
    const midX = (fromPos.x + toPos.x) / 2;
    const midY = (fromPos.y + toPos.y) / 2;
    
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const len = sqrt(dx*dx + dy*dy);
    
    if (len === 0) return Infinity;
    
    const perpX = -dy / len * offset;
    const perpY = dx / len * offset;
    
    const controlX = midX + perpX;
    const controlY = midY + perpY;
    
    // Sample points along the curve and find minimum distance
    let minDist = Infinity;
    const samples = 20;
    
    for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const x = bezierPoint(fromPos.x, controlX, controlX, toPos.x, t);
        const y = bezierPoint(fromPos.y, controlY, controlY, toPos.y, t);
        const d = dist(px, py, x, y);
        if (d < minDist) {
            minDist = d;
        }
    }
    
    return minDist;
}

/**
 * Calculate distance from point to line segment
 * @param {number} px - Point x coordinate
 * @param {number} py - Point y coordinate
 * @param {number} x1 - Line start x
 * @param {number} y1 - Line start y
 * @param {number} x2 - Line end x
 * @param {number} y2 - Line end y
 * @returns {number} Distance to line segment
 */
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

/**
 * Handle step selection and filtering
 * @param {number} stepId - The ID of the step to select
 */
function selectStep(stepId) {
    selectedStep = selectedStep === stepId ? null : stepId;
    selectedEdges.clear(); // Clear selected edges when changing steps
    
    // Update UI styling
    selectAll('.step-item').forEach(item => item.removeClass('active'));
    if (selectedStep !== null) {
        selectAll('.step-item').forEach((item, index) => {
            if (steps[index] && steps[index].step_id === selectedStep) {
                item.addClass('active');
            }
        });
        
        updateStepCounter();
        panToStepElements(selectedStep);
        
        // Uncheck all checkboxes
        selectAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked(false);
        });
    } else {
        stepCounter.html('Step: None Selected');
    }
}

/**
 * Update the step counter display
 */
function updateStepCounter() {
    if (selectedStep !== null) {
        const step = steps.find(s => s.step_id === selectedStep);
        if (step) {
            // Create navigation controls
            const prevButton = selectedStep > 0 ? 
                `<button onclick="selectStep(${selectedStep - 1})" style="background: #5DC0D9; border: none; color: white; padding: 2px 6px; margin-right: 5px; border-radius: 2px; cursor: pointer;">←</button>` : '';
            const nextButton = selectedStep < steps.length - 1 ? 
                `<button onclick="selectStep(${selectedStep + 1})" style="background: #5DC0D9; border: none; color: white; padding: 2px 6px; margin-left: 5px; border-radius: 2px; cursor: pointer;">→</button>` : '';
            
            stepCounter.html(`
                <div style="text-align: center;">
                    ${prevButton}
                    <span style="color: #5DC0D9; font-weight: bold;">Step ${selectedStep}</span>
                    ${nextButton}
                </div>
                <div style="font-size: 12px; margin-top: 5px; color: #F2F2F2; line-height: 1.3;">
                    ${step.step_description}
                </div>
                <div style="font-size: 10px; margin-top: 3px; color: #BBBBBB;">
                    ${step.date}
                </div>
            `);
        }
    }
}

/**
 * Pan camera to show elements involved in the selected step
 * @param {number} stepId - The ID of the step to focus on
 */
function panToStepElements(stepId) {
    const stepEdges = edges.filter(e => e.step_id === stepId);
    const involvedNodeIds = new Set();
    
    // Collect all nodes involved in this step
    stepEdges.forEach(edge => {
        edge.from_nodes.forEach(id => involvedNodeIds.add(id));
        edge.to_nodes.forEach(id => involvedNodeIds.add(id));
    });
    
    if (involvedNodeIds.size === 0) return;
    
    // Calculate center point of all involved nodes
    let centerX = 0, centerY = 0;
    let count = 0;
    
    involvedNodeIds.forEach(nodeId => {
        const pos = nodePositions.get(nodeId);
        if (pos) {
            centerX += pos.x;
            centerY += pos.y;
            count++;
        }
    });
    
    if (count > 0) {
        centerX /= count;
        centerY /= count;
        
        // Smoothly pan to the center of relevant nodes
        targetViewX = -centerX;
        targetViewY = -centerY;
        
        // Optionally adjust zoom to fit all relevant nodes
        targetZoom = constrain(targetZoom * 1.1, 0.8, 2.0);
    }
}

/**
 * Update tooltip display based on hovered element
 */
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
            tooltip.html(edge.interaction_description);
            tooltip.style('display', 'block');
            tooltip.position(mouseX + 10, mouseY - 10);
        }
    } else {
        tooltip.style('display', 'none');
    }
}

/**
 * Handle key press events
 */
function keyPressed() {
    if (keyCode === SHIFT) {
        isShiftPressed = true;
    }
    
    // Plus and minus keys for zoom
    if (key === '=' || key === '+') {
        targetZoom = constrain(targetZoom * 1.1, 0.2, 3.0);
    } else if (key === '-') {
        targetZoom = constrain(targetZoom * 0.9, 0.2, 3.0);
    }
}

/**
 * Handle key release events
 */
function keyReleased() {
    if (keyCode === SHIFT) {
        isShiftPressed = false;
    }
}

/**
 * Handle mouse press events
 */
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
        
        // Start dragging for pan functionality
        isDragging = true;
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }
}

/**
 * Handle mouse drag events for panning
 */
function mouseDragged() {
    if (isDragging && mouseX < width - 350) {
        const deltaX = mouseX - lastMouseX;
        const deltaY = mouseY - lastMouseY;
        
        if (isShiftPressed) {
            // Enhanced pan with shift (more sensitive)
            const sensitivity = 0.005;
            targetViewX += deltaX * sensitivity * 100;
            targetViewY += deltaY * sensitivity * 100;
        } else {
            // Regular pan
            const sensitivity = 1.0 / zoomLevel;
            targetViewX += deltaX * sensitivity;
            targetViewY += deltaY * sensitivity;
        }
        
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }
}

/**
 * Handle mouse release events
 */
function mouseReleased() {
    isDragging = false;
}

/**
 * Handle window resize events
 */
function windowResized() {
    resizeCanvas(windowWidth - 350, windowHeight);
}

// =================================================================
// UTILITY FUNCTIONS
// =================================================================

/**
 * Log loading progress with emoji indicators
 * @param {string} message - The message to log
 * @param {string} type - The type of message (info, success, warning, error)
 */
function logProgress(message, type = 'info') {
    const icons = {
        info: '🔧',
        success: '✅',
        warning: '⚠️',
        error: '❌'
    };
    
    console.log(`${icons[type]} ${message}`);
}

/**
 * Constrain a value between min and max
 * @param {number} value - The value to constrain
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Constrained value
 */
function constrain(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Calculate distance between two points
 * @param {number} x1 - First point x
 * @param {number} y1 - First point y
 * @param {number} x2 - Second point x
 * @param {number} y2 - Second point y
 * @returns {number} Distance between points
 */
function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Calculate square root
 * @param {number} value - Value to calculate square root of
 * @returns {number} Square root
 */
function sqrt(value) {
    return Math.sqrt(value);
}

/**
 * Calculate cosine
 * @param {number} angle - Angle in radians
 * @returns {number} Cosine value
 */
function cos(angle) {
    return Math.cos(angle);
}

/**
 * Calculate sine
 * @param {number} angle - Angle in radians
 * @returns {number} Sine value
 */
function sin(angle) {
    return Math.sin(angle);
}

/**
 * Calculate a point on a Bezier curve
 * @param {number} a - First control point
 * @param {number} b - Second control point
 * @param {number} c - Third control point
 * @param {number} d - Fourth control point
 * @param {number} t - Parameter (0-1)
 * @returns {number} Point on curve
 */
function bezierPoint(a, b, c, d, t) {
    const u = 1 - t;
    return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

// =================================================================
// CONSTANTS
// =================================================================

const PI = Math.PI;
const TWO_PI = Math.PI * 2;

// =================================================================
// INITIALIZATION
// =================================================================

/**
 * Initialize the application once DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Bell Labs Transistor Visualization Loading...');
    console.log('📁 Preparing to load JSON data files...');
    
    // The actual loading will happen in the p5.js preload() function
    // This is just for logging purposes
});

// =================================================================
// ERROR HANDLING
// =================================================================

/**
 * Global error handler for unhandled errors
 */
window.addEventListener('error', function(e) {
    console.error('💥 Unhandled error:', e.error);
    console.error('   File:', e.filename);
    console.error('   Line:', e.lineno);
    console.error('   Column:', e.colno);
});

/**
 * Global handler for unhandled promise rejections
 */
window.addEventListener('unhandledrejection', function(e) {
    console.error('💥 Unhandled promise rejection:', e.reason);
    e.preventDefault(); // Prevent default browser error handling
});

// =================================================================
// PERFORMANCE MONITORING
// =================================================================

/**
 * Simple performance monitoring
 */
let frameCount = 0;
let lastFpsTime = Date.now();

/**
 * Log FPS periodically for performance monitoring
 */
function monitorPerformance() {
    frameCount++;
    const now = Date.now();
    
    if (now - lastFpsTime >= 5000) { // Every 5 seconds
        const fps = (frameCount * 1000) / (now - lastFpsTime);
        console.log(`🎮 Performance: ${fps.toFixed(1)} FPS`);
        frameCount = 0;
        lastFpsTime = now;
    }
}

// Add performance monitoring to the draw loop
const originalDraw = draw;
draw = function() {
    originalDraw();
    monitorPerformance();
};

// =================================================================
// DEVELOPMENT HELPERS
// =================================================================

/**
 * Debug information for development
 */
function printDebugInfo() {
    console.log('🔍 Debug Information:');
    console.log('   Selected Step:', selectedStep);
    console.log('   Selected Edges:', selectedEdges.size);
    console.log('   Hovered Node:', hoveredNode);
    console.log('   Hovered Edge:', hoveredEdge);
    console.log('   Zoom Level:', zoomLevel);
    console.log('   View Position:', {x: viewX, y: viewY});
    console.log('   Node Positions:', nodePositions.size);
    console.log('   Edge Offsets:', edgeOffsets.size);
}

// Make debug function available globally
window.printDebugInfo = printDebugInfo;
window.logProgress = logProgress;

console.log('📝 Script loaded successfully - ready for JSON data loading!');