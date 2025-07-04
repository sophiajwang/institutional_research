// =================================================================
// MULTI-CASE STUDY VISUALIZATION - COMPLETE INTEGRATION
// =================================================================

// =================================================================
// CASE STUDY CONFIGURATIONS
// =================================================================

/**
 * Configuration for each case study
 */
const CASE_STUDIES = {
    'bell-labs': {
        name: 'Bell Labs',
        title: 'Bell Labs Transistor Development',
        folder: 'bell_data',
        phases: {
            research: 'Research',
            development: 'Development', 
            impact: 'Impact'
        },
        phaseOrder: ['research', 'development', 'impact'],
        description: 'The invention of the transistor at Bell Labs (1945-1956)'
    },
    'bridgewater': {
        name: 'Bridgewater',
        title: 'Bridgewater 2008 Financial Crisis',
        folder: 'bridgewater_data',
        phases: {
            early_stage: 'Early Stage',
            bubble: 'Bubble',
            top: 'Top',
            depression: 'Depression'
        },
        phaseOrder: ['early_stage', 'bubble', 'top', 'depression'],
        description: 'Bridgewater\'s analysis of the 2008 financial crisis'
    },
    'bauhaus': {
        name: 'Bauhaus',
        title: 'Bauhaus Design Movement',
        folder: 'bauhaus_data',
        phases: {
            preliminary_course: 'Preliminary Course',
            weaving_workshop: 'Workshop: Weaving',
            wall_painting_workshop: 'Workshop: Wall Painting',
            store_room: 'Industrial Stores',
            exhibition_room: 'Exhibitions',
            studio_quarters: 'Living Quarters',
            bridge: 'Administration',
            auditorium: 'Auditorium',
            technical_school: 'Technical School'
        },
        phaseOrder: ['preliminary_course', 'weaving_workshop', 'store_room', 'exhibition_room', 'studio_quarters','bridge','auditorium','technical_school'],
        description: 'The Bauhaus school, seen through the Dessau campus'
    }
};

// =================================================================
// GLOBAL VARIABLES
// =================================================================

// Current case study
let currentCaseStudy = 'bell-labs'; // Default case study

// Data storage arrays
let nodes = [];
let edges = [];
let steps = [];
let documents = [];

// UI state variables
let selectedStep = null;
let selectedEdges = new Set();
let hoveredNode = null;
let hoveredEdge = null;
let tooltip;
let stepCounter;
let caseStudyDropdown;

// Loading state
let dataLoaded = false;
let setupComplete = false;

// 2D Camera controls
let viewX = 0, viewY = 0;
let targetViewX = 0, targetViewY = 0;
let zoomLevel = 1;
let targetZoom = 1;
let isDragging = false;
let isShiftPressed = false;
let lastMouseX = 0, lastMouseY = 0;

// Layout parameters
let nodeSpacing = 150;
let groupRadius = 300;

// Color scheme
let bgColor, bgColorDark, textColor, textColorDark;
let h1Color, h1ColorDark, h2Color, h2ColorDark, h3Color, h3ColorDark;
let darkMode = true;

// Data structures
let nodePositions = new Map();
let edgeOffsets = new Map();

// =================================================================
// CASE STUDY MANAGEMENT
// =================================================================

/**
 * Get the current case study configuration
 */
function getCurrentCaseStudy() {
    return CASE_STUDIES[currentCaseStudy];
}

/**
 * Switch to a different case study
 */
async function switchCaseStudy(caseStudyId) {
    if (!CASE_STUDIES[caseStudyId]) {
        console.error(`❌ Unknown case study: ${caseStudyId}`);
        return;
    }
    
    console.log(`🔄 Switching to case study: ${CASE_STUDIES[caseStudyId].name}`);
    
    // Update current case study
    currentCaseStudy = caseStudyId;
    
    // Clear current selection
    selectedStep = null;
    selectedEdges.clear();
    hoveredNode = null;
    hoveredEdge = null;
    
    // Reset camera
    viewX = 0;
    viewY = 0;
    targetViewX = 0;
    targetViewY = 0;
    zoomLevel = 1;
    targetZoom = 1;
    
    // Show loading message
    showLoadingMessage(`Loading ${CASE_STUDIES[caseStudyId].name}...`);
    
    // Load new data
    try {
        const success = await loadDataFromFiles();
        
        if (success && nodes.length > 0) {
            // Update page title
            document.title = CASE_STUDIES[caseStudyId].title;
            
            // Reinitialize visualization - this will set dataLoaded = true
            initializeVisualizationAfterDataLoad();
            
            console.log(`✅ Successfully switched to ${CASE_STUDIES[caseStudyId].name}`);
        } else {
            console.error(`❌ Failed to load data for ${CASE_STUDIES[caseStudyId].name}`);
            showErrorMessage(`Failed to load ${CASE_STUDIES[caseStudyId].name}`);
        }
    } catch (error) {
        console.error(`❌ Error switching case study:`, error);
        showErrorMessage(`Failed to load ${CASE_STUDIES[caseStudyId].name}`);
    }
}

/**
 * Create the case study dropdown menu
 */
function createCaseStudyDropdown() {
    console.log('🎛️ Creating case study dropdown...');
    
    // Create dropdown container
    const dropdownContainer = createDiv('');
    dropdownContainer.id('case-study-dropdown-container');
    dropdownContainer.style('position', 'absolute');
    dropdownContainer.style('top', '10px');
    dropdownContainer.style('left', '10px');
    dropdownContainer.style('z-index', '1000');
    dropdownContainer.style('background', 'rgba(20, 20, 20, 0.95)');
    dropdownContainer.style('padding', '10px');
    dropdownContainer.style('border-radius', '6px');
    dropdownContainer.style('border', '1px solid #5DC0D9');
    dropdownContainer.style('font-family', 'Helvetica, sans-serif');
    dropdownContainer.style('min-width', '200px');
    
    // Create label
    const label = createDiv('Case Study:');
    label.style('color', '#5DC0D9');
    label.style('font-size', '12px');
    label.style('font-weight', 'bold');
    label.style('margin-bottom', '5px');
    label.parent(dropdownContainer);
    
    // Create dropdown select
    caseStudyDropdown = createSelect();
    caseStudyDropdown.style('width', '100%');
    caseStudyDropdown.style('padding', '5px');
    caseStudyDropdown.style('background', '#2A2A2A');
    caseStudyDropdown.style('color', '#F2F2F2');
    caseStudyDropdown.style('border', '1px solid #5DC0D9');
    caseStudyDropdown.style('border-radius', '4px');
    caseStudyDropdown.style('font-family', 'Helvetica, sans-serif');
    caseStudyDropdown.style('font-size', '14px');
    caseStudyDropdown.parent(dropdownContainer);
    
    // Add options
    Object.entries(CASE_STUDIES).forEach(([id, config]) => {
        caseStudyDropdown.option(config.name, id);
    });
    
    // Set current selection
    caseStudyDropdown.selected(currentCaseStudy);
    
    // Add change event listener
    caseStudyDropdown.changed(() => {
        const selectedId = caseStudyDropdown.value();
        if (selectedId !== currentCaseStudy) {
            switchCaseStudy(selectedId);
        }
    });
    
    // Add description
    const description = createDiv(CASE_STUDIES[currentCaseStudy].description);
    description.style('color', '#BBBBBB');
    description.style('font-size', '11px');
    description.style('margin-top', '5px');
    description.style('line-height', '1.3');
    description.parent(dropdownContainer);
    
    console.log('✅ Case study dropdown created');
}

/**
 * Update the dropdown description when case study changes
 */
function updateDropdownDescription() {
    const container = select('#case-study-dropdown-container');
    if (container) {
        const description = container.elt.querySelector('div:last-child');
        if (description) {
            description.textContent = CASE_STUDIES[currentCaseStudy].description;
        }
    }
}

// =================================================================
// JSON FILE LOADING
// =================================================================

/**
 * Load JSON files for the current case study
 */
async function loadAllJsonFiles() {
    console.log(`🔧 Loading JSON files for ${CASE_STUDIES[currentCaseStudy].name}...`);
    
    const config = CASE_STUDIES[currentCaseStudy];
    const folder = config.folder;
    
    const files = [
        `${folder}/nodes.json`,
        `${folder}/edges.json`,
        `${folder}/steps.json`,
        `${folder}/documents.json`
    ];
    const dataKeys = ['nodes', 'edges', 'steps', 'documents'];
    
    console.log(`📁 Loading from folder: ${folder}`);
    
    try {
        const promises = files.map(file => loadJsonFile(file));
        const results = await Promise.all(promises);
        
        const data = {};
        dataKeys.forEach((key, index) => {
            data[key] = results[index];
        });
        
        console.log(`✅ ${config.name} data loaded successfully:`);
        console.log(`   📊 Nodes: ${data.nodes.length}`);
        console.log(`   🔗 Edges: ${data.edges.length}`);
        console.log(`   📅 Steps: ${data.steps.length}`);
        console.log(`   📄 Documents: ${data.documents.length}`);
        
        return data;
    } catch (error) {
        console.error(`❌ Error loading ${config.name} data:`, error);
        return {
            nodes: [],
            edges: [],
            steps: [],
            documents: []
        };
    }
}

/**
 * Load a single JSON file
 */
async function loadJsonFile(filename) {
    try {
        console.log(`📁 Loading ${filename}...`);
        const response = await fetch(filename);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`✅ Successfully loaded ${filename}`);
        
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(`❌ Error loading ${filename}:`, error);
        return [];
    }
}

/**
 * Enhanced data loading with better error handling
 */
async function loadDataFromFiles() {
    console.log('🚀 Starting enhanced data loading process...');
    
    try {
        const data = await loadAllJsonFiles();
        
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data structure returned');
        }
        
        // Ensure arrays
        nodes = Array.isArray(data.nodes) ? data.nodes : [];
        edges = Array.isArray(data.edges) ? data.edges : [];
        steps = Array.isArray(data.steps) ? data.steps : [];
        documents = Array.isArray(data.documents) ? data.documents : [];
        
        console.log('📊 Data loaded:');
        console.log(`   Nodes: ${nodes.length} items`);
        console.log(`   Edges: ${edges.length} items`);
        console.log(`   Steps: ${steps.length} items`);
        console.log(`   Documents: ${documents.length} items`);
        
        validateLoadedData();
        
        console.log('🎉 Data loading complete!');
        // NOTE: Don't set dataLoaded = true here, let initializeVisualizationAfterDataLoad do it
        return true;
    } catch (error) {
        console.error('💥 Critical error during data loading:', error);
        loadFallbackData();
        return false;
    }
}

// =================================================================
// PHASE MANAGEMENT
// =================================================================

/**
 * Get phase configuration for current case study
 */
function getPhaseConfig() {
    return CASE_STUDIES[currentCaseStudy].phases;
}

/**
 * Get phase display name
 */
function getPhaseDisplayName(phaseKey) {
    const phases = getPhaseConfig();
    return phases[phaseKey] || phaseKey || 'Unknown';
}

/**
 * Get ordered phases for current case study
 */
function getPhaseOrder() {
    return CASE_STUDIES[currentCaseStudy].phaseOrder;
}

/**
 * Group steps by phase using current case study configuration
 */
function groupStepsByPhase() {
    const phaseOrder = getPhaseOrder();
    const phaseGroups = {};
    
    // Initialize all phases
    phaseOrder.forEach(phase => {
        phaseGroups[phase] = [];
    });
    
    // Add steps with null/undefined phase to 'other' category
    phaseGroups.other = [];
    
    // Group steps by phase
    steps.forEach(step => {
        const phase = step.phase;
        if (phase && phaseGroups[phase]) {
            phaseGroups[phase].push(step);
        } else {
            phaseGroups.other.push(step);
        }
    });
    
    // Remove empty 'other' category
    if (phaseGroups.other.length === 0) {
        delete phaseGroups.other;
    }
    
    return phaseGroups;
}

// =================================================================
// INITIALIZATION AND SETUP
// =================================================================

function preload() {
    console.log('🔄 Starting data loading...');
    
    loadDataFromFiles().then((success) => {
        console.log('✅ Data loading completed');
        
        if (setupComplete) {
            initializeVisualizationAfterDataLoad();
        }
    }).catch((error) => {
        console.error('❌ Data loading failed:', error);
        
        if (setupComplete) {
            // Load fallback and initialize
            loadFallbackData();
            initializeVisualizationAfterDataLoad();
        }
    });
}

function setup() {
    console.log('🎨 Setup function started');
    
    // Create canvas
    let canvas = createCanvas(windowWidth - 350, windowHeight);
    canvas.parent('canvas-container');
    
    // Get references to HTML elements
    tooltip = select('#tooltip');
    stepCounter = select('#step-counter');
    
    // Initialize colors
    initColors();
    
    // Create case study dropdown
    createCaseStudyDropdown();
    
    setupComplete = true;
    
    // Check if data is already loaded
    if (dataLoaded) {
        initializeVisualizationAfterDataLoad();
    } else {
        console.log('⏳ Waiting for data to load...');
    }
}

function initializeVisualizationAfterDataLoad() {
    console.log('🚀 Initializing visualization after data load...');
    
    // Check if we have valid data
    if (!Array.isArray(nodes) || nodes.length === 0) {
        console.error('❌ No nodes data, using fallback');
        loadFallbackData();
    }
    
    // Update dropdown description
    updateDropdownDescription();
    
    // Initialize visualization components
    try {
        initializeVisualization();
        createStepList();
        createLegend();
        calculateEdgeOffsets();
        
        // IMPORTANT: Set dataLoaded to true only after everything is ready
        dataLoaded = true;
        
        console.log('✅ Visualization ready!');
        hideLoadingMessage();
    } catch (error) {
        console.error('❌ Error during initialization:', error);
        showErrorMessage('Failed to initialize visualization. Check console for details.');
    }
}

/**
 * Initialize colors
 */
function initColors() {
    bgColor = color(20, 20, 20);
    bgColorDark = color(10, 10, 10);
    textColor = color(242, 242, 242);
    textColorDark = color(200, 200, 200);
    h1Color = color(93, 192, 217);
    h1ColorDark = color(73, 160, 185);
    h2Color = color(120, 180, 120);
    h2ColorDark = color(100, 150, 100);
    h3Color = color(150, 150, 150);
    h3ColorDark = color(120, 120, 120);
}

/**
 * Initialize the visualization
 */
function initializeVisualization() {
    generateNodePositions();
    console.log('✅ Visualization initialized with', nodes.length, 'nodes and', edges.length, 'edges');
    
    // Additional debug info
    console.log('📊 Data summary:');
    console.log('   Steps by phase:', steps.reduce((acc, step) => {
        acc[step.phase || 'null'] = (acc[step.phase || 'null'] || 0) + 1;
        return acc;
    }, {}));
    console.log('   Edges with violations:', edges.filter(e => e.violated === 1).length);
    console.log('   Edges unused:', edges.filter(e => e.unused === 1).length);
}

/**
 * Validate loaded data
 */
function validateLoadedData() {
    console.log('🔍 Validating loaded data...');
    
    const issues = [];
    
    // Check for missing nodes referenced in edges
    const referencedNodeIds = new Set();
    edges.forEach(edge => {
        edge.from_nodes.forEach(id => referencedNodeIds.add(id));
        edge.to_nodes.forEach(id => referencedNodeIds.add(id));
    });
    
    const actualNodeIds = new Set(nodes.map(n => n.node_id));
    const missingNodes = [...referencedNodeIds].filter(id => !actualNodeIds.has(id));
    
    if (missingNodes.length > 0) {
        console.warn('⚠️ Missing nodes referenced in edges:', missingNodes);
    }
    
    // Check for missing steps referenced in edges
    const referencedStepIds = new Set(edges.map(e => e.step_id));
    const actualStepIds = new Set(steps.map(s => s.step_id));
    const missingSteps = [...referencedStepIds].filter(id => !actualStepIds.has(id));
    
    if (missingSteps.length > 0) {
        console.warn('⚠️ Missing steps referenced in edges:', missingSteps);
    }
    
    // Summary
    console.log('   Node coverage:', actualNodeIds.size, 'nodes defined,', referencedNodeIds.size, 'referenced');
    console.log('   Step coverage:', actualStepIds.size, 'steps defined,', referencedStepIds.size, 'referenced');
    
    if (missingNodes.length === 0 && missingSteps.length === 0) {
        console.log('✅ Data validation passed!');
    }
}

/**
 * Load fallback data if JSON loading fails
 */
function loadFallbackData() {
    console.log('🔄 Loading fallback data...');
    
    // Use Bell Labs data as fallback
    nodes = [
        {"node_id": 0, "node_name": "Mervin Kelly", "node_description": "Executive Vice President", "node_parent_id": 1, "node_grandparent_id": 2},
        {"node_id": 1, "node_name": "Bell Labs Administration", "node_description": "Executive", "node_parent_id": 2, "node_grandparent_id": null},
        {"node_id": 2, "node_name": "Bell Labs", "node_description": "AT&T research arm", "node_parent_id": null, "node_grandparent_id": null},
        {"node_id": 3, "node_name": "AT&T", "node_description": "Management and Holding Company of the Bell System", "node_parent_id": null, "node_grandparent_id": null}
    ];

    edges = [
        {"interaction_id": 0, "from_nodes": [2], "to_nodes": [3], "interaction_description": "Initial cost of $417,000 (mostly salaries) billed to AT&T.", "step_id": 0, "bidirectional": 0, "unused": 0, "violated": 0}
    ];

    steps = [
        {"step_id": 0, "step_description": "Mervin Kelly signed off on Case 38,139: unified approach to all of our solid state problems.", "date": "06.21.1945", "phase": "research"}
    ];

    documents = [];
    
    console.log('⚠️ Using fallback data due to loading failure');
}

// =================================================================
// NODE POSITIONING
// =================================================================

/**
 * Generate 2D positions for all nodes
 */
function generateNodePositions() {
    console.log('📐 Generating 2D node positions...');
    
    // Clear existing positions
    nodePositions.clear();
    
    // Validate nodes array
    if (!Array.isArray(nodes)) {
        console.error('❌ Cannot generate positions: nodes is not an array. Type:', typeof nodes);
        return;
    }
    
    if (nodes.length === 0) {
        console.error('❌ Cannot generate positions: nodes array is empty');
        return;
    }
    
    console.log(`✅ Valid nodes array with ${nodes.length} items`);
    
    // Organize nodes by hierarchy
    const rootNodes = nodes.filter(n => !n.node_parent_id);
    const parentNodes = nodes.filter(n => n.node_parent_id && !n.node_grandparent_id);
    const childNodes = nodes.filter(n => n.node_grandparent_id);
    
    console.log(`   Root nodes: ${rootNodes.length}, Parent nodes: ${parentNodes.length}, Child nodes: ${childNodes.length}`);
    
    // Position root nodes in center
    rootNodes.forEach((node, i) => {
        const angle = (i / rootNodes.length) * TWO_PI;
        nodePositions.set(node.node_id, {
            x: cos(angle) * groupRadius,
            y: sin(angle) * groupRadius
        });
    });
    
    // Position parent nodes in outer ring
    parentNodes.forEach((node, i) => {
        const angle = (i / parentNodes.length) * TWO_PI + PI/4;
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
 * Calculate edge offsets for multiple edges between same nodes
 */
function calculateEdgeOffsets() {
    console.log('📏 Calculating edge offsets...');
    
    edgeOffsets.clear();
    
    const edgeGroups = new Map();
    
    edges.forEach(edge => {
        edge.from_nodes.forEach(fromId => {
            edge.to_nodes.forEach(toId => {
                if (fromId === toId) return;
                
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
    
    edgeGroups.forEach((edgeList, key) => {
        if (edgeList.length > 1) {
            edgeList.forEach((edgeInfo, index) => {
                const offset = (index - (edgeList.length - 1) / 2) * 30;
                const edgeKey = `${edgeInfo.edge.interaction_id}-${edgeInfo.fromId}-${edgeInfo.toId}`;
                edgeOffsets.set(edgeKey, offset);
            });
        }
    });
    
    console.log(`✅ Calculated offsets for ${edgeOffsets.size} edge pairs`);
}

// =================================================================
// UI CREATION
// =================================================================

/**
 * Create the legend
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
    
    let edgeTypes = createDiv(`
        <div style="margin: 4px 0;"><span style="color: #78B478;">━━━</span> Active Edge</div>
        <div style="margin: 4px 0;"><span style="color: #999999;">━━━</span> Inactive Edge</div>
        <div style="margin: 4px 0;"><span style="color: #FF6464;">┅┅┅</span> Violated Edge</div>
        <div style="margin: 4px 0;"><span style="color: #666666;">━━━</span> Unused Edge</div>
        <div style="margin: 4px 0;"><span style="color: #78B478;">⭕</span> Self-Loop</div>
    `);
    edgeTypes.parent(legend);
    
    let nodeTypes = createDiv(`
        <div style="margin: 6px 0 4px 0; font-weight: bold;">Nodes:</div>
        <div style="margin: 2px 0;"><span style="color: #5DC0D9;">■</span> Individual/Child</div>
        <div style="margin: 2px 0;"><span style="color: #78B478;">■</span> Group/Parent</div>
        <div style="margin: 2px 0;"><span style="color: #999999;">■</span> Organization/Root</div>
        <div style="margin: 2px 0;"><span style="color: #FFA500;">■</span> Related Children</div>
    `);
    nodeTypes.parent(legend);
}

/**
 * Create the step list with dynamic phase headers
 */
function createStepList() {
    console.log('📋 Creating step list with dynamic phases...');
    
    const stepList = select('#step-list');
    
    // Clear existing content
    stepList.html('');
    
    // Group steps by phase
    const phaseGroups = groupStepsByPhase();
    
    console.log('📊 Phase groups:', Object.keys(phaseGroups));
    
    // Create phase sections in the correct order
    const phaseOrder = getPhaseOrder();
    
    phaseOrder.forEach((phase, phaseIndex) => {
        const phaseSteps = phaseGroups[phase];
        if (!phaseSteps || phaseSteps.length === 0) return;
        
        // Create phase header with display name
        const displayName = getPhaseDisplayName(phase);
        const phaseHeader = createDiv(displayName);
        phaseHeader.class('phase-header');
        phaseHeader.style('color', '#5DC0D9');
        phaseHeader.style('font-weight', 'bold');
        phaseHeader.style('font-size', '14px');
        phaseHeader.style('margin', '20px 0 10px 0');
        phaseHeader.style('text-transform', 'uppercase');
        phaseHeader.style('letter-spacing', '1px');
        
        // First phase gets no top margin
        if (phaseIndex === 0) {
            phaseHeader.style('margin-top', '0');
        }
        
        phaseHeader.parent(stepList);
        
        // Create step items
        phaseSteps.forEach(step => {
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
                    edgeItem.style('position', 'relative');
                    edgeItem.style('display', 'flex');
                    edgeItem.style('align-items', 'center');
                    
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
                    
                    checkbox.elt.addEventListener('click', (e) => {
                        e.stopPropagation();
                    });
                    checkbox.parent(edgeItem);
                    
                    const fromNames = edge.from_nodes.map(id => {
                        const node = nodes.find(n => n.node_id === id);
                        return node ? node.node_name : id;
                    }).join(', ');
                    
                    const toNames = edge.to_nodes.map(id => {
                        const node = nodes.find(n => n.node_id === id);
                        return node ? node.node_name : id;
                    }).join(', ');
                    
                    const isSelfLoop = edge.from_nodes.some(fromId => 
                        edge.to_nodes.includes(fromId)
                    );
                    
                    const arrow = isSelfLoop ? '↻' : (edge.bidirectional ? '↔' : '→');
                    const display = isSelfLoop ? fromNames + ' ' + arrow : `${fromNames} ${arrow} ${toNames}`;
                    
                    const textSpan = createSpan(display);
                    textSpan.style('vertical-align', 'middle');
                    textSpan.parent(edgeItem);
                    
                    edgeItem.mouseOver(() => {
                        edgeItem.style('background', '#444');
                        hoveredEdge = edge.interaction_id;
                    });
                    
                    edgeItem.mouseOut(() => {
                        edgeItem.style('background', 'transparent');
                        if (hoveredEdge === edge.interaction_id) hoveredEdge = null;
                    });
                    
                    edgeItem.elt.addEventListener('click', (e) => {
                        e.stopPropagation();
                    });
                    
                    edgeItem.parent(edgesList);
                });
                
                edgesList.parent(stepDiv);
                
                const expandBtn = createDiv('▶ ' + relatedEdges.length + ' edges');
                expandBtn.class('expand-btn');
                expandBtn.style('font-size', '10px');
                expandBtn.style('color', '#5DC0D9');
                expandBtn.style('cursor', 'pointer');
                expandBtn.style('margin-top', '5px');
                
                let isExpanded = false;
                expandBtn.mousePressed((e) => {
                    e.stopPropagation();
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
    });
    
    // Handle 'other' phase if it exists
    if (phaseGroups.other && phaseGroups.other.length > 0) {
        const phaseHeader = createDiv('Other');
        phaseHeader.class('phase-header');
        phaseHeader.style('color', '#5DC0D9');
        phaseHeader.style('font-weight', 'bold');
        phaseHeader.style('font-size', '14px');
        phaseHeader.style('margin', '20px 0 10px 0');
        phaseHeader.style('text-transform', 'uppercase');
        phaseHeader.style('letter-spacing', '1px');
        phaseHeader.parent(stepList);
        
        phaseGroups.other.forEach(step => {
            const stepDiv = createDiv();
            stepDiv.class('step-item');
            stepDiv.addClass('other');
            
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
    
    console.log('✅ Step list created with dynamic phases');
}

// =================================================================
// MAIN DRAW LOOP
// =================================================================

/**
 * Main draw loop
 */
function draw() {
    background(darkMode ? bgColorDark : bgColor);
    
    // Check if we're in a loading state or have no data
    if (!dataLoaded || !Array.isArray(nodes) || nodes.length === 0 || !Array.isArray(edges)) {
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(16);
        text('Loading data...', width/2, height/2);
        return;
    }
    
    // Check if node positions have been calculated
    if (nodePositions.size === 0) {
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(16);
        text('Preparing visualization...', width/2, height/2);
        return;
    }
    
    // Smooth camera interpolation
    viewX = lerp(viewX, targetViewX, 0.05);
    viewY = lerp(viewY, targetViewY, 0.05);
    zoomLevel = lerp(zoomLevel, targetZoom, 0.05);
    
    // Apply 2D transformations
    push();
    translate(width/2, height/2);
    scale(zoomLevel);
    translate(viewX, viewY);
    
    // Draw all edges first
    drawAllEdges();
    
    // Draw all nodes
    drawNodes();
    
    pop();
    
    // Handle mouse interaction
    handleMouseInteraction();
}

/**
 * Draw all nodes
 */
function drawNodes() {
    nodes.forEach(node => {
        const pos = nodePositions.get(node.node_id);
        if (!pos) return;
        
        let nodeColor = color(textColor);
        let alpha = 255;
        let isRelevantNode = false;
        let isHighlightedChild = false;
        
        if (selectedStep !== null) {
            const relevantEdges = edges.filter(e => 
                e.step_id === selectedStep && 
                (e.from_nodes.includes(node.node_id) || e.to_nodes.includes(node.node_id))
            );
            
            isRelevantNode = relevantEdges.length > 0;
            
            const stepEdges = edges.filter(e => e.step_id === selectedStep);
            stepEdges.forEach(edge => {
                edge.from_nodes.concat(edge.to_nodes).forEach(nodeId => {
                    const targetNode = nodes.find(n => n.node_id === nodeId);
                    if (targetNode) {
                        if (targetNode.node_parent_id && !targetNode.node_grandparent_id) {
                            if (node.node_parent_id === targetNode.node_id) {
                                isHighlightedChild = true;
                            }
                        } else if (!targetNode.node_parent_id) {
                            if (node.node_parent_id === targetNode.node_id || node.node_grandparent_id === targetNode.node_id) {
                                isHighlightedChild = true;
                            }
                        }
                    }
                });
            });
            
            if (isRelevantNode) {
                nodeColor = h1Color;
                alpha = 255;
            } else if (isHighlightedChild) {
                nodeColor = color(255, 165, 0);
                alpha = 200;
            } else {
                alpha = 80;
                nodeColor = h3Color;
            }
        } else {
            isRelevantNode = true;
            if (node.node_grandparent_id) {
                nodeColor = h1Color;
            } else if (node.node_parent_id) {
                nodeColor = h2Color;
            } else {
                nodeColor = h3Color;
            }
        }
        
        if (hoveredNode === node.node_id) {
            if (selectedStep === null || isRelevantNode) {
                nodeColor = color(255, 200, 100);
                alpha = 255;
            }
        }
        
        fill(red(nodeColor), green(nodeColor), blue(nodeColor), alpha);
        stroke(255, alpha * 0.5);
        strokeWeight(1);
        
        rectMode(CENTER);
        rect(pos.x, pos.y, 12, 12);
        
        fill(red(textColor), green(textColor), blue(textColor), alpha);
        textAlign(CENTER, CENTER);
        textSize(10);
        text(node.node_name, pos.x, pos.y - 20);
    });
}

/**
 * Draw all edges
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
 * Draw a single edge
 */
function drawSingleEdge(edge, fromId, toId) {
    const fromPos = nodePositions.get(fromId);
    const toPos = nodePositions.get(toId);
    
    if (!fromPos || !toPos) return;
    
    if (fromId === toId) {
        drawCircularEdge(edge, fromPos);
        return;
    }
    
    const edgeKey = `${edge.interaction_id}-${fromId}-${toId}`;
    const offset = edgeOffsets.get(edgeKey) || 0;
    
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
    
    if (isActiveEdge && shouldShow) {
        if (edge.violated === 1) {
            edgeColor = color(255, 100, 100);
            strokeW = 2;
            alpha = Math.max(alpha, 180);
        } else if (edge.unused === 1) {
            alpha = Math.min(alpha, 80);
        }
    }
    
    if (hoveredEdge === edge.interaction_id && (selectedStep === null || shouldShow)) {
        edgeColor = color(255, 255, 100);
        strokeW = 3;
        alpha = 255;
    }
    
    if (alpha <= 0) return;
    
    stroke(red(edgeColor), green(edgeColor), blue(edgeColor), alpha);
    strokeWeight(strokeW);
    
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
 * Draw a curved edge
 */
function drawCurvedEdge(fromPos, toPos, offset, isBroken) {
    const midX = (fromPos.x + toPos.x) / 2;
    const midY = (fromPos.y + toPos.y) / 2;
    
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const len = sqrt(dx*dx + dy*dy);
    
    if (len === 0) return;
    
    const perpX = -dy / len * offset;
    const perpY = dx / len * offset;
    
    const controlX = midX + perpX;
    const controlY = midY + perpY;
    
    if (isBroken) {
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
        noFill();
        bezier(fromPos.x, fromPos.y, controlX, controlY, controlX, controlY, toPos.x, toPos.y);
    }
}

/**
 * Draw a circular edge (self-loop)
 */
function drawCircularEdge(edge, nodePos) {
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
    
    if (isActiveEdge && shouldShow) {
        if (edge.violated === 1) {
            edgeColor = color(255, 100, 100);
            strokeW = 2;
            alpha = Math.max(alpha, 180);
        } else if (edge.unused === 1) {
            alpha = Math.min(alpha, 80);
        }
    }
    
    if (hoveredEdge === edge.interaction_id && (selectedStep === null || shouldShow)) {
        edgeColor = color(255, 255, 100);
        strokeW = 3;
        alpha = 255;
    }
    
    if (alpha <= 0) return;
    
    stroke(red(edgeColor), green(edgeColor), blue(edgeColor), alpha);
    strokeWeight(strokeW);
    noFill();
    
    const radius = 25;
    const nodeRadius = 6;
    
    const startAngle = -PI/4;
    const startX = nodePos.x + cos(startAngle) * nodeRadius;
    const startY = nodePos.y + sin(startAngle) * nodeRadius;
    
    if (edge.violated === 1 && isActiveEdge) {
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
        const controlRadius = radius * 1.2;
        bezier(
            startX, startY,
            nodePos.x + controlRadius, nodePos.y - controlRadius,
            nodePos.x + controlRadius, nodePos.y + controlRadius,
            startX, startY
        );
        
        const arrowSize = 3;
        const endAngle = startAngle + PI/6;
        const arrowX = startX + cos(endAngle) * arrowSize;
        const arrowY = startY + sin(endAngle) * arrowSize;
        
        line(startX, startY, arrowX, arrowY);
        line(startX, startY, startX + cos(endAngle - PI/2) * arrowSize, startY + sin(endAngle - PI/2) * arrowSize);
    }
}

/**
 * Draw a broken line
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
// INTERACTION HANDLING
// =================================================================

/**
 * Handle mouse interaction
 */
function handleMouseInteraction() {
    let worldMouseX = (mouseX - width/2) / zoomLevel - viewX;
    let worldMouseY = (mouseY - height/2) / zoomLevel - viewY;
    
    let newHoveredNode = null;
    let newHoveredEdge = null;
    
    if (mouseX < width - 350) {
        nodes.forEach(node => {
            const pos = nodePositions.get(node.node_id);
            if (pos && dist(worldMouseX, worldMouseY, pos.x, pos.y) < 20) {
                if (selectedStep === null) {
                    newHoveredNode = node.node_id;
                } else {
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
                                if (fromId === toId) {
                                    const distToCenter = dist(worldMouseX, worldMouseY, fromPos.x, fromPos.y);
                                    if (distToCenter > 15 && distToCenter < 35) {
                                        newHoveredEdge = edge.interaction_id;
                                    }
                                } else {
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
    
    hoveredNode = newHoveredNode;
    hoveredEdge = newHoveredEdge;
    
    updateTooltip();
}

/**
 * Calculate distance to curve
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
 * Calculate distance to line segment
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
 * Select a step
 */
function selectStep(stepId) {
    selectedStep = selectedStep === stepId ? null : stepId;
    selectedEdges.clear();
    
    selectAll('.step-item').forEach(item => item.removeClass('active'));
    if (selectedStep !== null) {
        selectAll('.step-item').forEach((item, index) => {
            if (steps[index] && steps[index].step_id === selectedStep) {
                item.addClass('active');
            }
        });
        
        updateStepCounter();
        panToStepElements(selectedStep);
        
        selectAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked(false);
        });
    } else {
        stepCounter.html('Step: None Selected');
    }
}

/**
 * Update step counter
 */
function updateStepCounter() {
    if (selectedStep !== null) {
        const step = steps.find(s => s.step_id === selectedStep);
        if (step) {
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
 * Pan to step elements
 */
function panToStepElements(stepId) {
    const stepEdges = edges.filter(e => e.step_id === stepId);
    const involvedNodeIds = new Set();
    
    stepEdges.forEach(edge => {
        edge.from_nodes.forEach(id => involvedNodeIds.add(id));
        edge.to_nodes.forEach(id => involvedNodeIds.add(id));
    });
    
    if (involvedNodeIds.size === 0) return;
    
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
        
        targetViewX = -centerX;
        targetViewY = -centerY;
        
        targetZoom = constrain(targetZoom * 1.1, 0.8, 2.0);
    }
}

/**
 * Update tooltip
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
 * Key press events
 */
function keyPressed() {
    if (keyCode === SHIFT) {
        isShiftPressed = true;
    }
    
    if (key === '=' || key === '+') {
        targetZoom = constrain(targetZoom * 1.1, 0.2, 3.0);
    } else if (key === '-') {
        targetZoom = constrain(targetZoom * 0.9, 0.2, 3.0);
    }
}

/**
 * Key release events
 */
function keyReleased() {
    if (keyCode === SHIFT) {
        isShiftPressed = false;
    }
}

/**
 * Mouse press events
 */
function mousePressed() {
    if (mouseX < width - 350) {
        if (selectedStep === null && hoveredEdge !== null) {
            const edge = edges.find(e => e.interaction_id === hoveredEdge);
            if (edge) {
                selectStep(edge.step_id);
                return;
            }
        }
        
        isDragging = true;
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }
}

/**
 * Mouse drag events
 */
function mouseDragged() {
    if (isDragging && mouseX < width - 350) {
        const deltaX = mouseX - lastMouseX;
        const deltaY = mouseY - lastMouseY;
        
        if (isShiftPressed) {
            const sensitivity = 0.005;
            targetViewX += deltaX * sensitivity * 100;
            targetViewY += deltaY * sensitivity * 100;
        } else {
            const sensitivity = 1.0 / zoomLevel;
            targetViewX += deltaX * sensitivity;
            targetViewY += deltaY * sensitivity;
        }
        
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }
}

/**
 * Mouse release events
 */
function mouseReleased() {
    isDragging = false;
}

/**
 * Window resize events
 */
function windowResized() {
    resizeCanvas(windowWidth - 350, windowHeight);
}

// =================================================================
// UTILITY FUNCTIONS
// =================================================================

/**
 * Show loading message
 */
function showLoadingMessage(message = 'Loading data...') {
    hideLoadingMessage();
    
    const loadingDiv = createDiv(message);
    loadingDiv.id('loading-message');
    loadingDiv.style('position', 'fixed');
    loadingDiv.style('top', '50%');
    loadingDiv.style('left', '50%');
    loadingDiv.style('transform', 'translate(-50%, -50%)');
    loadingDiv.style('background', 'rgba(0, 0, 0, 0.9)');
    loadingDiv.style('color', '#5DC0D9');
    loadingDiv.style('padding', '20px 30px');
    loadingDiv.style('border-radius', '8px');
    loadingDiv.style('font-family', 'Helvetica, sans-serif');
    loadingDiv.style('font-size', '16px');
    loadingDiv.style('z-index', '9999');
    loadingDiv.style('border', '2px solid #5DC0D9');
    loadingDiv.style('text-align', 'center');
}

/**
 * Hide loading message
 */
function hideLoadingMessage() {
    const loadingDiv = select('#loading-message');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    const errorDiv = createDiv(message);
    errorDiv.id('error-message');
    errorDiv.style('position', 'fixed');
    errorDiv.style('top', '50%');
    errorDiv.style('left', '50%');
    errorDiv.style('transform', 'translate(-50%, -50%)');
    errorDiv.style('background', 'rgba(255, 0, 0, 0.9)');
    errorDiv.style('color', 'white');
    errorDiv.style('padding', '20px');
    errorDiv.style('border-radius', '8px');
    errorDiv.style('font-family', 'Helvetica, sans-serif');
    errorDiv.style('font-size', '16px');
    errorDiv.style('z-index', '9999');
    errorDiv.style('max-width', '400px');
    errorDiv.style('text-align', 'center');
}

/**
 * Constrain a value between min and max
 */
function constrain(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 */
function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Calculate distance between two points
 */
function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Calculate square root
 */
function sqrt(value) {
    return Math.sqrt(value);
}

/**
 * Calculate cosine
 */
function cos(angle) {
    return Math.cos(angle);
}

/**
 * Calculate sine
 */
function sin(angle) {
    return Math.sin(angle);
}

/**
 * Calculate a point on a Bezier curve
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
// GLOBAL FUNCTIONS
// =================================================================

// Make functions globally available
window.switchCaseStudy = switchCaseStudy;
window.selectStep = selectStep;

// =================================================================
// DEBUG FUNCTIONS
// =================================================================

/**
 * Debug function to check data loading status
 */
function debugDataStatus() {
    console.log('🔍 DEBUG: Data loading status');
    console.log('   Current case study:', currentCaseStudy);
    console.log('   dataLoaded:', dataLoaded);
    console.log('   setupComplete:', setupComplete);
    console.log('   nodes type:', typeof nodes);
    console.log('   nodes length:', Array.isArray(nodes) ? nodes.length : 'N/A');
    console.log('   edges type:', typeof edges);
    console.log('   edges length:', Array.isArray(edges) ? edges.length : 'N/A');
    console.log('   steps type:', typeof steps);
    console.log('   steps length:', Array.isArray(steps) ? steps.length : 'N/A');
    console.log('   documents type:', typeof documents);
    console.log('   documents length:', Array.isArray(documents) ? documents.length : 'N/A');
    console.log('   Available case studies:', Object.keys(CASE_STUDIES));
    console.log('   Current phases:', getPhaseConfig());
}

/**
 * Debug function to test case study switching
 */
function debugSwitchCaseStudy() {
    console.log('🔧 Testing case study switching...');
    Object.keys(CASE_STUDIES).forEach(id => {
        console.log(`   Available: ${id} - ${CASE_STUDIES[id].name}`);
    });
    console.log('   Use switchCaseStudy("case-study-id") to switch');
}

/**
 * Debug function to show current phase configuration
 */
function debugPhases() {
    console.log('📊 Current phase configuration:');
    console.log('   Case study:', currentCaseStudy);
    console.log('   Phases:', getPhaseConfig());
    console.log('   Phase order:', getPhaseOrder());
    console.log('   Steps grouped by phase:', groupStepsByPhase());
}

// Make debug functions available globally
window.debugDataStatus = debugDataStatus;
window.debugSwitchCaseStudy = debugSwitchCaseStudy;
window.debugPhases = debugPhases;

// =================================================================
// INITIALIZATION MESSAGE
// =================================================================

console.log('🎛️ Multi-case study visualization loaded!');
console.log('📚 Available case studies:');
Object.entries(CASE_STUDIES).forEach(([id, config]) => {
    console.log(`   ${config.name}: ${config.description}`);
});
console.log('🔧 Debug functions available: debugDataStatus(), debugSwitchCaseStudy(), debugPhases()');
console.log('🚀 Use dropdown in top-left to switch between case studies');

// =================================================================
// ERROR HANDLING
// =================================================================

/**
 * Global error handler
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
    e.preventDefault();
});

// =================================================================
// PERFORMANCE MONITORING
// =================================================================

let frameCount = 0;
let lastFpsTime = Date.now();

/**
 * Monitor performance
 */
function monitorPerformance() {
    frameCount++;
    const now = Date.now();
    
    if (now - lastFpsTime >= 5000) {
        const fps = (frameCount * 1000) / (now - lastFpsTime);
        console.log(`🎮 Performance: ${fps.toFixed(1)} FPS`);
        frameCount = 0;
        lastFpsTime = now;
    }
}

// Add performance monitoring to draw loop
const originalDraw = draw;
draw = function() {
    originalDraw();
    monitorPerformance();
};