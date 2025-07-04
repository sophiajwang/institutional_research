
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
        description: 'The invention of the transistor'
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
        description: 'The economy as a machine: Bridgewater\'s template of the 2008 financial crisis'
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
        phaseOrder: ['preliminary_course', 'weaving_workshop', 'wall_painting_workshop','store_room', 'exhibition_room', 'studio_quarters','bridge','auditorium','technical_school'],
        description: 'The unifying \'art\' of architecture seen through the Bauhaus Dessau campus'
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
let stepCounterClicked = false;
let stepList;
let legend;
let canvas;
let controls;
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

// Layout Dimensions
const PANEL_WIDTH = 350;
const LEGEND_WIDTH = 100;
const LEGEND_PADDING = 15;
const MARGIN = 25;

// Color scheme
let bgColor, bgColorDark, textColor, textColorDark;
let h1Color, h1ColorDark, h2Color, h2ColorDark, h3Color, h3ColorDark;
let darkMode = true;

// Data structures
let nodePositions = new Map();
let edgeOffsets = new Map();


// Bauhaus specific
const ESCAPE = 27;
console.log('🎨 Bauhaus document view functionality loaded!');

// Touch/zoom state variables
let initialPinchDistance = 0;
let lastPinchZoom = 1;
let isPinching = false;
let initialTouches = [];
let lastTouchCenter = { x: 0, y: 0 };

/**
 * Enhanced setup function with trackpad and touch zoom support
 */
function setup() {
    console.log('🎨 Setup function started');
    
    // Create canvas
    canvas = createCanvas(windowWidth - PANEL_WIDTH, windowHeight);
    canvas.parent('canvas-container');
    
    // Get references to HTML elements
    tooltip = select('#tooltip');
    stepCounter = select('#step-counter');
    stepList = select('#step-list');
    controls = select('#controls');
    
    // Initialize colors
    initColors();
    
    // Create case study dropdown
    createCaseStudyDropdown();
    
    // Add trackpad and touch zoom support
    setupZoomControls();
    
    setupComplete = true;
    
    // Check if data is already loaded
    if (dataLoaded) {
        initializeVisualizationAfterDataLoad();
    } else {
        console.log('⏳ Waiting for data to load...');
    }
}

/**
 * Setup trackpad and touch zoom controls
 */
function setupZoomControls() {
    console.log('🔧 Setting up trackpad and touch zoom controls...');
    
    // Add trackpad pinch support (wheel event with ctrlKey for pinch)
    canvas.elt.addEventListener('wheel', handleTrackpadPinch, { passive: false });
    
    // Add touch event listeners for mobile/tablet pinch-to-zoom
    canvas.elt.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.elt.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.elt.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    console.log('✅ Trackpad and touch zoom controls setup complete');
}

/**
 * Handle trackpad pinch-to-zoom
 */
function handleTrackpadPinch(event) {
    // Only handle pinch gestures (ctrlKey indicates pinch on most trackpads)
    if (!event.ctrlKey) {
        return;
    }
    
    // Prevent default zoom behavior
    event.preventDefault();
    
    // Don't zoom if over UI elements
    if (isMouseOverUI()) {
        return;
    }
    
    // Get mouse position relative to canvas for zoom focus point
    const rect = canvas.elt.getBoundingClientRect();
    const focusX = event.clientX - rect.left;
    const focusY = event.clientY - rect.top;
    
    // Calculate zoom factor from wheel delta
    const zoomFactor = event.deltaY > 0 ? 0.95 : 1.05;
    
    // Apply zoom with focus point
    zoomAtPoint(focusX, focusY, zoomFactor);
}

/**
 * Handle touch start for pinch-to-zoom
 */
function handleTouchStart(event) {
    const touches = event.touches;
    
    if (touches.length === 2) {
        // Two-finger pinch detected
        event.preventDefault();
        isPinching = true;
        
        // Store initial touch positions
        initialTouches = [
            { x: touches[0].clientX, y: touches[0].clientY },
            { x: touches[1].clientX, y: touches[1].clientY }
        ];
        
        // Calculate initial distance between fingers
        initialPinchDistance = getTouchDistance(touches[0], touches[1]);
        lastPinchZoom = targetZoom;
        
        // Calculate initial center point for zoom focus
        const rect = canvas.elt.getBoundingClientRect();
        lastTouchCenter = {
            x: (touches[0].clientX + touches[1].clientX) / 2 - rect.left,
            y: (touches[0].clientY + touches[1].clientY) / 2 - rect.top
        };
    } else {
        // Single touch - reset pinch state
        isPinching = false;
    }
}

/**
 * Handle touch move for pinch-to-zoom
 */
function handleTouchMove(event) {
    const touches = event.touches;
    
    if (isPinching && touches.length === 2) {
        event.preventDefault();
        
        // Calculate current distance between fingers
        const currentDistance = getTouchDistance(touches[0], touches[1]);
        
        // Calculate zoom factor based on distance change
        const distanceRatio = currentDistance / initialPinchDistance;
        const newZoom = constrain(lastPinchZoom * distanceRatio, 0.2, 3.0);
        
        // Get current center point for zoom focus
        const rect = canvas.elt.getBoundingClientRect();
        const currentCenter = {
            x: (touches[0].clientX + touches[1].clientX) / 2 - rect.left,
            y: (touches[0].clientY + touches[1].clientY) / 2 - rect.top
        };
        
        // Apply zoom at the center point between fingers
        const zoomFactor = newZoom / targetZoom;
        zoomAtPoint(currentCenter.x, currentCenter.y, zoomFactor);
    }
}

/**
 * Handle touch end
 */
function handleTouchEnd(event) {
    if (event.touches.length < 2) {
        isPinching = false;
        initialPinchDistance = 0;
    }
}

/**
 * Calculate distance between two touch points
 */
function getTouchDistance(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Zoom at a specific point (zoom focus point)
 */
function zoomAtPoint(focusX, focusY, zoomFactor) {
    // Don't zoom if over UI elements
    if (isMouseOverUI()) {
        return;
    }
    
    // Calculate world coordinates before zoom
    const worldX_before = (focusX - width/2) / targetZoom - targetViewX;
    const worldY_before = (focusY - height/2) / targetZoom - targetViewY;
    
    // Apply zoom
    const newZoom = constrain(targetZoom * zoomFactor, 0.2, 3.0);
    targetZoom = newZoom;
    
    // Calculate world coordinates after zoom
    const worldX_after = (focusX - width/2) / targetZoom - targetViewX;
    const worldY_after = (focusY - height/2) / targetZoom - targetViewY;
    
    // Adjust view to keep the focus point in the same place
    targetViewX += worldX_after - worldX_before;
    targetViewY += worldY_after - worldY_before;
}

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
    
    // Clear step counter immediately
    if (stepCounter) {
        stepCounter.html('Step: None Selected');
    }
    
    // Clear active step styling
    selectAll('.step-item').forEach(item => item.removeClass('active'));
    
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
    dropdownContainer.style('left', '10px'); // Move it to the right of controls
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
    canvas = createCanvas(windowWidth - PANEL_WIDTH, windowHeight);
    canvas.parent('canvas-container');
    
    // Get references to HTML elements
    tooltip = select('#tooltip');
    stepCounter = select('#step-counter');
    stepList = select('#step-list');
    controls = select('#controls');
    
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

    // Remove existing legend if it exists
    if (legend) {
        legend.remove();
    }
    
    // Or alternatively, remove by ID:
    const existingLegend = select('#legend');
    if (existingLegend) {
        existingLegend.remove();
    }
    
    legend = createDiv('');
    legend.id('legend');
    legend.style('background', 'rgba(20, 20, 20, 0.9)');
    legend.style('padding', LEGEND_PADDING + 'px');
    legend.style('border-radius', '4px');
    legend.style('border', '1px solid #444444');
    legend.style('font-family', 'Helvetica, sans-serif');
    legend.style('color', '#F2F2F2');
    legend.style('font-size', '11px');
    legend.style('width', LEGEND_WIDTH + 'px');

    
    let title = createDiv('Legend');
    title.parent(legend);
    title.style('color', '#5DC0D9');
    title.style('font-weight', 'bold');
    title.style('margin-bottom', '8px');
    
    // let edgeTypes = createDiv(`
    //     <div style="margin: 4px 0;"><span style="color: #78B478;">━━━</span> Active Edge</div>
    //     <div style="margin: 4px 0;"><span style="color: #999999;">━━━</span> Inactive Edge</div>
    //     <div style="margin: 4px 0;"><span style="color: #FF6464;">┅┅┅</span> Violated Edge</div>
    //     <div style="margin: 4px 0;"><span style="color: #666666;">━━━</span> Unused Edge</div>
    //     <div style="margin: 4px 0;"><span style="color: #78B478;">⭕</span> Self-Loop</div>
    // `);
    let edgeTypes = createDiv(`
        <div style="margin: 4px 0;"><span style="color: #78B478;">━━━</span> Active</div>
        <div style="margin: 4px 0;"><span style="color: #999999;">━━━</span> Inactive</div>
        <div style="margin: 4px 0;"><span style="color: #FF6464;">┅┅┅</span> Violated</div>
    `);
    edgeTypes.parent(legend);
    
    // let nodeTypes = createDiv(`
    //     <div style="margin: 6px 0 4px 0; font-weight: bold;">Nodes:</div>
    //     <div style="margin: 2px 0;"><span style="color: #5DC0D9;">■</span> Individual/Child</div>
    //     <div style="margin: 2px 0;"><span style="color: #78B478;">■</span> Group/Parent</div>
    //     <div style="margin: 2px 0;"><span style="color: #999999;">■</span> Organization/Root</div>
    //     <div style="margin: 2px 0;"><span style="color: #FFA500;">■</span> Related Children</div>
    // `);
    let nodeTypes = createDiv(`
        <div style="margin: 6px 0 4px 0; font-weight: bold;">Nodes:</div>
        <div style="margin: 2px 0;"><span style="color: #5DC0D9;">■</span> Agent</div>
        <div style="margin: 2px 0;"><span style="color: #FFA500;">■</span> Related Agent</div>
        <div style="margin: 2px 0;"><span style="color: #78B478;">■</span> Parent</div>
        <div style="margin: 2px 0;"><span style="color: #999999;">■</span> Grandparent</div>
    `);
    nodeTypes.parent(legend);

    legend.position(width - 250, height - legend.elt.offsetHeight - 20);
}

// =================================================================
// SIDEBAR TAB MANAGEMENT
// =================================================================

// Current active tab
let currentTab = 'edges'; // 'edges' or 'documents'

/**
 * Create the tabbed sidebar interface
 */
function createTabbedSidebar() {
    console.log('📋 Creating tabbed sidebar interface...');
    
    const sidebar = select('#sidebar');
    
    // Clear existing content
    sidebar.html('');
    
    // Create tab navigation
    const tabNav = createDiv('');
    tabNav.id('tab-nav');
    tabNav.style('display', 'flex');
    tabNav.style('margin-bottom', '20px');
    tabNav.style('border-bottom', '2px solid #444444');
    tabNav.parent(sidebar);
    
    // Create Edges tab
    const edgesTab = createDiv('Steps');
    edgesTab.id('edges-tab');
    edgesTab.class('tab-button');
    edgesTab.addClass(currentTab === 'edges' ? 'active' : '');
    edgesTab.style('flex', '1');
    edgesTab.style('padding', '12px');
    edgesTab.style('text-align', 'center');
    edgesTab.style('cursor', 'pointer');
    edgesTab.style('background', currentTab === 'edges' ? '#5DC0D9' : '#262626');
    edgesTab.style('color', currentTab === 'edges' ? '#141414' : '#F2F2F2');
    edgesTab.style('border-radius', '4px 4px 0 0');
    edgesTab.style('font-weight', 'bold');
    edgesTab.style('font-size', '14px');
    edgesTab.style('transition', 'all 0.2s');
    edgesTab.parent(tabNav);
    
    // Create Documents tab
    const documentsTab = createDiv('Output');
    documentsTab.id('documents-tab');
    documentsTab.class('tab-button');
    documentsTab.addClass(currentTab === 'documents' ? 'active' : '');
    documentsTab.style('flex', '1');
    documentsTab.style('padding', '12px');
    documentsTab.style('text-align', 'center');
    documentsTab.style('cursor', 'pointer');
    documentsTab.style('background', currentTab === 'documents' ? '#5DC0D9' : '#262626');
    documentsTab.style('color', currentTab === 'documents' ? '#141414' : '#F2F2F2');
    documentsTab.style('border-radius', '4px 4px 0 0');
    documentsTab.style('font-weight', 'bold');
    documentsTab.style('font-size', '14px');
    documentsTab.style('transition', 'all 0.2s');
    documentsTab.parent(tabNav);
    
    // Add click handlers
    edgesTab.mousePressed(() => switchTab('edges'));
    documentsTab.mousePressed(() => switchTab('documents'));
    
    // Create content container
    const contentContainer = createDiv('');
    contentContainer.id('tab-content');
    contentContainer.parent(sidebar);
    
    // Create the appropriate content
    if (currentTab === 'edges') {
        createStepEdgesList();
    } else {
        createStepDocumentsList();
    }
    
    console.log('✅ Tabbed sidebar interface created');
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
    if (currentTab === tabName) return;
    
    console.log(`🔄 Switching to ${tabName} tab`);
    
    currentTab = tabName;
    
    // Update tab styling
    const edgesTab = select('#edges-tab');
    const documentsTab = select('#documents-tab');
    
    if (edgesTab && documentsTab) {
        if (tabName === 'edges') {
            edgesTab.style('background', '#5DC0D9');
            edgesTab.style('color', '#141414');
            documentsTab.style('background', '#262626');
            documentsTab.style('color', '#F2F2F2');
        } else {
            documentsTab.style('background', '#5DC0D9');
            documentsTab.style('color', '#141414');
            edgesTab.style('background', '#262626');
            edgesTab.style('color', '#F2F2F2');
        }
    }
    
    // Update content
    const contentContainer = select('#tab-content');
    if (contentContainer) {
        contentContainer.html('');
        
        if (tabName === 'edges') {
            createStepEdgesList();
        } else {
            createStepDocumentsList();
        }
    }
}

/**
 * Create the step list with edges (FIXED VERSION)
 */
function createStepEdgesList() {
    console.log('📋 Creating step edges list...');
    
    const contentContainer = select('#tab-content');
    
    // Create step list container
    const stepList = createDiv('');
    stepList.id('step-list');
    stepList.parent(contentContainer);
    
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
            
            // FIX: Make entire step div clickable by adding explicit click handler
            stepDiv.elt.addEventListener('click', (e) => {
                // Only prevent selection if clicking directly on edge items, checkboxes, or expand buttons
                if (e.target.closest('.edge-item, input[type="checkbox"], .expand-btn')) {
                    return;
                }
                selectStep(step.step_id, false);
            });
            
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
                    edgeItem.style('color', '#DDDDDD'); // FIX: Changed from #BBBBBB to #DDDDDD for better visibility
                    edgeItem.style('margin', '3px 0');
                    edgeItem.style('cursor', 'pointer');
                    edgeItem.style('padding', '3px');
                    edgeItem.style('border-radius', '2px');
                    edgeItem.style('position', 'relative');
                    edgeItem.style('display', 'flex');
                    edgeItem.style('align-items', 'center');

                    // Prevent clicks from propagating to stepDiv
                    edgeItem.elt.addEventListener('click', (e) => {
                        e.stopPropagation();
                    });

                    const checkbox = createCheckbox('', false);
                    checkbox.style('margin-right', '8px');
                    checkbox.style('transform', 'scale(0.8)');
                    checkbox.changed(() => {
                        if (checkbox.checked()) {
                            selectedEdges.add(edge.interaction_id);
                            console.log(selectedEdges);
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

                    const isSelfLoop = edge.from_nodes.some(fromId => edge.to_nodes.includes(fromId));
                    const arrow = isSelfLoop ? '↻' : (edge.bidirectional ? '↔' : '→');
                    const display = isSelfLoop ? fromNames + ' ' + arrow : `${fromNames} ${arrow} ${toNames}`;

                    const textSpan = createSpan(display);
                    textSpan.style('vertical-align', 'middle');
                    textSpan.style('color', '#DDDDDD'); // FIX: Better visibility for edge text
                    textSpan.parent(edgeItem);

                    edgeItem.mouseOver(() => {
                        edgeItem.style('background', '#444');
                        edgeItem.style('color', '#F2F2F2'); // FIX: Even brighter on hover
                        hoveredEdge = edge.interaction_id;
                    });

                    edgeItem.mouseOut(() => {
                        edgeItem.style('background', 'transparent');
                        edgeItem.style('color', '#DDDDDD'); // FIX: Return to improved visibility color
                        hoveredEdge = null;
                    });

                    edgeItem.parent(edgesList);
                });

                // Stop propagation on edgesList container
                edgesList.elt.addEventListener('click', (e) => e.stopPropagation());
                
                edgesList.parent(stepDiv);
                
                const expandBtn = createDiv('▶ ' + relatedEdges.length + ' edges');
                expandBtn.class('expand-btn');
                expandBtn.style('font-size', '10px');
                expandBtn.style('color', '#5DC0D9');
                expandBtn.style('cursor', 'pointer');
                expandBtn.style('margin-top', '5px');

                // Stop propagation on expand button
                expandBtn.elt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isExpanded = edgesList.elt.style.display === 'block';
                    if (isExpanded) {
                        edgesList.style('display', 'none');
                        expandBtn.html('▶ ' + relatedEdges.length + ' edges');
                    } else {
                        edgesList.style('display', 'block');
                        expandBtn.html('▼ ' + relatedEdges.length + ' edges');
                    }
                });

                expandBtn.parent(stepDiv);
            }
            
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
            
            // FIX: Same click handler fix for 'other' phase steps
            stepDiv.elt.addEventListener('click', (e) => {
                selectStep(step.step_id, false);
            });
            
            const dateDiv = createDiv(step.date);
            dateDiv.class('step-date');
            dateDiv.parent(stepDiv);
            
            const descDiv = createDiv(step.step_description);
            descDiv.class('step-description');
            descDiv.parent(stepDiv);
            
            stepDiv.parent(stepList);
        });
    }
    
    console.log('✅ Step edges list created');
}

/**
 * Updated createStepDocumentsList function with FIXED step selection
 */
function createStepDocumentsList() {
    console.log('📋 Creating step documents list...');
    
    const contentContainer = select('#tab-content');
    
    // Create step list container
    const stepList = createDiv('');
    stepList.id('step-list');
    stepList.parent(contentContainer);
    
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
            
            // FIX: Make entire step div clickable in documents mode too
            stepDiv.elt.addEventListener('click', (e) => {
                // Only prevent selection if clicking on document items or expand buttons
                if (e.target.closest('.document-item, .bauhaus-document-item, .expand-btn, .documents-list')) {
                    return;
                }
                selectStep(step.step_id, false);
            });
            
            const dateDiv = createDiv(step.date);
            dateDiv.class('step-date');
            dateDiv.parent(stepDiv);
            
            const descDiv = createDiv(step.step_description);
            descDiv.class('step-description');
            descDiv.parent(stepDiv);
            
            // Add documents list for this step
            const relatedDocuments = getDocumentsForStep(step);
            if (relatedDocuments.length > 0) {
                const documentsList = createDiv();
                documentsList.class('documents-list');
                documentsList.style('display', 'none');
                documentsList.style('margin-top', '8px');
                documentsList.style('padding-left', '10px');
                documentsList.style('border-left', '2px solid #444');
                
                // FIX: Stop propagation on documents list container
                documentsList.elt.addEventListener('click', (e) => e.stopPropagation());
                
                relatedDocuments.forEach(doc => {
                    let docItem;
                    
                    // Use Bauhaus-specific rendering if in Bauhaus case
                    if (isBauhausCase()) {
                        docItem = createBauhausDocumentItem(doc);
                    } else {
                        docItem = createRegularDocumentItem(doc);
                    }
                    
                    // FIX: Stop propagation on document items
                    docItem.elt.addEventListener('click', (e) => e.stopPropagation());
                    
                    docItem.parent(documentsList);
                });
                
                documentsList.parent(stepDiv);
                
                const expandBtn = createDiv('▶ ' + relatedDocuments.length + ' documents');
                expandBtn.class('expand-btn');
                expandBtn.style('font-size', '10px');
                expandBtn.style('color', '#5DC0D9');
                expandBtn.style('cursor', 'pointer');
                expandBtn.style('margin-top', '5px');
                
                // FIX: Stop propagation and proper expand functionality
                expandBtn.elt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isExpanded = documentsList.elt.style.display === 'block';
                    if (isExpanded) {
                        documentsList.style('display', 'none');
                        expandBtn.html('▶ ' + relatedDocuments.length + ' documents');
                    } else {
                        documentsList.style('display', 'block');
                        expandBtn.html('▼ ' + relatedDocuments.length + ' documents');
                    }
                });
                
                expandBtn.parent(stepDiv);
            }
            
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
            
            // FIX: Same click handler fix for 'other' phase steps in documents mode
            stepDiv.elt.addEventListener('click', (e) => {
                if (e.target.closest('.document-item, .bauhaus-document-item, .expand-btn, .documents-list')) {
                    return;
                }
                selectStep(step.step_id, false);
            });
            
            const dateDiv = createDiv(step.date);
            dateDiv.class('step-date');
            dateDiv.parent(stepDiv);
            
            const descDiv = createDiv(step.step_description);
            descDiv.class('step-description');
            descDiv.parent(stepDiv);
            
            // Add documents for steps in 'other' phase too
            const relatedDocuments = getDocumentsForStep(step);
            if (relatedDocuments.length > 0) {
                const documentsList = createDiv();
                documentsList.class('documents-list');
                documentsList.style('display', 'none');
                documentsList.style('margin-top', '8px');
                documentsList.style('padding-left', '10px');
                documentsList.style('border-left', '2px solid #444');
                
                // FIX: Stop propagation on documents list
                documentsList.elt.addEventListener('click', (e) => e.stopPropagation());
                
                relatedDocuments.forEach(doc => {
                    let docItem;
                    
                    // Use Bauhaus-specific rendering if in Bauhaus case
                    if (isBauhausCase()) {
                        docItem = createBauhausDocumentItem(doc);
                    } else {
                        docItem = createRegularDocumentItem(doc);
                    }
                    
                    // FIX: Stop propagation on document items
                    docItem.elt.addEventListener('click', (e) => e.stopPropagation());
                    
                    docItem.parent(documentsList);
                });
                
                documentsList.parent(stepDiv);
                
                const expandBtn = createDiv('▶ ' + relatedDocuments.length + ' documents');
                expandBtn.class('expand-btn');
                expandBtn.style('font-size', '10px');
                expandBtn.style('color', '#5DC0D9');
                expandBtn.style('cursor', 'pointer');
                expandBtn.style('margin-top', '5px');
                
                // FIX: Stop propagation and proper expand functionality
                expandBtn.elt.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isExpanded = documentsList.elt.style.display === 'block';
                    if (isExpanded) {
                        documentsList.style('display', 'none');
                        expandBtn.html('▶ ' + relatedDocuments.length + ' documents');
                    } else {
                        documentsList.style('display', 'block');
                        expandBtn.html('▼ ' + relatedDocuments.length + ' documents');
                    }
                });
                
                expandBtn.parent(stepDiv);
            }
            
            stepDiv.parent(stepList);
        });
    }
    
    console.log('✅ Step documents list created');
}

/**
 * Get documents for a specific step
 */
function getDocumentsForStep(step) {
    if (!step.document_ids || !Array.isArray(step.document_ids)) {
        return [];
    }
    
    return step.document_ids.map(docId => {
        return documents.find(doc => doc.document_id === docId);
    }).filter(doc => doc !== undefined);
}

// =================================================================
// BAUHAUS-SPECIFIC DOCUMENT VIEW
// =================================================================

/**
 * Check if current case study is Bauhaus
 */
function isBauhausCase() {
    return currentCaseStudy === 'bauhaus';
}

/**
 * Get image path for Bauhaus documents
 */
function getBauhausImagePath(filename) {
    return `bauhaus_data/images/${filename}`;
}

/**
 * Create image modal for Bauhaus documents
 */
function createImageModal(doc) {
    // Remove existing modal if any
    const existingModal = select('#image-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal overlay
    const modal = createDiv('');
    modal.id('image-modal');
    modal.style('position', 'fixed');
    modal.style('top', '0');
    modal.style('left', '0');
    modal.style('width', '100%');
    modal.style('height', '100%');
    modal.style('background', 'rgba(0, 0, 0, 0.9)');
    modal.style('z-index', '10000');
    modal.style('display', 'flex');
    modal.style('align-items', 'center');
    modal.style('justify-content', 'center');
    modal.style('cursor', 'pointer');
    
    // Close modal when clicking on overlay
    modal.mousePressed(() => {
        modal.remove();
    });
    
    // Create modal content container
    const modalContent = createDiv('');
    modalContent.style('position', 'relative');
    modalContent.style('max-width', '90%');
    modalContent.style('max-height', '90%');
    modalContent.style('background', '#1A1A1A');
    modalContent.style('border-radius', '8px');
    modalContent.style('padding', '20px');
    modalContent.style('border', '2px solid #5DC0D9');
    modalContent.style('cursor', 'default');
    modalContent.parent(modal);
    
    // Prevent modal from closing when clicking on content
    modalContent.elt.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Create close button
    const closeBtn = createDiv('×');
    closeBtn.style('position', 'absolute');
    closeBtn.style('top', '10px');
    closeBtn.style('right', '15px');
    closeBtn.style('font-size', '24px');
    closeBtn.style('color', '#5DC0D9');
    closeBtn.style('cursor', 'pointer');
    closeBtn.style('font-weight', 'bold');
    closeBtn.style('z-index', '10001');
    closeBtn.mousePressed(() => {
        modal.remove();
    });
    closeBtn.parent(modalContent);
    
    // Create image element
    const img = createImg(getBauhausImagePath(doc.tldr), 'Bauhaus Document');
    img.style('max-width', '100%');
    img.style('max-height', '70vh');
    img.style('display', 'block');
    img.style('margin', '0 auto 15px auto');
    img.style('border-radius', '4px');
    img.parent(modalContent);
    
    // Handle image loading error
    img.elt.addEventListener('error', () => {
        img.elt.style.display = 'none';
        const errorMsg = createDiv('Image not found: ' + doc.tldr);
        errorMsg.style('color', '#FF6464');
        errorMsg.style('text-align', 'center');
        errorMsg.style('padding', '20px');
        errorMsg.parent(modalContent);
    });
    
    // Create caption container
    const captionContainer = createDiv('');
    captionContainer.style('color', '#F2F2F2');
    captionContainer.style('font-family', 'Helvetica, sans-serif');
    captionContainer.style('text-align', 'center');
    captionContainer.parent(modalContent);
    
    // Add document description if available
    if (doc.document_description) {
        const description = createDiv(doc.document_description);
        description.style('font-size', '16px');
        description.style('line-height', '1.5');
        description.style('margin-bottom', '10px');
        description.style('color', '#F2F2F2');
        description.parent(captionContainer);
    }
    
    // Add metadata if available
    const metaParts = [];
    if (doc.author) metaParts.push(doc.author);
    if (doc.date) metaParts.push(doc.date);
    
    if (metaParts.length > 0) {
        const metadata = createDiv(metaParts.join(' • '));
        metadata.style('font-size', '14px');
        metadata.style('color', '#BBBBBB');
        metadata.style('margin-top', '10px');
        metadata.parent(captionContainer);
    }
}

/**
 * Create Bauhaus-specific document item
 */
function createBauhausDocumentItem(doc) {
    const docItem = createDiv('');
    docItem.class('bauhaus-document-item');
    docItem.style('margin', '10px 0');
    docItem.style('cursor', 'pointer');
    docItem.style('border-radius', '6px');
    docItem.style('overflow', 'hidden');
    docItem.style('border', '2px solid #444');
    docItem.style('background', '#1A1A1A');
    docItem.style('transition', 'all 0.3s ease');
    
    // Create image container
    const imageContainer = createDiv('');
    imageContainer.style('width', '100%');
    imageContainer.style('height', '120px');
    imageContainer.style('overflow', 'hidden');
    imageContainer.style('position', 'relative');
    imageContainer.style('background', '#2A2A2A');
    imageContainer.parent(docItem);
    
    // Create image element
    const img = createImg(getBauhausImagePath(doc.tldr), 'Bauhaus Document');
    img.style('width', '100%');
    img.style('height', '100%');
    img.style('object-fit', 'cover');
    img.style('display', 'block');
    img.parent(imageContainer);
    
    // Handle image loading error
    img.elt.addEventListener('error', () => {
        imageContainer.style('display', 'flex');
        imageContainer.style('align-items', 'center');
        imageContainer.style('justify-content', 'center');
        img.elt.style.display = 'none';
        
        const errorMsg = createDiv('📷');
        errorMsg.style('color', '#666');
        errorMsg.style('font-size', '24px');
        errorMsg.parent(imageContainer);
    });
    
    // Create text content container
    const textContainer = createDiv('');
    textContainer.style('padding', '10px');
    textContainer.parent(docItem);
    
    // Add document description if available
    if (doc.document_description) {
        const description = createDiv(doc.document_description);
        description.style('font-size', '12px');
        description.style('color', '#F2F2F2');
        description.style('line-height', '1.3');
        description.style('margin-bottom', '6px');
        description.parent(textContainer);
    }
    
    // Add metadata if available
    const metaParts = [];
    if (doc.author) metaParts.push(doc.author);
    if (doc.date) metaParts.push(doc.date);
    
    if (metaParts.length > 0) {
        const metadata = createDiv(metaParts.join(' • '));
        metadata.style('font-size', '10px');
        metadata.style('color', '#888');
        metadata.parent(textContainer);
    }
    
    // Add hover effects
    docItem.mouseOver(() => {
        docItem.style('border-color', '#5DC0D9');
        docItem.style('transform', 'scale(1.02)');
    });
    
    docItem.mouseOut(() => {
        docItem.style('border-color', '#444');
        docItem.style('transform', 'scale(1)');
    });
    
    // Add click handler to open modal
    docItem.mousePressed(() => {
        createImageModal(doc);
    });
    
    return docItem;
}

/**
 * Create regular (non-Bauhaus) document item
 */
function createRegularDocumentItem(doc) {
    const docItem = createDiv();
    docItem.class('document-item');
    docItem.style('font-size', '11px');
    docItem.style('color', '#BBBBBB');
    docItem.style('margin', '6px 0');
    docItem.style('cursor', 'pointer');
    docItem.style('padding', '6px');
    docItem.style('border-radius', '3px');
    docItem.style('border', '1px solid #444');
    docItem.style('background', '#1A1A1A');
    
    // Document title/TLDR
    const titleDiv = createDiv(doc.tldr || 'Untitled Document');
    titleDiv.style('font-weight', 'bold');
    titleDiv.style('color', '#5DC0D9');
    titleDiv.style('margin-bottom', '3px');
    titleDiv.style('font-size', '12px');
    titleDiv.parent(docItem);
    
    // Document author and date
    const metaParts = [];
    if (doc.author) metaParts.push(doc.author);
    if (doc.date) metaParts.push(doc.date);
    
    if (metaParts.length > 0) {
        const metaDiv = createDiv(metaParts.join(' • '));
        metaDiv.style('font-size', '10px');
        metaDiv.style('color', '#888');
        metaDiv.style('margin-bottom', '3px');
        metaDiv.parent(docItem);
    }
    
    // Document description
    if (doc.document_description) {
        const descriptionDiv = createDiv(doc.document_description);
        descriptionDiv.style('font-size', '10px');
        descriptionDiv.style('color', '#BBBBBB');
        descriptionDiv.style('line-height', '1.3');
        descriptionDiv.parent(docItem);
    }
    
    docItem.mouseOver(() => {
        docItem.style('background', '#333');
        docItem.style('border-color', '#5DC0D9');
    });
    
    docItem.mouseOut(() => {
        docItem.style('background', '#1A1A1A');
        docItem.style('border-color', '#444');
    });
    
    return docItem;
}


// =================================================================
// UPDATED INITIALIZATION FUNCTIONS
// =================================================================

/**
 * Updated createStepList function to use the new tabbed interface
 */
function createStepList() {
    createTabbedSidebar();
}


// =================================================================
// KEYBOARD SHORTCUTS FOR MODAL
// =================================================================

/**
 * Handle keyboard events for modal
 */
/**
 * Handle keyboard events (enhanced with better zoom)
 */
function keyPressed() {
    if (keyCode === SHIFT) {
        isShiftPressed = true;
    }
    
    // Close modal with Escape key
    if (keyCode === ESCAPE) {
        const modal = select('#image-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    // Keyboard zoom (zoom at center of screen)
    if (key === '=' || key === '+') {
        zoomAtPoint(width/2, height/2, 1.1);
    } else if (key === '-') {
        zoomAtPoint(width/2, height/2, 0.9);
    }
}

// =================================================================
// UTILITY FUNCTIONS
// =================================================================

/**
 * Preload images for better performance (optional)
 */
function preloadBauhausImages() {
    if (!isBauhausCase()) return;
    
    documents.forEach(doc => {
        if (doc.tldr && doc.tldr.endsWith('.png')) {
            const img = new Image();
            img.src = getBauhausImagePath(doc.tldr);
        }
    });
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
        let alpha = 225;
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
                alpha = 225;
            } else if (isHighlightedChild) {
                nodeColor = color(255, 165, 0); // Orange for highlighted children
                alpha = 180;
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
            // Ira: It seems it would be more intutitive to allow hovering regardless?
            //
            //if (selectedStep === null || isRelevantNode) {
            //    nodeColor = color(255, 200, 100);
                alpha = 255;
            //}
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
        // Check if this specific edge is selected in the UI
        if (selectedEdges.size > 0) {
            shouldShow = selectedEdges.has(edge.interaction_id);
            if (shouldShow) {
                edgeColor = h2Color;
                alpha = 200;
                strokeW = 2;
            }
        } else {
            alpha = 60;
            // When no step is selected, violated edges should be greyed out
            if (edge.violated === 1) {
                edgeColor = h3Color;
                alpha = 40;
            }
        }
    }
    
    if (isActiveEdge && shouldShow) {
        if (edge.violated === 1) {
            edgeColor = color(200, 100, 100);
            strokeW = 2;
            alpha = Math.max(alpha, 180);
        } else if (edge.unused === 1) {
            alpha = Math.min(alpha, 80);
        }
    }
    
    if (hoveredEdge === edge.interaction_id && (selectedStep === null || shouldShow)) {
        // Ira: I think changing the alpha and stroke is enough
        // WWETD? What Would Edward Tufte Do?
        //edgeColor = color(255, 255, 100);
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

    // Don't bother if divs are in the way
    if (isMouseOverUI()) {
        hoveredNode = null;
        if (!isMouseOverElement(stepList.elt)) hoveredEdge = null;
        updateTooltip();
        return;
    }

    // Transform mouse coordinates to world space
    let worldMouseX = (mouseX - width/2) / zoomLevel - viewX;
    let worldMouseY = (mouseY - height/2) / zoomLevel - viewY;
    
    let newHoveredNode = null;
    let newHoveredEdge = null;
    
    if (mouseX < width) {
        // Check nodes - allow hover for all nodes when no step selected, relevant nodes when step selected
        nodes.forEach(node => {
            const pos = nodePositions.get(node.node_id);
            if (pos && dist(worldMouseX, worldMouseY, pos.x, pos.y) < 20) {
                newHoveredNode = node.node_id;

                // Ira: It seems like you should just allow hovering for all nodes, regardless of whether a step is selected
                // Especially that appears to be the intended effect for edges.
                //
                // if (selectedStep === null) {
                //     newHoveredNode = node.node_id;
                // } else {
                //     // Check if node is relevant to selected step
                //     const relevantEdges = edges.filter(e => 
                //         e.step_id === selectedStep && 
                //         (e.from_nodes.includes(node.node_id) || e.to_nodes.includes(node.node_id))
                //     );
                //     if (relevantEdges.length > 0) {
                //         newHoveredNode = node.node_id;
                //     }
                // }
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

function selectStep(stepId, fromStepCounter) {
    stepCounterClicked = fromStepCounter;
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
            // Clear previous contents
            stepCounter.html('');

            // Create a container div for centering
            let container = createDiv();
            container.parent(stepCounter);
            container.style('text-align', 'center');

            // Previous button
            let prevBtn = null;
            prevBtn = createButton('←');
            prevBtn.parent(container);
            prevBtn.style('background', '#666666');
            prevBtn.style('border', 'none');
            prevBtn.style('color', 'white');
            prevBtn.style('padding', '2px 6px');
            prevBtn.style('margin-right', '5px');
            prevBtn.style('border-radius', '2px');
            prevBtn.style('cursor', 'pointer');
            if (selectedStep > 0) {
                prevBtn.style('background', '#5DC0D9');
                prevBtn.mousePressed(() => selectStep(selectedStep - 1, true));
            }

            // Step label
            let stepLabel = createSpan('Step ' + selectedStep);
            stepLabel.parent(container);
            stepLabel.style('color', '#5DC0D9');
            stepLabel.style('font-weight', 'bold');

            // Next button
            let nextBtn = null;
            nextBtn = createButton('→');
            nextBtn.parent(container);
            nextBtn.style('background', '#666666');
            nextBtn.style('border', 'none');
            nextBtn.style('color', 'white');
            nextBtn.style('padding', '2px 6px');
            nextBtn.style('margin-left', '5px');
            nextBtn.style('border-radius', '2px');
            nextBtn.style('cursor', 'pointer');
            if (selectedStep < steps.length - 1) {
                nextBtn.style('background', '#5DC0D9');
                nextBtn.mousePressed(() => selectStep(selectedStep + 1, true));
            }

            // Step description
            let descDiv = createDiv(step.step_description);
            descDiv.parent(stepCounter);
            descDiv.style('font-size', '12px');
            descDiv.style('margin-top', '5px');
            descDiv.style('color', '#F2F2F2');
            descDiv.style('line-height', '1.3');

            // Step date
            let dateDiv = createDiv(step.date);
            dateDiv.parent(stepCounter);
            dateDiv.style('font-size', '10px');
            dateDiv.style('margin-top', '3px');
            dateDiv.style('color', '#BBBBBB');

            // Ensure the stepCounter is centered at the top of the canvas
            stepCounter.style('width', '300px');
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

    // Compute bounding box of all involved nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let any = false;
    involvedNodeIds.forEach(nodeId => {
        const pos = nodePositions.get(nodeId);
        if (pos) {
            minX = Math.min(minX, pos.x);
            minY = Math.min(minY, pos.y);
            maxX = Math.max(maxX, pos.x);
            maxY = Math.max(maxY, pos.y);
            any = true;
        }
    });
    if (!any) return;

    // Add padding to bounding box (in world coordinates)
    const padding = 40;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    // Center of bounding box
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Compute width and height of bounding box
    const boxWidth = maxX - minX;
    const boxHeight = maxY - minY;

    // Compute the available screen size (canvas) in pixels
    // Subtract some margin for UI overlays, legend, etc.
    const margin = 60;
    const availableWidth = width - margin;
    const availableHeight = height - margin;

    // Compute zoom to fit all nodes comfortably
    // (boxWidth * zoom <= availableWidth) => zoom <= availableWidth / boxWidth
    // (boxHeight * zoom <= availableHeight) => zoom <= availableHeight / boxHeight
    let zoomFit = 1.0;
    if (boxWidth > 0 && boxHeight > 0) {
        zoomFit = Math.min(availableWidth / boxWidth, availableHeight / boxHeight);
        // Clamp to reasonable zoom range
        zoomFit = constrain(zoomFit, 0.2, 3.0);
    }

    // Smoothly pan to the center of relevant nodes
    targetViewX = -centerX;
    targetViewY = -centerY;
    targetZoom = zoomFit;
}

/**
 * Update tooltip (FIXED VERSION - no "No description available")
 */
function updateTooltip() {
    if (hoveredNode !== null) {
        const node = nodes.find(n => n.node_id === hoveredNode);
        if (node) {
            // FIX: Only show description if it exists, otherwise just show the name
            if (node.node_description && node.node_description.trim() !== '') {
                tooltip.html(`<strong>${node.node_name}</strong><br>${node.node_description}`);
            } else {
                tooltip.html(`<strong>${node.node_name}</strong>`);
            }
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
    lastMouseX = mouseX;
    lastMouseY = mouseY;
}

function mouseClicked() {
    console.log("UI? " + isMouseOverUI());
    if (isMouseOverUI()) return;
    if (!isDragging) {
        // Ira: It seems to me like you'd what to be able to select another step even if one is currently selected
        //if (selectedStep === null && hoveredEdge !== null) {
        if (hoveredEdge !== null) {
            const edge = edges.find(e => e.interaction_id === hoveredEdge);
            if (edge) {
                selectStep(edge.step_id, false);
                return;
            }
        } else {
            selectStep(null, false);
        }
    }
    isDragging = false;
}

/**
 * Mouse drag events
 */
function mouseDragged() {
    isDragging = true;
    const deltaX = mouseX - lastMouseX;
    const deltaY = mouseY - lastMouseY;
    
    if (isShiftPressed) {
        // Rotate view (shift + drag) - just for visual effect in 2D
        const sensitivity = 2;
        targetViewX += deltaX * sensitivity;
        targetViewY += deltaY * sensitivity;
    } else {
        // Move/pan view (regular drag)
        const sensitivity = 1.0 / zoomLevel;
        targetViewX += deltaX * sensitivity;
        targetViewY += deltaY * sensitivity;
    }
    
    lastMouseX = mouseX;
    lastMouseY = mouseY;
}

/**
 * Mouse release events
 */
function windowResized() {
    resizeCanvas(windowWidth - PANEL_WIDTH, windowHeight);
    legend.position(width - legend.elt.offsetHeight - MARGIN, height - legend.elt.offsetHeight - MARGIN);
}

/**
 * Window resize events
 */
function isMouseOverElement(element) {
  const rect = element.getBoundingClientRect();
  return mouseX >= rect.left && mouseX <= rect.right &&
         mouseY >= rect.top && mouseY <= rect.bottom;
}

/**
 * Enhanced isMouseOverUI to handle touch coordinates
 */
function isMouseOverUIAtPoint(x, y) {
    // Create a list of UI elements to check
    const uiElements = [];
    
    // Add elements that exist
    if (legend && legend.elt) uiElements.push(legend.elt);
    if (stepCounter && stepCounter.elt) uiElements.push(stepCounter.elt);
    if (controls && controls.elt) uiElements.push(controls.elt);
    if (stepList && stepList.elt) uiElements.push(stepList.elt);
    
    // Check case study dropdown
    const dropdown = select('#case-study-dropdown-container');
    if (dropdown && dropdown.elt) uiElements.push(dropdown.elt);
    
    // Check if coordinates are over any UI element
    return uiElements.some(element => {
        const rect = element.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    });
}


/**
 * Updated isMouseOverUI function
 */
function isMouseOverUI() {
    return isMouseOverUIAtPoint(mouseX, mouseY);
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
window.switchTab = switchTab;


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