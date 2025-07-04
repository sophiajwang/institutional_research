// Global variables
let nodes = [];
let edges = [];
let steps = [];
let selectedStep = null;
let selectedEdges = new Set(); // Track which edges are checked
let nodePositions = new Map();
let hoveredNode = null;
let hoveredEdge = null;
let tooltip;
let stepCounter;

// 2D Camera controls
let viewX = 0, viewY = 0;
let targetViewX = 0, targetViewY = 0;
let zoomLevel = 1;
let targetZoom = 1;
let isDragging = false;
let isShiftPressed = false;
let lastMouseX = 0, lastMouseY = 0;

// Layout parameters for better spacing
let nodeSpacing = 150;
let groupRadius = 300;

// Color scheme (SDS style)
let bgColor, bgColorDark, textColor, textColorDark;
let h1Color, h1ColorDark, h2Color, h2ColorDark, h3Color, h3ColorDark;
let darkMode = true;

// Edge display management
let edgeOffsets = new Map();

function preload() {
    // Load data directly - embedded in this function since external files aren't available
    loadAllJsonFiles();
    // loadDataDirectly();
}

async function loadJsonFile(filename) {
    try {
        const response = await fetch(filename);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(`Error loading ${filename}:`, error);
        return [];
    }
}

// Option 3: Load all files at once and return an object with all data
function loadAllJsonFiles() {
    const files = ['nodes.json', 'edges.json'];
    const dataKeys = ['nodes', 'edges'];
    
    try {
        const promises = files.map(file => loadJsonFile(file));
        const results = Promise.all(promises);
        
        const data = {};
        dataKeys.forEach((key, index) => {
            data[key] = results[index];
        });

        console.log(data.nodes);
        console.log(data.edges);
        // console.log(data.steps);
        
        nodes = data.nodes;
        edges = data.edges;
        steps = data.steps;
        return data;
    } catch (error) {
        console.error('Error loading JSON files:', error);
        return {
            nodes: [],
            edges: [],
            documents: [],
            steps: []
        };
    }
}

function loadDataDirectly() {
    console.log('🔧 Loading data directly...');
    
    // Complete nodes data from the documents
    nodes = [
        {"node_id": 0, "node_name": "Mervin Kelly", "node_description": "Executive Vice President", "node_parent_id": 1, "node_grandparent_id": 2},
        {"node_id": 1, "node_name": "Bell Labs Administration", "node_description": "Executive", "node_parent_id": 2, "node_grandparent_id": null},
        {"node_id": 2, "node_name": "Bell Labs", "node_description": "AT&T research arm", "node_parent_id": null, "node_grandparent_id": null},
        {"node_id": 3, "node_name": "AT&T", "node_description": "Management and Holding Company of the Bell System", "node_parent_id": null, "node_grandparent_id": null},
        {"node_id": 4, "node_name": "William Shockley", "node_description": "Lead theorist of solid-state research group", "node_parent_id": 5, "node_grandparent_id": 2},
        {"node_id": 5, "node_name": "Solid-State Research Group", "node_description": "Research team focusing on solid-state physics", "node_parent_id": 2, "node_grandparent_id": null},
        {"node_id": 6, "node_name": "Walter Houser Brattain", "node_description": "Experimental Physicist", "node_parent_id": 5, "node_grandparent_id": 2},
        {"node_id": 7, "node_name": "John Bardeen", "node_description": "Theoretical Physicist", "node_parent_id": 5, "node_grandparent_id": 2},
        {"node_id": 8, "node_name": "Robert Gibney", "node_description": "Electrochemist", "node_parent_id": 5, "node_grandparent_id": 2},
        {"node_id": 9, "node_name": "Gerald Pearson", "node_description": "Experimental Physicist", "node_parent_id": 5, "node_grandparent_id": 2},
        {"node_id": 10, "node_name": "Frank Jewett", "node_description": "Bell Labs Chairman", "node_parent_id": 1, "node_grandparent_id": 2},
        {"node_id": 11, "node_name": "Oliver Ellsworth Buckley", "node_description": "Bell Labs President", "node_parent_id": 1, "node_grandparent_id": 2},
        {"node_id": 12, "node_name": "Ralph Bown", "node_description": "Vice President of Research at Bell Labs, (later) Research Director at Bell Labs", "node_parent_id": 1, "node_grandparent_id": 2},
        {"node_id": 13, "node_name": "Bell Labs Lawyers", "node_description": "Legal team handling patents and intellectual property", "node_parent_id": 2, "node_grandparent_id": null},
        {"node_id": 14, "node_name": "Government", "node_description": "Government regulatory bodies", "node_parent_id": 15, "node_grandparent_id": null},
        {"node_id": 15, "node_name": "External", "node_description": "Agents and institutions external to Bell System", "node_parent_id": null, "node_grandparent_id": null},
        {"node_id": 16, "node_name": "Military", "node_description": "Military organizations and defense contractors", "node_parent_id": 15, "node_grandparent_id": null},
        {"node_id": 17, "node_name": "Competitors", "node_description": "Competing telephony communications technologies companies and later, electronics companies", "node_parent_id": 15, "node_grandparent_id": null},
        {"node_id": 18, "node_name": "Academia", "node_description": "Foremost science and engineering academic-research organizations in the country", "node_parent_id": 15, "node_grandparent_id": null},
        {"node_id": 19, "node_name": "Public Domain", "node_description": "Public knowledge and open research", "node_parent_id": 15, "node_grandparent_id": null},
        {"node_id": 20, "node_name": "Jack Morton", "node_description": "Lead of transistor development team, (later) Vice President of Device Development", "node_parent_id": 21, "node_grandparent_id": 2},
        {"node_id": 21, "node_name": "Transistor Development Team", "node_description": "Engineering team focused on transistor development and manufacturing", "node_parent_id": 2, "node_grandparent_id": null},
        {"node_id": 22, "node_name": "Gordon Teal", "node_description": "Metallurgist", "node_parent_id": 21, "node_grandparent_id": 2},
        {"node_id": 23, "node_name": "Morgan Sparks", "node_description": "Chemist, (later) Director of Solid State Research at Bell Labs, Vice President of Electronics Technology, Director of Sandia National Laboratories", "node_parent_id": 21, "node_grandparent_id": 2},
        {"node_id": 24, "node_name": "Western Electric", "node_description": "AT&T manufacturing arm", "node_parent_id": null, "node_grandparent_id": null}
    ];

    // Complete edges data from the documents
    edges = [
        {"interaction_id": 0, "from_nodes": [2], "to_nodes": [3], "interaction_description": "Initial cost of $417,000 (mostly salaries) billed to AT&T. Under Bell System protocol, work at Bell Labs had to be billed to either AT&T, Western Electric, or the local operating companies like Pacific Telephone.", "step_id": 0, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 1, "from_nodes": [2], "to_nodes": [2], "interaction_description": "The existing 'knowledge reservoir' included silicon and germanium of p- and n-type controller impurity developed in the late 1930s during the war by Bell Labs metallurgists Scaff and Ohl.", "step_id": 0, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 2, "from_nodes": [0], "to_nodes": [2], "interaction_description": "Combines chemists, physicists, metallurgists, and engineers -- theoreticians with experimentalists -- to work on new electronic technologies.", "step_id": 1, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 3, "from_nodes": [0], "to_nodes": [2], "interaction_description": "Assigns Shockley as research group leader, mandating work that constitutes 'invention,' settling for nothing less than 'starting a new field.'", "step_id": 1, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 4, "from_nodes": [0], "to_nodes": [4, 6, 7, 8, 9], "interaction_description": "Formed solid-state research group.", "step_id": 1, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 5, "from_nodes": [4, 6, 7, 8, 9], "to_nodes": [0], "interaction_description": "Freedom to say 'no.'", "step_id": 1, "bidirectional": 0, "unused": 1, "violated": 0},
        {"interaction_id": 6, "from_nodes": [4, 7], "to_nodes": [6], "interaction_description": "Theorists worked on blackboards, attempting to 'see,' at a subatomic level, the surfaces and interiors of semiconductor crystals. The experimentalists tested the theorists' blackboard predictions at their lab benches with carefully calibrated instruments.", "step_id": 1, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 7, "from_nodes": [6], "to_nodes": [4, 7], "interaction_description": "Theorists would try to interpret the data that emerged from the experimentalists' attempts to investigate the theorists' original ideas.", "step_id": 1, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 8, "from_nodes": [0, 10, 11], "to_nodes": [2], "interaction_description": "Designed Murray Hill (1942). Building 1 shaped like an H with long corridors meant to intersect, forcing researchers to intersect. The building was designed after a university instead of a factory to avoid fixed geographical delineations between departments and increase interchange and close contact (between physics and mathematics, research and development). Further, technical staff would often have both laboratories and small offices but located in different corridors.", "step_id": 1, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 9, "from_nodes": [5], "to_nodes": [5], "interaction_description": "Shockley formulated a theory called the 'field effect.' The team attempted to apply an electrical current to the surface of a semiconductor slice to increase the conductivity, resulting in an amplifier. But it didn't. The observable effects were at least 1,500 times smaller than predicted.", "step_id": 2, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 10, "from_nodes": [7], "to_nodes": [5], "interaction_description": "Bardeen suggested 'surface states' on semiconducting materials, postulating that when a charge was applied to a semiconductor, the electrons on its surface were not free to move the same way the electrons in the interior might, creating a frozen barrier between any outside voltage and the material's interior.", "step_id": 3, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 11, "from_nodes": [5], "to_nodes": [5], "interaction_description": "Laboratory spaces were flexible and could be rearranged (in 'weekend changes') as the character of work changed. The 6-ft laboratory module was outfitted with pipes and all needs of experimentalist (e.g. compressed air, distilled water, steam, gas, vacuum, hydrogen, oxygen, nitrogen, both DC and AC power).", "step_id": 3, "bidirectional": 0, "unused": 1, "violated": 0},
        {"interaction_id": 12, "from_nodes": [6], "to_nodes": [8], "interaction_description": "Explore whether applying an electrolyte, a solution that conducts electricity, would help cut through the surface states barrier. It did.", "step_id": 4, "bidirectional": 1, "unused": 0, "violated": 0},
        {"interaction_id": 13, "from_nodes": [6, 7], "to_nodes": [4], "interaction_description": "Informed Shockley of their progress.", "step_id": 4, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 14, "from_nodes": [6], "to_nodes": [7], "interaction_description": "Bardeen suggested a geometry for building a solid-state amplifier, involving a drop of electrolyte fluid, and a 'point-contact' wire piercing the drop and touching the surface of the semiconductor slice. Brattain and a lab assistant began building a rough prototype, a slab of silicon with a metal point pushed down into it, resulting in a slight power gain.", "step_id": 4, "bidirectional": 1, "unused": 0, "violated": 0},
        {"interaction_id": 15, "from_nodes": [6], "to_nodes": [7], "interaction_description": "Bardeen suggested switching from silicon to n-type germanium. Together, they used a gold foil wrapped arrowhead to split the V-shaped wire into two separate wires ('points') to push down on the top face of the germanium. The narrow space could create an amplifier. Brattain connected the top ends of each of the points to separate batteries, forming a simple circuits. After two weeks of experimentation, on December 16, this configuration had yielded significant net amplification and power gain.", "step_id": 4, "bidirectional": 1, "unused": 0, "violated": 0},
        {"interaction_id": 16, "from_nodes": [6, 7], "to_nodes": [12], "interaction_description": "Demonstrated to Bell Labs management, notably Ralph Bown. As with all important entries in the scientists' notebooks, Brattain's entry ended with a signature and verification by third parties: 'Read & understood by G. L. Pearson Dec. 24, 1947 and H. R. Moore Dec. 24, 1947.'", "step_id": 5, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 17, "from_nodes": [6, 7], "to_nodes": [0], "interaction_description": "Mervin Kelly was not invited to the initial demonstration, but briefed one month later. He believed in granting autonomy to researchers and had not asked about or apprised of Bardeen and Brattain's work. At Bell Labs, there was a tendency to confine important developments to middle management for a purgatorial period, lest word of a breakthrough reach upper management too soon. It was common practice for supervisor to move any big news up a step, a week or two at a time.", "step_id": 5, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 18, "from_nodes": [4], "to_nodes": [6, 7], "interaction_description": "Shockley's Christmas was a holiday of torment. For the next three weeks, Shockley kept up a furious pace. By late January he had come up with a theory, and a design, for a transistor that both looked and functioned differently than Bardeen and Brattain's. Theirs had been described as the point-contact transistor; Shockley's was to be known as the junction transistor. Rather than two metal points jammed into a sliver of semiconducting material, it was a solid block made from two pieces of n-type germanium and a nearly microscopic slice of p-type germanium in between.", "step_id": 6, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 19, "from_nodes": [4], "to_nodes": [6, 7], "interaction_description": "Supervisor authorized to guide, not interfere with, the people he managed, and to absolutely never compete with underlings.", "step_id": 6, "bidirectional": 0, "unused": 0, "violated": 1},
        {"interaction_id": 20, "from_nodes": [6, 7], "to_nodes": [13], "interaction_description": "Bardeen and Brattain began working with Bell Labs lawyers on assembly application.", "step_id": 7, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 21, "from_nodes": [12], "to_nodes": [2], "interaction_description": "Ralph Bown establishes Bell Labs' confidential technology group with the code name 'Surface States Phenomena' to better understand use cases for the amplifier. He brings together the best electronic engineers across the lab.", "step_id": 7, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 22, "from_nodes": [2], "to_nodes": [15], "interaction_description": "Doubts on how long the Labs could maintain secrecy or should. Executives doubted that they could keep the transistor rights to themselves once the device became public knowledge.", "step_id": 7, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 23, "from_nodes": [3], "to_nodes": [14], "interaction_description": "AT&T's monopoly was maintained at the government's pleasure with the understanding that its scientific work was in the public's interest. Any capitalization on the transistor could invite antitrust government regulators.", "step_id": 7, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 24, "from_nodes": [3], "to_nodes": [2], "interaction_description": "Funding came in large part from what was essentially a built-in 'R&D tax' on telephone service. In 1974, more than 4 cents of every dollar received by AT&T went to R&D at Bell Labs and Western Electric.", "step_id": 0, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 25, "from_nodes": [2], "to_nodes": [16], "interaction_description": "From the start, Labs executives agreed to show the device to the military before any public debut, but wanted to resist any orders to contain the device as a military secret.", "step_id": 7, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 26, "from_nodes": [2], "to_nodes": [16], "interaction_description": "Philosophically, Bell Labs saw itself and the military as servicing needs and producing public goods.", "step_id": 7, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 27, "from_nodes": [2], "to_nodes": [17], "interaction_description": "Sharing technology with competitors could be positive, by profiting from patent licensing fees, having a head start, and later reaping the rewards from outside engineers improving functionality.", "step_id": 7, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 28, "from_nodes": [6, 7], "to_nodes": [18], "interaction_description": "Bardeen and Brattain's letter to the Physical Review announced their breakthrough.", "step_id": 8, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 29, "from_nodes": [4, 12], "to_nodes": [18], "interaction_description": "First public press conference where the device debuted as a replacement for the vacuum tube.", "step_id": 8, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 30, "from_nodes": [2], "to_nodes": [18], "interaction_description": "Harvard, Purdue, Stanford, Cornell, and a half dozen other schools to request a sample of the device for their own laboratories. MIT's Electrical Engineering department's Jay Forrester, wrote to Bown in July suggesting that transistors could be used for high-speed digital computing apparatus.", "step_id": 8, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 31, "from_nodes": [2], "to_nodes": [17], "interaction_description": "Letters from electronics companies (RCA, Motorola, Westinghouse, host of other radio and television manufacturers) came pouring in requesting a sample.", "step_id": 8, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 32, "from_nodes": [2], "to_nodes": [3], "interaction_description": "Finding a market for the device was not a problem. Even if nobody else bought them, 'certainly the vast Bell empire itself would form an adequate market.'", "step_id": 8, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 33, "from_nodes": [0], "to_nodes": [20], "interaction_description": "Assigned development lead", "step_id": 9, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 34, "from_nodes": [21], "to_nodes": [21], "interaction_description": "Morton's team, in conjunction with the Labs' metallurgists, fabricated five thousand working germanium transistors.", "step_id": 9, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 35, "from_nodes": [21], "to_nodes": [5, 16, 18], "interaction_description": "Transistors given as complimentary samples. Nearly a thousand were used at Bell Labs to study the properties of germanium.", "step_id": 9, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 36, "from_nodes": [22], "to_nodes": [6, 7], "interaction_description": "During the summer of 1951, Jack Morton's team had readied Bardeen and Brattain's point-contact transistor for large-scale production.", "step_id": 10, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 37, "from_nodes": [22, 23], "to_nodes": [4], "interaction_description": "Advances in crystal pulling allowed Teal and his colleague Morgan Sparks to grow junction transistors for Shockley, the essential missing ingredient that made his idea possible (before, trapped in theory with no way of fabricating).", "step_id": 10, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 38, "from_nodes": [22, 23, 4], "to_nodes": [18], "interaction_description": "Shockley, Sparks and Teal published results of 'grown-junction transistor' in the Physical Review, 'p−n Junction Transistors.'", "step_id": 10, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 39, "from_nodes": [4], "to_nodes": [19], "interaction_description": "The manufacture of the device roughly coincided with Shockley's demonstration of the first junction transistors at a public unveiling. The newest invention was hailed as clearly superior to the point-contact transistor in terms of its efficiency and performance (it used only one-millionth of the power of a typical vacuum tube).", "step_id": 10, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 40, "from_nodes": [20], "to_nodes": [24], "interaction_description": "Readied point-contact transistor for large-scale production.", "step_id": 11, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 41, "from_nodes": [2], "to_nodes": [17], "interaction_description": "Licensed transistor technology for $25,000. Free exception for companies that wanted to use the devices for hearing aids (as deference to AT&T founder Alexander Graham Bell).", "step_id": 11, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 42, "from_nodes": [20, 9], "to_nodes": [17], "interaction_description": "In 1951 and 1952, Bell Labs sponsored multi-day conventions at Murray Hill, attended by hundreds of scientists and engineers from around the world. These conventions included the likes of Jack Kilby (who realized the first integrated circuit at Texas Instruments) and the founding engineers at Sony. At the conventions, Jack Morton gave the guests a brief overview of the transistor and Gerald Pearson followed with brief tutorial on transistor theory. Over the next two days, the guests were then given in-depth presentations on different types of transistors and their applications.", "step_id": 11, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 43, "from_nodes": [2], "to_nodes": [18], "interaction_description": "Exchange through conferences, professional societies, seminars.", "step_id": 11, "bidirectional": 0, "unused": 1, "violated": 0},
        {"interaction_id": 44, "from_nodes": [2], "to_nodes": [14], "interaction_description": "Bell Labs maintained an open door policy following immense political pressure to appease governmental regulators.", "step_id": 11, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 45, "from_nodes": [2], "to_nodes": [19], "interaction_description": "The transistor burnished Bell Labs' reputation as a national resource (AT&T's monopoly resulted in large-scale scientific and public benefits).", "step_id": 11, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 46, "from_nodes": [14], "to_nodes": [3], "interaction_description": "After the 1956 Anti-Trust decree, AT&T was obligated to license all existing patents royalty-free.", "step_id": 12, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 47, "from_nodes": [3], "to_nodes": [17, 19], "interaction_description": "AT&T's licensing policy shaped by antitrust policy remains as one of the most unheralded contributions to economic development, possibly far exceeding the Marshall Plan in terms of the wealth generation capability it established abroad and in the United States.", "step_id": 12, "bidirectional": 0, "unused": 0, "violated": 0},
        {"interaction_id": 48, "from_nodes": [4, 22], "to_nodes": [17], "interaction_description": "The combination of liberal licensing policies and people such as Gordon Teal leaving to start Texas Instruments ICs and William Shockley leaving to start Shockley Semiconductor in Palo Alto started the growth of Silicon Valley.", "step_id": 12, "bidirectional": 0, "unused": 0, "violated": 0}
    ];

    // Complete steps data from the documents
    steps = [
        {"step_id": 0, "step_description": "Mervin Kelly signed off on Case 38,139: unified approach to all of our solid state problems.", "date": "06.21.1945", "phase": "research"},
        {"step_id": 1, "step_description": "Kelly signed off on Case 38,139: unified approach to all of our solid state problems. Initial cost was $417,000 mostly salaries, billed to AT&T.", "date": "07.1945 -- 10.1945", "phase": "research"},
        {"step_id": 2, "step_description": "Failures in demonstrating the 'field effect'.", "date": "06.1945 -- 01.1946", "phase": "research"},
        {"step_id": 3, "step_description": "Concept of surface states emerges.", "date": "Spring 1946", "phase": "research"},
        {"step_id": 4, "step_description": "Cutting through the surface states barrier. The 'magic month' begins.", "date": "11.1947", "phase": "research"},
        {"step_id": 5, "step_description": "Amplifier demo for Bell Labs management demonstrated ~18x speaker amplification.", "date": "12.23.1947", "phase": "research"},
        {"step_id": 6, "step_description": "Shockley makes a transgression; he is spurred into conceptualizing the initial junction transistor after unable to partake in the point-contact transistor's patent (and unable to patent the 'field effect').", "date": "01.1948 -- 02.1948", "phase": "research"},
        {"step_id": 7, "step_description": "Preparing for patent application.", "date": "1948", "phase": "research"},
        {"step_id": 8, "step_description": "Filing patent application and first public demonstration.", "date": "06.1948", "phase": "research"},
        {"step_id": 9, "step_description": "Transitioned to development team. For all its publicity, the new point-contact transistor was useless as a practical device. Proving laboratory feasibility was not difficult, but learning how to make them by the hundreds or thousands, and of sufficient uniformity to be interchangeable and reliable, was another problem.", "date": "06.1948 -- 06.1949", "phase": "development"},
        {"step_id": 10, "step_description": "Gordon Teal's significant advances in crystal pulling readied the transistor for manufacture with Western Electric.", "date": "1949 -- 1951", "phase": "development"},
        {"step_id": 11, "step_description": "Manufacturing and resulting diffusion of transistor technology.", "date": "1951 -- 1952", "phase": null},
        {"step_id": 12, "step_description": "AT&T Anti-Trust Decree.", "date": "1949 (filed) -- 1956 (settled)", "phase": null}
    ];

    console.log('✅ Data loaded successfully:');
    console.log(`   📊 Nodes: ${nodes.length}`);
    console.log(`   🔗 Edges: ${edges.length}`);
    console.log(`   📅 Steps: ${steps.length}`);
    
    // Validate data integrity
    validateData();
}

function setup() {
    let canvas = createCanvas(windowWidth - 350, windowHeight);
    canvas.parent('canvas-container');
    
    tooltip = select('#tooltip');
    stepCounter = select('#step-counter');
    
    // Initialize colors (SDS style)
    initColors();
    
    initializeVisualization();
    createStepList();
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

function validateData() {
    console.log('🔍 Validating data integrity...');
    
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

function generateNodePositions() {
    console.log('Generating 2D node positions...');
    
    if (!Array.isArray(nodes) || nodes.length === 0) {
        console.error('Cannot generate positions: nodes is empty or not an array');
        return;
    }
    
    // Organize nodes by hierarchy for better 2D layout
    const rootNodes = nodes.filter(n => !n.node_parent_id);
    const parentNodes = nodes.filter(n => n.node_parent_id && !n.node_grandparent_id);
    const childNodes = nodes.filter(n => n.node_grandparent_id);
    
    console.log('Root nodes:', rootNodes.length, 'Parent nodes:', parentNodes.length, 'Child nodes:', childNodes.length);
    
    // Position root nodes in center with good spacing
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
    
    console.log('Generated 2D positions for', nodePositions.size, 'nodes');
}

function calculateEdgeOffsets() {
    edgeOffsets.clear();
    
    // Group edges by from-to node pairs
    const edgeGroups = new Map();
    
    edges.forEach(edge => {
        edge.from_nodes.forEach(fromId => {
            edge.to_nodes.forEach(toId => {
                // Skip self-loops (circular edges)
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
    
    // Assign offsets to edges with multiple connections
    edgeGroups.forEach((edgeList, key) => {
        if (edgeList.length > 1) {
            edgeList.forEach((edgeInfo, index) => {
                const offset = (index - (edgeList.length - 1) / 2) * 30;
                const edgeKey = `${edgeInfo.edge.interaction_id}-${edgeInfo.fromId}-${edgeInfo.toId}`;
                edgeOffsets.set(edgeKey, offset);
            });
        }
    });
}

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
    
    // Edge types
    let edgeTypes = createDiv(`
        <div style="margin: 4px 0;"><span style="color: #78B478;">━━━</span> Active Edge</div>
        <div style="margin: 4px 0;"><span style="color: #999999;">━━━</span> Inactive Edge</div>
        <div style="margin: 4px 0;"><span style="color: #FF6464;">┅┅┅</span> Violated Edge</div>
        <div style="margin: 4px 0;"><span style="color: #666666;">━━━</span> Unused Edge</div>
        <div style="margin: 4px 0;"><span style="color: #78B478;">⭕</span> Self-Loop</div>
    `);
    edgeTypes.parent(legend);
    
    // Node types
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

function createStepList() {
    const stepList = select('#step-list');
    
    // Group steps by phase
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
                    
                    // Create checkbox with event prevention
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
            
            stepDiv.mousePressed(() => selectStep(step.step_id));
            stepDiv.parent(stepList);
        });
    });
}

function draw() {
    background(darkMode ? bgColorDark : bgColor);
    
    // Smooth camera interpolation
    viewX = lerp(viewX, targetViewX, 0.05);
    viewY = lerp(viewY, targetViewY, 0.05);
    zoomLevel = lerp(zoomLevel, targetZoom, 0.05);
    
    // Apply 2D transformations
    push();
    translate(width/2, height/2);
    scale(zoomLevel);
    translate(viewX, viewY);
    
    // Draw all edges
    drawAllEdges();
    
    // Draw nodes
    drawNodes();
    
    pop();
    
    // Handle mouse interaction
    handleMouseInteraction();
}

function drawNodes() {
    nodes.forEach(node => {
        const pos = nodePositions.get(node.node_id);
        if (!pos) return;
        
        // Determine node color and visibility
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
            isRelevantNode = true;
            // Default coloring by hierarchy
            if (node.node_grandparent_id) {
                nodeColor = h1Color; // Individual level - cyan
            } else if (node.node_parent_id) {
                nodeColor = h2Color; // Group level - green  
            } else {
                nodeColor = h3Color; // Organization level - gray
            }
        }
        
        // Hover effect - show for all nodes when no step selected, only relevant when step selected
        if (hoveredNode === node.node_id) {
            if (selectedStep === null || isRelevantNode) {
                nodeColor = color(255, 200, 100);
                alpha = 255;
            }
        }
        
        fill(red(nodeColor), green(nodeColor), blue(nodeColor), alpha);
        stroke(255, alpha * 0.5);
        strokeWeight(1);
        
        // Draw 2D rectangle nodes
        rectMode(CENTER);
        rect(pos.x, pos.y, 12, 12);
        
        // Node label
        fill(red(textColor), green(textColor), blue(textColor), alpha);
        textAlign(CENTER, CENTER);
        textSize(10);
        text(node.node_name, pos.x, pos.y - 20);
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
    const fromPos = nodePositions.get(fromId);
    const toPos = nodePositions.get(toId);
    
    if (!fromPos || !toPos) return;
    
    // Handle self-loops (circular edges)
    if (fromId === toId) {
        drawCircularEdge(edge, fromPos);
        return;
    }
    
    // Calculate offset for multiple edges between same nodes
    const edgeKey = `${edge.interaction_id}-${fromId}-${toId}`;
    const offset = edgeOffsets.get(edgeKey) || 0;
    
    // Determine edge color and style
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
    
    // Special cases for active edges
    if (isActiveEdge && shouldShow) {
        if (edge.violated === 1) {
            edgeColor = color(255, 100, 100);
            strokeW = 2;
            alpha = Math.max(alpha, 180);
        } else if (edge.unused === 1) {
            alpha = Math.min(alpha, 80);
        }
    }
    
    // Hover effect
    if (hoveredEdge === edge.interaction_id && (selectedStep === null || shouldShow)) {
        edgeColor = color(255, 255, 100);
        strokeW = 3;
        alpha = 255;
    }
    
    if (alpha <= 0) return;
    
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

function drawCircularEdge(edge, nodePos) {
    // Draw circular edge around the node with improved curve like the diagram
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
    
    // Draw improved circular loop like the diagram - starting from node perimeter
    const radius = 25; // Radius of the loop
    const nodeRadius = 6; // Half the node size (12/2)
    
    // Calculate starting point on the node perimeter (top-right)
    const startAngle = -PI/4; // Start at top-right of node
    const startX = nodePos.x + cos(startAngle) * nodeRadius;
    const startY = nodePos.y + sin(startAngle) * nodeRadius;
    
    // Create control points for a smooth curve that loops around
    const loopCenterX = nodePos.x + radius;
    const loopCenterY = nodePos.y - radius;
    
    if (edge.violated === 1 && isActiveEdge) {
        // Draw broken circular line with bezier curves
        const segments = 8;
        for (let i = 0; i < segments; i += 2) {
            const t1 = i / segments;
            const t2 = (i + 1) / segments;
            
            // Calculate points on the circular path
            const angle1 = startAngle + t1 * TWO_PI;
            const angle2 = startAngle + t2 * TWO_PI;
            
            const x1 = nodePos.x + cos(angle1) * (nodeRadius + radius * 0.7);
            const y1 = nodePos.y + sin(angle1) * (nodeRadius + radius * 0.7);
            const x2 = nodePos.x + cos(angle2) * (nodeRadius + radius * 0.7);
            const y2 = nodePos.y + sin(angle2) * (nodeRadius + radius * 0.7);
            
            line(x1, y1, x2, y2);
        }
    } else {
        // Draw smooth circular loop starting and ending at node perimeter
        beginShape();
        noFill();
        
        // Create a smooth loop using bezier curve
        const controlRadius = radius * 1.2;
        bezier(
            startX, startY, // Start point on node perimeter
            nodePos.x + controlRadius, nodePos.y - controlRadius, // Control point 1
            nodePos.x + controlRadius, nodePos.y + controlRadius, // Control point 2  
            startX, startY  // End point (same as start)
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

function handleMouseInteraction() {
    // Transform mouse coordinates to world space
    let worldMouseX = (mouseX - width/2) / zoomLevel - viewX;
    let worldMouseY = (mouseY - height/2) / zoomLevel - viewY;
    
    let newHoveredNode = null;
    let newHoveredEdge = null;
    
    if (mouseX < width - 350) {
        // Check nodes - allow hover for all nodes when no step selected, relevant nodes when step selected
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
        
        // Check edges if not hovering a node
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
                    // Allow hovering on greyed out edges too
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
                                    // Calculate offset for multiple edges
                                    const edgeKey = `${edge.interaction_id}-${fromId}-${toId}`;
                                    const offset = edgeOffsets.get(edgeKey) || 0;
                                    
                                    let distToLine;
                                    if (offset !== 0) {
                                        // Check distance to curved line
                                        distToLine = distanceToCurve(worldMouseX, worldMouseY, fromPos, toPos, offset);
                                    } else {
                                        // Check distance to straight line
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

function distanceToCurve(px, py, fromPos, toPos, offset) {
    // Calculate control point for the curve
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
    selectedEdges.clear(); // Clear selected edges when changing steps
    
    // Update UI
    selectAll('.step-item').forEach(item => item.removeClass('active'));
    if (selectedStep !== null) {
        selectAll('.step-item').forEach((item, index) => {
            if (steps[index] && steps[index].step_id === selectedStep) {
                item.addClass('active');
            }
        });
        
        updateStepCounter();
        
        // Pan to relevant nodes/edges
        panToStepElements(selectedStep);
        
        // Uncheck all checkboxes
        selectAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked(false);
        });
    } else {
        stepCounter.html('Step: None Selected');
    }
}

function updateStepCounter() {
    if (selectedStep !== null) {
        const step = steps.find(s => s.step_id === selectedStep);
        if (step) {
            // Create navigation controls
            const prevButton = selectedStep > 0 ? `<button onclick="selectStep(${selectedStep - 1})" style="background: #5DC0D9; border: none; color: white; padding: 2px 6px; margin-right: 5px; border-radius: 2px; cursor: pointer;">←</button>` : '';
            const nextButton = selectedStep < steps.length - 1 ? `<button onclick="selectStep(${selectedStep + 1})" style="background: #5DC0D9; border: none; color: white; padding: 2px 6px; margin-left: 5px; border-radius: 2px; cursor: pointer;">→</button>` : '';
            
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

function panToStepElements(stepId) {
    // Find all nodes involved in this step
    const stepEdges = edges.filter(e => e.step_id === stepId);
    const involvedNodeIds = new Set();
    
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
            // Remove "Interaction" header, just show the description
            tooltip.html(edge.interaction_description);
            tooltip.style('display', 'block');
            tooltip.position(mouseX + 10, mouseY - 10);
        }
    } else {
        tooltip.style('display', 'none');
    }
}

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

function keyReleased() {
    if (keyCode === SHIFT) {
        isShiftPressed = false;
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
        
        isDragging = true;
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }
}

function mouseDragged() {
    if (isDragging && mouseX < width - 350) {
        const deltaX = mouseX - lastMouseX;
        const deltaY = mouseY - lastMouseY;
        
        if (isShiftPressed) {
            // Rotate view (shift + drag) - just for visual effect in 2D
            const sensitivity = 0.005;
            targetViewX += deltaX * sensitivity * 100;
            targetViewY += deltaY * sensitivity * 100;
        } else {
            // Move/pan view (regular drag)
            const sensitivity = 1.0 / zoomLevel;
            targetViewX += deltaX * sensitivity;
            targetViewY += deltaY * sensitivity;
        }
        
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }
}

function mouseReleased() {
    isDragging = false;
}

function windowResized() {
    resizeCanvas(windowWidth - 350, windowHeight);
}