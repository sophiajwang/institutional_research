// === Global Variables ===

const VERSION = '1.17';
const TEXT_SIZE = 13;

// --- Bubble Animation ---
let bubbles = [];

// Graph data
let graphData;
let nodes = [], edges = [];
let individualData, themeData, categoryData, edgeData;
let uniqueGroups = [];
let groupVisibility = {};

// Simulation state
let draggingNode = null, offsetX, offsetY;
let hoveredNode = null;
let functionKey = false;
let fixCategory = 'theme';
let repelForce, repelDist, springForce, springLength;
let centerForce, containForce;
let minVelocity, maxVelocity;
let container;
let thresholdValue;

// Styling and layout
let bgColor, bgColorDark, textColor, textColorDark;
let h1Color, h1ColorDark, h2Color, h2ColorDark, h3Color, h3ColorDark;
let indRadius, catRadius, theRadius, initAngle;
let prevDarkMode;
let minGraphWidth;

// UI and settings
let settingsData, settings;
let vizGui, groupGui;
let thresholdSlider;
let drawModeButton, dataModeButton, themesButton, individualButton;
let enableIndividuals, enableThemes;

function preload() {
  individualData = loadJSON('data/nodes_individuals.json');
  themeData = loadJSON('data/nodes_themes.json');
  categoryData = loadJSON('data/nodes_categories.json');
  edgeData = loadJSON('data/edges.json');
  settingsData = loadJSON('data/settings.json');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  initSettings();
  updateThresholdValue(settingsData.linearValue);
  prevDarkMode = settings.darkMode;

  initNodes();
  initEdges();

  groupVisibility["(none specified)"] = true;
  for (let group of uniqueGroups) {
    groupVisibility[group] = true;
  }
  
  initUI();
  updateGUI();
  updateStyle();
  narrowCheck();
  initHitboxes();
}

function draw() {
  updateThresholdValue(thresholdSlider.value());
  updateActiveEmbeddings();
  
  if (settings.darkMode !== prevDarkMode) {
    updateStyle(); // or updateStyles() if you named it that
    prevDarkMode = settings.darkMode;
  }

  background(settings.darkMode ? bgColorDark : bgColor);
  updateGUI();
  updateHitboxes();

  if (settingsData.drawMode === "data") {
    applyFixedStates();
    if (isTable()) {
      applyTableState();
    } else if (isGraph()) {
      applyForces();
      drawEdges();
    }
    drawNodes();
    drawInfo();
    if (hoveredNode) drawNodeTip(hoveredNode);
  } else if (settingsData.drawMode === "koi") {
    applyFlocking();
    drawKoi();
    drawBubbles();
    drawInfo();
  }

  drawButtonTips();
}

function updateThresholdValue(linearValue) {
  thresholdValue = pow(linearValue, 0.5); // squaring the root makes the mid-point ~0.75
}

function narrowCheck() {
  const tooNarrow = width < minGraphWidth;
  if (tooNarrow) {
    dataModeButton.attribute('disabled', '');
    dataModeButton.style('opacity', '0.5');
    dataModeButton.tooltip = 'Graph mode is disabled for narrow window sizes.';
    dataModeButton.html("Graph Mode");
  } else {
    dataModeButton.removeAttribute('disabled');
    dataModeButton.style('opacity', '1.0');
    dataModeButton.tooltip = null;
  }
}

function initSettings() {
  settings = settingsData.guiSettings;

  enableIndividuals = settingsData.enableIndividuals;
  enableThemes = settingsData.enableThemes;
  container = settingsData.container;
  repelForce = settingsData.repelForce;
  repelDist = settingsData.repelDist;
  springForce = settingsData.springForce;
  springLength = settingsData.springLength;
  centerForce = settingsData.centerForce;
  if (settings.showThemes) settings.forceCenter = false;
  containForce = settingsData.containForce;
  maxVelocity = settingsData.maxVelocity;
  minVelocity = settingsData.minVelocity;
  indRadius = settingsData.indRadius;
  catRadius = settingsData.catRadius;
  theRadius = settingsData.theRadius;
  initAngle = settingsData.initAngle;
  minGraphWidth = settingsData.minGraphWidth;
  bgColor = color(settingsData.bgColor);
  bgColorDark = color(settingsData.bgColorDark);
  textColor = color(settingsData.textColor);
  textColorDark = color(settingsData.textColorDark);
  h1Color = color(settingsData.h1Color);
  h1ColorDark = color(settingsData.h1ColorDark);
  h2Color = color(settingsData.h2Color);
  h2ColorDark = color(settingsData.h2ColorDark);
  h3Color = color(settingsData.h3Color);
  h3ColorDark = color(settingsData.h3ColorDark);
}

function initUI() {
  groupGui = createGui('Group Visibility');
  groupGui.addObject(groupVisibility);

  vizGui = createGui('Display Settings');
  vizGui.addObject(settings);

  thresholdSlider = createSlider(0.25, 1, settingsData.linearValue, 0.01);

  drawModeButton = createButton('Koi Pond');
  drawModeButton.mousePressed(toggleDrawMode);

  themesButton = createButton('Themes');
  themesButton.mousePressed(toggleThemes);

  individualButton = createButton('People');
  individualButton.mousePressed(toggleIndividuals);

  dataModeButton = createButton(settingsData.dataMode === "table" ? "Graph Mode" : "List Mode");
  if (width < minGraphWidth && settingsData.dataMode === "graph") toggleDataMode();
  dataModeButton.mousePressed(toggleDataMode);

  if (settings.showThemes && width < minGraphWidth) {
    toggleIndividuals();
  }
}

function toggleDrawMode() {
  if (settingsData.drawMode === "koi") {
    settingsData.drawMode = "data";
  } else {
    settingsData.drawMode = "koi";
  }
  updateStyle();
}

function toggleDataMode() {
  if (settingsData.dataMode === "graph") {
    settingsData.dataMode = "table";
  } else {
    settingsData.dataMode = "graph";
  }
  updateStyle();
}

function updateStyle() {
  let margin = 20;
  let w = 100;
  let h = 28;
  let lineCol = settings.darkMode ? h3ColorDark : h3Color;

  let themesBase = settings.darkMode ? h2ColorDark : h2Color;
  themesButton.style('color', 'white');
  if (!settings.showThemes) {
    themesBase = settings.darkMode ? h3Color : h3ColorDark;
    themesButton.style('color', color(lineCol).toString());
  }
  themesButton.style('background-color', themesBase.toString());
  themesButton.style('border', '1px solid ' + color(lineCol).toString());
  themesButton.style('padding', '5px 10px');
  themesButton.style('width', w + 'px');
  themesButton.style('height', h + 'px');
  themesButton.style('cursor', 'pointer');
  themesButton.style('z-index', '3');
  themesButton.position(2*margin + w, 2*margin + h);
  themesButton.mouseOver(() => themesButton.style('background-color', color(red(themesBase) * 0.9, green(themesBase) * 0.9, blue(themesBase) * 0.9).toString()));
  themesButton.mouseOut(() => themesButton.style('background-color', themesBase.toString()));
  
  let individualBase = settings.darkMode ? h1ColorDark : h1Color;
  individualButton.style('color', 'white');
  if (!settings.showIndividuals) {
    individualBase = settings.darkMode ? h3Color : h3ColorDark;
    individualButton.style('color', color(lineCol).toString());
  }
  individualButton.style('background-color', individualBase.toString());
  individualButton.style('border', '1px solid ' + color(lineCol).toString());
  individualButton.style('padding', '5px 10px');
  individualButton.style('width', w + 'px');
  individualButton.style('height', h + 'px');
  individualButton.style('cursor', 'pointer');
  individualButton.style('z-index', '3');
  individualButton.position(margin, 2*margin + h);
  individualButton.mouseOver(() => individualButton.style('background-color', color(red(individualBase) * 0.9, green(individualBase) * 0.9, blue(individualBase) * 0.9).toString()));
  individualButton.mouseOut(() => individualButton.style('background-color', individualBase.toString()));

  let modeBG = settings.darkMode ? bgColorDark : bgColor;

  dataModeButton.style('background-color', color(modeBG).toString());
  dataModeButton.style('color', color(lineCol).toString());
  dataModeButton.style('border', '1px solid ' + color(lineCol).toString());
  dataModeButton.style('padding', '5px 10px');
  dataModeButton.style('width', w + 'px');
  dataModeButton.style('height', h + 'px');
  dataModeButton.style('cursor', 'pointer');
  dataModeButton.style('z-index', '3');
  if (settingsData.dataMode === "table") {
    dataModeButton.html("Graph Mode");
  } else {
    dataModeButton.html("List Mode");
  }
  dataModeButton.position(2*margin + w, margin);
  dataModeButton.mouseOver(() => dataModeButton.style('background-color', color(0.8*red(modeBG), 0.8*green(modeBG), 0.8*blue(modeBG)).toString()));
  dataModeButton.mouseOut(() => dataModeButton.style('background-color', color(modeBG).toString()));

  drawModeButton.style('background-color', color(modeBG).toString());
  drawModeButton.style('color', color(lineCol).toString());
  drawModeButton.style('border', '1px solid ' + color(lineCol).toString());
  drawModeButton.style('padding', '5px 10px');
  drawModeButton.style('width', w + 'px');
  drawModeButton.style('height', h + 'px');
  drawModeButton.style('cursor', 'pointer');
  drawModeButton.style('z-index', '3');
  if (settingsData.drawMode === "koi") {
    drawModeButton.html("View Atlas");
  } else {
    drawModeButton.html("Koi Pond");
  }
  drawModeButton.position(margin, margin);
  drawModeButton.mouseOver(() => drawModeButton.style('background-color', color(0.8*red(modeBG), 0.8*green(modeBG), 0.8*blue(modeBG)).toString()));
  drawModeButton.mouseOut(() => drawModeButton.style('background-color', color(modeBG).toString()));

  thresholdSlider.position(margin, 3*margin + 2*h + margin);
  thresholdSlider.style('width', '220px');
  thresholdSlider.style('background-color', '#ccc');
  thresholdSlider.style('border', '1px solid #999');
  thresholdSlider.style('height', '3px');
  thresholdSlider.style('border-radius', '4px');
  thresholdSlider.style('outline', 'none');
  thresholdSlider.style('background', '#CCC');
  thresholdSlider.style('color', '#666');
  thresholdSlider.style('accent-color', '#666');
  thresholdSlider.style('z-index', '3');

  groupGui.setPosition(width - 220, 60);
  vizGui.setPosition(width - 440, 60);

    if (settingsData.drawMode === "koi") {
    dataModeButton.hide();
    themesButton.hide();
    individualButton.hide();
    thresholdSlider.hide();
  } else {
    dataModeButton.show();
    themesButton.show();
    individualButton.show();

    if (settings.showIndividuals && isGraph()) {
      thresholdSlider.show();
    } else {
      thresholdSlider.hide();
    }

    if (!enableIndividuals) {
      individualButton.hide();
    }

    if (!enableThemes) {
      themesButton.hide();
    }
  }
}

function toggleThemes() {
  if (settings.showIndividuals) {
    toggleIndividuals();
  }

  settings.showThemes = !settings.showThemes;
  if (settings.showThemes) {
    settings.showCategories = true;
    settings.showThemes = true;
    settings.showIndividuals = false;
    settings.forceCenter = false;
    thresholdSlider.hide();
  } else {
    settings.showThemes = false;
    settings.forceCenter = true;
  }
  updateStyle();
}

function toggleIndividuals() {
  if (settings.showThemes) {
    toggleThemes();
  }
  
  settings.showIndividuals = !settings.showIndividuals;
  if (settings.showIndividuals) {
    settings.showCategories = true;
    settings.showThemes = false;
    settings.showIndividuals = true;
    thresholdSlider.show();
  } else {
    settings.showIndividuals = false;
    thresholdSlider.hide();
  }
  updateStyle();
}

function initNodes() {
  nodes = [];
  const individualNodes = [];
  const themeNodes = [];
  const categoryNodes = [];

  const groupSet = new Set();

  for (let n of individualData.nodes) {
    individualNodes.push(n);
  }
  for (let n of themeData.nodes) {
    themeNodes.push(n);
  }
  for (let n of categoryData.nodes) {
    categoryNodes.push(n);
  }

  // Place individuals radially around center
  individualNodes.forEach((n, i) => {
    nodes.push({
      id: n.id,
      label: n.label,
      type: n.type,
      x: random(width),
      y: random(height),
      vx: 0,
      vy: 0,
      fixed: true,
      description: n.description || "No description available.",
      long_description: n.long_description || "No description available.",
      group: n.group || "(none specified)"
    });
    if (n.group) groupSet.add(n.group);
  });
  
  // Place theme nodes radially around center
  themeNodes.forEach((n, i) => {
    nodes.push({
      id: n.id,
      label: n.label,
      type: n.type,
      x: random(width),
      y: random(height),
      vx: 0,
      vy: 0,
      fixed: true,
      description: n.description || "No description available.",
      group: n.group || "(none specified)"
    });
    if (n.group) groupSet.add(n.group);
  });
  
  // Random position for category nodes
  categoryNodes.forEach((n, i) => {
    nodes.push({
      id: n.id,
      label: n.label,
      type: n.type,
      x: random(width),
      y: random(height),
      vx: 0,
      vy: 0,
      fixed: false,
      description: n.description || "No description available.",
      group: n.group || "(none specified)"
    });
    if (n.group) groupSet.add(n.group);
  });

  uniqueGroups = Array.from(groupSet).sort();

  for (let n of nodes) n.theta = random(2 * PI);
}

function initEdges() {
  edges = edgeData.edges;
  for (let e of edges) {
    if (e.to.substring(0, 3) === "the" || e.from.substring(0, 3) === "the") {
      e.embedding = e.embedding_self;
    } else if (e.embedding_self && e.embedding_auto) {
      e.embedding = 0.75 * e.embedding_self + 0.25 * e.embedding_auto;
    } else if (e.embedding_auto) {
      e.embedding = e.embedding_auto;
    } else if (e.embedding_self) {
      e.embedding = e.embedding_self;
    }
  }
  ensureDefaultIndividualConnection();
}

function updateGUI() {
  if (settingsData.showGUI) {
    vizGui.show();
    groupGui.show();
  } else {
    vizGui.hide();
    groupGui.hide();
  }
}

function applyForces() {
  for (let n of nodes) {
    let applyForce = forcing(n);

    let groupName = n.group || "(none specified)";
    if (!groupVisibility[groupName]) continue;

    if (applyForce && !n.fixed) {

      // Cap velocity before updating position
      let speed = sqrt(n.vx * n.vx + n.vy * n.vy);
      if (speed > maxVelocity) {
        let scale = maxVelocity / speed;
        n.vx *= scale;
        n.vy *= scale;
      }

      n.vx *= 0.9;
      n.vy *= 0.9;

      let velocityThreshold = minVelocity;
      if (abs(n.vx) < velocityThreshold) n.vx = 0;
      if (abs(n.vy) < velocityThreshold) n.vy = 0;

      n.x += n.vx;
      n.y += n.vy;
    }
  }

  // Repel Forces
  for (let i = 0; i < nodes.length; i++) {
    let n = nodes[i];
    let centerX = width / 2;
    let centerY = height / 2;

    // Centering Force
    if(settings.forceCenter) {
      let dxCenter = centerX - n.x;
      let dyCenter = centerY - n.y;
      n.vx += dxCenter * centerForce;
      n.vy += dyCenter * centerForce;
    }

    if (container === "ellipse") {
      // Elliptical bounding logic to keep nodes within an ellipse
      let ellipseA = width / 2 - 30;
      let ellipseB = height / 2 - 30;
      let dx = n.x - centerX;
      let dy = n.y - centerY;
      let d = sqrt(dx * dx + dy * dy);
      let angle = atan2(dy, dx);
      let ellipseBoundary = (ellipseA * ellipseB) / sqrt(pow(ellipseB * cos(angle), 2) + pow(ellipseA * sin(angle), 2));
      if (d > ellipseBoundary) {
        let excess = d - ellipseBoundary;
        let repulsion = containForce * excess;
        n.vx -= repulsion * cos(angle);
        n.vy -= repulsion * sin(angle);
      }
    } else if (container === "rectangle") {
      let margin = 30;
      let minX = margin;
      let maxX = width - margin;
      let minY = margin;
      let maxY = height - margin;

      if (n.x < minX) {
        let repulsion = containForce * (minX - n.x);
        n.vx += repulsion;
      } else if (n.x > maxX) {
        let repulsion = containForce * (n.x - maxX);
        n.vx -= repulsion;
      }

      if (n.y < minY) {
        let repulsion = containForce * (minY - n.y);
        n.vy += repulsion;
      } else if (n.y > maxY) {
        let repulsion = containForce * (n.y - maxY);
        n.vy -= repulsion;
      }
    }

    // Between Nodes
    for (let j = i + 1; j < nodes.length; j++) {
      let a = nodes[i];
      let b = nodes[j];
      
      let applyForceA = showing(a);
      
      let groupA = a.group || "(none specified)";
      if (!groupVisibility[groupA]) applyForceA = false;

      let applyForceB = showing(b);

      let groupB = b.group || "(none specified)";
      if (!groupVisibility[groupB]) applyForceB = false;
      
      if (applyForceA && applyForceB) {
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = dist(a.x, a.y, b.x, b.y);
        if (d < repelDist && d > 0) {
          let force = repelForce / (d * d);
          if (!a.fixed) {
            a.vx -= force * dx;
            a.vy -= force * dy;
          }
          if (!b.fixed) {
            b.vx += force * dx;
            b.vy += force * dy;
          }
        }
      }
    }
  }

  // Spring Forces
  for (let e of edges) {
    if (e.embedding !== undefined && e.embedding < thresholdValue) continue;
    let a = nodes.find(n => n.id === e.from);
    let b = nodes.find(n => n.id === e.to);
    if (a && b) {
      
      let applyForceA = showing(a);

      let groupA = a.group || "(none specified)";
      if (!groupVisibility[groupA]) applyForceA = false;
      
      let applyForceB = showing(b);

      let groupB = b.group || "(none specified)";
      if (!groupVisibility[groupB]) applyForceB = false;
      
      if (applyForceA && applyForceB) {
        
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = dist(a.x, a.y, b.x, b.y);
        if (d > 0) {
          let force = (d - springLength) * springForce;
          if (!a.fixed) {
            a.vx += force * dx / d;
            a.vy += force * dy / d;
          }
          if (!b.fixed) {
            b.vx -= force * dx / d;
            b.vy -= force * dy / d;
          }
        }
      }
    }
  }

  // Lerp Theme Nodes
  let themeNodes = nodes.filter(n => n.type === "theme");
  let centerX = width / 2;
  let centerY = height / 2;
  themeNodes.forEach((n, i) => {
    let angle = initAngle + TWO_PI * (i / themeNodes.length);
    n.x = lerp(n.x, centerX + theRadius * cos(angle), 0.1);
    n.y = lerp(n.y, centerY + theRadius * sin(angle), 0.1);
  });
}

function applyFixedStates() {
  for (let n of nodes) {
    if (n.type === "individual") {
      n.fixed = settings.fixIndividuals;
    } else if (n.type === "category") {
      n.fixed = settings.fixCategories;
    } else if (n.type === "theme") {
      n.fixed = settings.fixThemes;
    }
  }
}

// Align individual nodes vertically on the left and sort
function applyTableState() {

  // Sort individual nodes alphabetically by label
  let themeNodes = nodes.filter(n => n.type === "theme").sort((a, b) => a.label.localeCompare(b.label));
  let individualNodes = nodes.filter(n => n.type === "individual").sort((a, b) => a.label.localeCompare(b.label));
  let categoryNodes = nodes.filter(n => n.type === "category").sort((a, b) => a.label.localeCompare(b.label));
  
  if (hoveredNode) {
    if(hoveredNode.type === "individual" || hoveredNode.type === "theme") {
      categoryNodes = nodes.filter(n => n.type === "category").sort((a, b) => b.activeEmbedding - a.activeEmbedding);
    } else if(hoveredNode.type === "category") {
      individualNodes = nodes.filter(n => n.type === "individual").sort((a, b) => b.activeEmbedding - a.activeEmbedding);
      themeNodes = nodes.filter(n => n.type === "theme").sort((a, b) => b.activeEmbedding - a.activeEmbedding);
    }
  }
  
  const iStartX = 30;
  const tStartX = 30;
  const cStartX = width / 2;
  const iSpacing = 20;
  const tSpacing = 20;
  const cSpacing = 20;
  const iStartY = 150;
  const tStartY = 150;
  const cStartY = 150;
  const columnW = 200;
  const margin = 50;

  let iX = iStartX;
  let iY = iStartY;
  individualNodes.forEach((n, i) => {
    n.x = lerp(n.x, iX, 0.1);
    n.y = lerp(n.y, iY, 0.1);

    iY += iSpacing;
    if (iY > height - margin) {
      iY = iStartY;
      iX += columnW
    }
  });

  let tX = tStartX;
  let tY = tStartY;
  themeNodes.forEach((n, i) => {
    n.x = lerp(n.x, tX, 0.1);
    n.y = lerp(n.y, tY, 0.1);

    tY += tSpacing;
    if (tY > height - margin) {
      tY = tStartY;
      tX += columnW
    }
  });

  let cXi, cYi;
  if (width < minGraphWidth) {
    if (settings.showIndividuals) {
      cXi = iX;
      cYi = iY + 2*cSpacing;
    } else if (settings.showThemes) {
      cXi = tX;
      cYi = tY + 2*cSpacing;
    } else {
      cXi = iX;
      cYi = cStartY;
    }
  } else {
    cXi = cStartX;
    cYi = cStartY;
  }

  let cX = cXi;
  let cY = cYi;
  
  categoryNodes.forEach((n, i) => {
    n.x = lerp(n.x, cX, 0.1);
    n.y = lerp(n.y, cY, 0.1);

    cY += cSpacing;
    if (cY > height - margin) {
      cY = cYi;
      cX += columnW
    }
  });
}

function applyFlocking() {
  const perceptionRadius = 100;
  const separationWeight = 1.0;
  const alignmentWeight = 1.0;
  const cohesionWeight = 1.0;

  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    let steerSeparation = createVector(0, 0);
    let steerAlignment = createVector(0, 0);
    let steerCohesion = createVector(0, 0);
    let total = 0;

    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      let other = nodes[j];
      let d = dist(node.x, node.y, other.x, other.y);
      if (d < perceptionRadius && d > 0) {
        // Separation
        let diff = createVector(node.x - other.x, node.y - other.y);
        diff.div(d * d);
        steerSeparation.add(diff);

        // Alignment
        steerAlignment.add(createVector(other.vx, other.vy));

        // Cohesion
        steerCohesion.add(createVector(other.x, other.y));
        total++;
      }
    }

    if (total > 0) {
      // Separation
      steerSeparation.div(total);
      steerSeparation.setMag(maxVelocity);
      steerSeparation.sub(createVector(node.vx, node.vy));
      steerSeparation.limit(0.1);

      // Alignment
      steerAlignment.div(total);
      steerAlignment.setMag(maxVelocity);
      steerAlignment.sub(createVector(node.vx, node.vy));
      steerAlignment.limit(0.1);

      // Cohesion
      steerCohesion.div(total);
      let cohesionForce = createVector(steerCohesion.x - node.x, steerCohesion.y - node.y);
      cohesionForce.setMag(maxVelocity);
      cohesionForce.sub(createVector(node.vx, node.vy));
      cohesionForce.limit(0.1);

      node.vx += steerSeparation.x * separationWeight;
      node.vy += steerSeparation.y * separationWeight;
      node.vx += steerAlignment.x * alignmentWeight;
      node.vy += steerAlignment.y * alignmentWeight;
      node.vx += cohesionForce.x * cohesionWeight;
      node.vy += cohesionForce.y * cohesionWeight;
    }

    // Add subtle random movement to avoid stillness
    if (node.vx + node.vy < 0.002) {
      let jitter = p5.Vector.random2D().mult(5);
      node.vx += jitter.x;
      node.vy += jitter.y;
    }

    // Apply drag and limit speed
    node.vx *= 0.95;
    node.vy *= 0.95;

    const speed = sqrt(node.vx * node.vx + node.vy * node.vy);
    if (speed > maxVelocity) {
      const scale = maxVelocity / speed;
      node.vx *= scale;
      node.vy *= scale;
    }

    node.x += node.vx;
    node.y += node.vy;

    // apply infinite canvas
    let margin = 20;
    if (node.x > width + margin) node.x -= (width + 2 * margin);
    if (node.y > height + margin) node.y -= (height + 2 * margin);
    if (node.x < -margin) node.x += width + 2 * margin;
    if (node.y < -margin) node.y += height + 2 * margin;
  }
}

function drawEdges() {
  let maxLength = 1.0 * springLength;
  for (let e of edges) {
    if (e.embedding !== undefined && e.embedding < thresholdValue) continue;
    let a = nodes.find(n => n.id === e.from);
    let b = nodes.find(n => n.id === e.to);
    if (!a || !b) continue;

    if (
      (a.type === "individual" && !settings.showIndividuals) ||
      (a.type === "category" && !settings.showCategories) ||
      (a.type === "theme" && !settings.showThemes) ||
      (b.type === "individual" && !settings.showIndividuals) ||
      (b.type === "category" && !settings.showCategories) ||
      (b.type === "theme" && !settings.showThemes)
    ) continue;
    
    let groupA = a.group || "(none specified)";
    if (!groupVisibility[groupA]) continue;

    let groupB = b.group || "(none specified)";
    if (!groupVisibility[groupB]) continue;

    let alpha = 75;
    let l = dist(a.x, a.y, b.x, b.y);
    if (l > maxLength) {
      let scaler = max(0, 1.0 - (l - maxLength) / maxLength);
      alpha *= scaler;
    }

    // New: reduce alpha for edges not connected to hoveredNode
    let connected = hoveredNode && (a === hoveredNode || b === hoveredNode);
    if (hoveredNode) {
      if (connected) {
        alpha *= 1.4;
      } else {
        alpha *= 0.2;
      }
    }
    
    let baseStroke = settings.darkMode ? textColorDark : textColor;
    stroke(color(red(baseStroke), green(baseStroke), blue(baseStroke), alpha)); // gray, with alpha
    line(a.x, a.y, b.x, b.y);
    // if(e.embedding !== undefined) {
    //   text(nf(e.embedding, 1, 2), (a.x + b.x) / 2, (a.y + b.y) / 2);
    // }
  }
}

function drawNodes() {
  noStroke();

  // Build set of connected node ids (for edge thresholding)
  let connectedNodeIds = new Set();
  for (let e of edges) {
    if (e.embedding !== undefined && e.embedding < thresholdValue) continue;
    let fNode = nodes.find(n => n.id === e.from);
    if (!fNode) continue;
    let fromGroup = fNode.group || "(none specified)";
    if (!groupVisibility[fromGroup]) continue;
    let tNode = nodes.find(n => n.id === e.to);
    if (!tNode) continue;
    let toGroup = tNode.group || "(none specified)";

    if (!showing(fNode)) continue;
    if (!showing(tNode)) continue;

    if (!groupVisibility[toGroup]) continue;
    connectedNodeIds.add(e.from);
    connectedNodeIds.add(e.to);
  }

  for (let n of nodes) {
    if (!showing(n)) continue;

    let groupName = n.group || "(none specified)";
    if (!groupVisibility[groupName]) continue;

    let isConnected = connectedNodeIds.has(n.id);
    let isAlone = settings.showIndividuals === false & settings.showThemes === false;
    let notCategory = n.type !== "category";
    let alpha = isTable() || isConnected || notCategory || isAlone ? 255 : 50;
    let beta = isTable() && hoveredNode ? n.activeEmbedding : 1.0;
    let color = settings.darkMode ? textColorDark : textColor;
    let gamma = 1.0;
    if (hoveredNode) {
      gamma = isTable() && n.type === hoveredNode.type && n !== hoveredNode ? 0.2 : 1.0;
    }

    // Interpolated zeta logic
    if (hoveredNode && hoveredNode !== n && settingsData.dataMode === "graph") {
      const isHoverConnected = edges.some(e =>
        (typeof e.embedding === 'number' ? e.embedding : 1) >= thresholdValue &&
        ((e.from === hoveredNode.id && e.to === n.id) ||
         (e.to === hoveredNode.id && e.from === n.id))
      );
      n.zetaTarget = isHoverConnected ? 1.4 : 0.2;
    } else {
      n.zetaTarget = 1.0;
    }

    if (typeof n.zeta !== 'number') n.zeta = n.zetaTarget;
    else n.zeta = lerp(n.zeta, n.zetaTarget, 0.1);

    if (n.type === "individual") color = settings.darkMode ? h1ColorDark : h1Color;
    else if (n.type === "category") color = settings.darkMode ? h3ColorDark : h3Color;
    else if (n.type === "theme") color = settings.darkMode ? h2ColorDark : h2Color;

    fill(red(color), green(color), blue(color), alpha * beta * gamma * n.zeta);
    
    if (notCategory) {
      rect(n.x - 5, n.y - 5, 10, 10);
    } else {
      ellipse(n.x, n.y, 10, 10);
    }

    // Label Container Dimensions
    let labelX = n.x;
    let labelY = n.y;
    if (isGraph()) {
      textAlign(CENTER, CENTER);
      labelX = constrain(n.x, 75, width - 75);
      labelY = constrain(n.y - 15, 10, height - 10);
    } else if (isTable()) {
      textAlign(LEFT, CENTER);
      labelX = constrain(n.x + 15, 15, width - 75);
      labelY = constrain(n.y, 10, height - 10);
    }
    textSize(TEXT_SIZE);
    text(n.label, labelX, labelY);
  }
}

function drawNodeTip(node) {
  //let nodeDescription = node.long_description ? node.long_description : node.description;
  let nodeDescription = node.description;
  drawTooltip(nodeDescription);
}

function drawKoi() {
  noStroke();
  let l = 26;
  let w = 8;
  let tailLength = 7;
  for (let n of nodes) {
    let color = settings.darkMode ? textColorDark : textColor;
    if (n.type === "individual") color = settings.darkMode ? h1ColorDark : h1Color;
    else if (n.type === "category") color = settings.darkMode ? h3ColorDark : h3Color;
    else if (n.type === "theme") color = settings.darkMode ? h2ColorDark : h2Color;

    let sway = sin(frameCount * 0.2 + n.x * 0.01 + n.theta) * 3;
    let finAngle = sway * 0.05;

    fill(red(color), green(color), blue(color), 180);
    push();
    translate(n.x, n.y);
    // Angle for body orientation
    let angle = atan2(n.vy, n.vx);
    rotate(angle + finAngle);

    // Draw body
    ellipse(0, 0, l, w);

    // Draw side fins
    let finOffset = w * 0.7;
    fill(red(color), green(color), blue(color), 100);
    push();
    rotate(finAngle);
    ellipse(3, -finOffset, 6, 4);
    ellipse(3, finOffset, 6, 4);
    pop();

    // Draw animated tail
    // Sway frequency and offset based on time and node position for variety
    fill(red(color), green(color), blue(color), 100);
    beginShape();
    vertex(-l / 2, 0);
    vertex(-l / 2 - tailLength, sway);
    vertex(-l / 2 - tailLength, -sway);
    endShape(CLOSE);

    pop();
  }
}

function drawButtonTips() {
  const buttons = [dataModeButton, themesButton, individualButton];
  const mx = mouseX;
  const my = mouseY;

  for (let btn of buttons) {
    const bx = btn.x;
    const by = btn.y;
    const bw = btn.width;
    const bh = btn.height;

    if (mx >= bx && mx <= bx + bw && my >= by && my <= by + bh) {
      if (btn.tooltip) drawTooltip(btn.tooltip);
    }
  }
}

function drawTooltip(description) {

  let baseFill = settings.darkMode ? bgColorDark : bgColor;
  let baseStroke = settings.darkMode ? textColorDark : textColor;
  fill(red(baseFill), green(baseFill), blue(baseFill), 200);
  stroke(red(baseStroke), green(baseStroke), blue(baseStroke), 100);
  strokeWeight(1);
  rectMode(CORNER);
  textAlign(LEFT, TOP);
  textSize(TEXT_SIZE);
  let lineHeight = textAscent() + textDescent();
  let padding = 12;
  let textW = 300; // fixed maximum width
  let words = description.split(" ");
  let line = "";
  let lines = [];

  for (let word of words) {
    let testLine = line + word + " ";
    if (textWidth(testLine) > textW && line.length > 0) {
      lines.push(line);
      line = word + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line); // last line

  let boxH = lines.length * lineHeight;

  let tooltipX = mouseX + 15;
  let tooltipY = mouseY + 15;

  if (tooltipX + textW + padding * 2 > width) {
    tooltipX = width - textW - padding * 2 - 10;
  }

  if (tooltipY + boxH + padding * 2 > height) {
    tooltipY = height - boxH - padding * 2 - 10;
  }

  rect(tooltipX, tooltipY, textW + padding * 2, boxH + padding * 2 - textDescent(), 5);
  noStroke();
  fill(settings.darkMode ? 255 : 0);
  text(description, tooltipX + padding, tooltipY + padding, textW + 5, 2*boxH);
}

function drawInfo() {

  let tC = settings.darkMode ? textColorDark : textColor;
  let delta = settings.darkMode ?  -50 : 50;
  let tC_light = color(red(tC) + delta, green(tC) + delta, blue(tC) + delta);

  // Title at top left
  if (settings.showTitle) {
    textAlign(LEFT, BOTTOM);
    textSize(16);
    fill(tC);
    text("Affinity Atlas", 20, height - 20);
  }

  // Credit at bottom left
  textAlign(RIGHT, BOTTOM);
  textSize(12);
  fill(tC_light);
  text("Affinity Atlas | Version: " + VERSION + " | Ira Winder", width - 20, height - 20);

  // Affinity Threshold label and value
  if (thresholdSlider.elt.style.display !== 'none') {
    let y = thresholdSlider.y;
    textAlign(LEFT, CENTER);
    textSize(12);
    fill(tC);
    text("Affinity Threshold", 20, y - 15);
    textAlign(RIGHT, CENTER);
    text(`${round(thresholdValue * 100)}%`, 240, y - 15);
  }

  // Toggle GUI
  if (settingsData.showGUI) {
    textAlign(LEFT, TOP);
    textSize(12);
    fill(tC_light);
    text("Press 'h' to hide or show control panels", width - 440, 20);
  }
}

function mousePressed() {
  for (let n of nodes) {
    if (dist(mouseX, mouseY, n.x, n.y) < 20 && settingsData.dataMode === "graph") {
      draggingNode = n;
      offsetX = mouseX - n.x;
      offsetY = mouseY - n.y;
      n.fixed = true;
      break;
    }
  }
}

function mouseDragged() {
  if (draggingNode) {
    draggingNode.x = mouseX - offsetX;
    draggingNode.y = mouseY - offsetY;
  }
}

function keyPressed() {
  if (key === 'h' || key === 'H') {
    settingsData.showGUI = !settingsData.showGUI;
    updateGUI();
  }
  if (keyCode === SHIFT) {
    functionKey = true;
  }
}

function keyReleased() {
  functionKey = false;
}

function mouseReleased() {
  if (draggingNode) {
    if (draggingNode.type === "category" && !functionKey) {
      draggingNode.fixed = false; // Optional: keep fixed if desired
    }
    draggingNode = null;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateStyle();
  narrowCheck();
  canvasHitbox.size(width, height);
}

let canvasHitbox;
let nodeHitboxes = [];

function initHitboxes() {

  canvasHitbox = createDiv('');
  canvasHitbox.class('hitbox');
  canvasHitbox.position(0, 0);
  canvasHitbox.size(width, height);
  canvasHitbox.style('position', 'absolute');
  canvasHitbox.style('z-index', '1');
  canvasHitbox.style('background', 'transparent');
  canvasHitbox.mouseOver(() => hoveredNode = null);
  canvasHitbox.mouseOut(() => hoveredNode = null);

  nodeHitboxes = [];
  for (let n of nodes) {
    const tHitbox = createDiv('');
    tHitbox.class('hitbox');
    tHitbox.style('position', 'absolute');
    tHitbox.style('z-index', '2');
    tHitbox.style('cursor', 'pointer');
    tHitbox.style('background', 'transparent');
    tHitbox.mouseOver(() => hoveredNode = n);
    tHitbox.mouseOut(() => hoveredNode = null);

    const nHitbox = createDiv('');
    nHitbox.class('hitbox');
    nHitbox.style('position', 'absolute');
    nHitbox.style('z-index', '2');
    nHitbox.style('cursor', 'pointer');
    nHitbox.style('background', 'transparent');
    nHitbox.mouseOver(() => hoveredNode = n);
    nHitbox.mouseOut(() => hoveredNode = null);

    nodeHitboxes.push({ node: n, labelBox: tHitbox, nodeBox: nHitbox });
  }
}

function updateHitboxes() {
  for (let { node: n, labelBox: tHitbox, nodeBox: nHitbox } of nodeHitboxes) {
    if (!showing(n)) {
      tHitbox.hide();
      nHitbox.hide();
      continue;
    } else {
      tHitbox.show();
      nHitbox.show();
    }

    let labelX = n.x;
    let labelY = n.y;
    let labelX_shift = 0;
    let labelW = textWidth(n.label);
    let labelH = 25;

    if (isGraph()) {
      labelX = constrain(n.x, 75, width - 75);
      labelY = constrain(n.y - 15, 10, height - 10);
      labelX_shift = - labelW / 2;
    } else if (isTable()) {
      labelX = constrain(n.x + 15, 15, width - 75);
      labelY = constrain(n.y, 10, height - 10);
    }

    tHitbox.position(labelX + labelX_shift, labelY - labelH / 2);
    tHitbox.size(labelW, labelH);

    nHitbox.position(n.x - 10, n.y - 10);
    nHitbox.size(20, 20);
  }
}

function showing(n) {
  return (n.type === "individual" && settings.showIndividuals) ||
      (n.type === "category" && settings.showCategories) ||
      (n.type === "theme" && settings.showThemes);
}

function forcing(n) {
  return (n.type === "individual" && settings.forceIndividuals) ||
      (n.type === "category" && settings.forceCategories) ||
      (n.type === "theme" && settings.forceThemes);
}

function isTable() {
  return settingsData.dataMode === "table" || width < minGraphWidth;
}

function isGraph() {
  return settingsData.dataMode === "graph" && width >= minGraphWidth;
}

function updateActiveEmbeddings() {

  if (hoveredNode) {
    nodes.forEach(n => {
      n.activeEmbedding = 1.0;
      if (hoveredNode.type !== n.type) {
        const relevantEdge = edges.find(e =>
          ((e.from === hoveredNode.id && e.to === n.id) ||
          (e.to === hoveredNode.id && e.from === n.id))
        );
        if (relevantEdge && typeof relevantEdge.embedding === "number") {
          n.activeEmbedding = relevantEdge.embedding;
        } else {
          n.activeEmbedding = 0.1;
        }
      }
    });
  }
}

function ensureDefaultIndividualConnection() {
  categoryData.nodes.forEach(cN => {
    const connections = edges.filter(e => {
      return (
        (e.from === cN.id && individualData.nodes.some(ind => ind.id === e.to)) ||
        (e.to === cN.id && individualData.nodes.some(ind => ind.id === e.from))
      );
    });

    let maxEmbedding = -Infinity;
    let targetEdge = null;

    for (let e of connections) {
      const emb = typeof e.embedding === 'number' ? e.embedding : 0;
      if (emb >= thresholdValue) return; // valid connection found, skip adjustment
      if (emb > maxEmbedding) {
        maxEmbedding = emb;
        targetEdge = e;
      }
    }

    if (targetEdge && typeof targetEdge.embedding === 'number') {
      const delta = thresholdValue - maxEmbedding;
      targetEdge.embedding += delta;
    }
  });
}
// --- Bubble Drawing for Koi Pond ---
function drawBubbles() {
  noFill();
  stroke(200, 100);
  strokeWeight(1.5);

  // Occasionally create a bubble near a random node
  if (random() < 0.4) {
    let n = random(nodes);
    if (n) {
      bubbles.push({
        x: n.x + random(-3, 3),
        y: n.y + random(-3, 3),
        r: random(2, 6),
        a: 200,
        vy: random(-0.2, -0.5)
      });
    }
  }

  // Update and draw bubbles
  for (let i = bubbles.length - 1; i >= 0; i--) {
    let b = bubbles[i];
    b.y += b.vy;
    b.a -= 1;
    stroke(150, b.a);
    ellipse(b.x, b.y, b.r);
    if (b.a <= 0) {
      bubbles.splice(i, 1);
    }
  }
}