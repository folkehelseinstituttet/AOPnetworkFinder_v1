//Global variable for storing the graph strucutr
let globalGraphJson = [];
let globalMergeJson = [];
let globalUserActionsLog = [];
var cy;

//sending the user inputted values to the backend for processing
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("searchButtonAOP").addEventListener("click", function(event) {
        console.log('Pressing the button searchButtonAOP')
        event.preventDefault();

        // Global log file should be reset everytime user generates a new graph. (new session)
        globalUserActionsLog = [];

        //Data that will be sent to the backend for processing
        var formData = new FormData();

        var searchValueAop = document.getElementById("searchFieldAOP").value;
        var searchValueKe = document.getElementById("searchFieldKE").value;
        var searchValueStressor = document.getElementById("stressorDropdown").value;
        var genesChecked = document.getElementById("checkedBoxGene").checked;
        var keDegreeSelection = document.querySelector('input[name="degree"]:checked').value;

        // Add the filter checkboxes to formData
        document.querySelectorAll('#checkbox-filter input[type="checkbox"]').forEach(function(checkbox) {
            formData.append(checkbox.name, checkbox.checked ? "1" : "0");
        });

        formData.append("checkboxGene", genesChecked ? "1" : "0");
        formData.append("keDegree", keDegreeSelection);

        if (searchValueAop || searchValueKe || searchValueStressor) {

            formData.append("searchFieldAOP", searchValueAop);
            formData.append("searchFieldKE", searchValueKe);
            formData.append("stressorDropdown", searchValueStressor);

            logUserInput(formData)
            render_graph('/searchAops', formData);

        } else {
            alert("Please enter an AOP ID, KE ID or Stressor Name");
        }
    });
});

//render AOP/AOP-network given user_input
function render_graph(url_string, formData) {
    fetch(url_string, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(cyData => {
        console.log(cyData);
        globalGraphJson = cyData.elements;
        globalMergeJson = cyData['merge_options:'];
        console.log(globalMergeJson);

        const destinationDropdown = document.getElementById('keepNodeDropDown');
        const sourceDropdown = document.getElementById('loseNodeDropDown');
        const aopDropDown = document.getElementById('aopDropDown')

        loggingAopVisualized(cyData['aop_before_filter'], cyData['aop_after_filter']);
        populateMergeOptionsDropDown(destinationDropdown, sourceDropdown, globalGraphJson);
        populateHighlightAopDropDown(aopDropDown, cyData['aop_after_filter']);

        cy = cytoscape({
            container: document.getElementById('cy'),
            elements: {
                nodes: globalGraphJson.nodes,
                edges: globalGraphJson.edges
            },
            style: [
                // Conditional styling based on 'ke_type' - node color
                {
                    selector: 'node[ke_type="Molecular Initiating Event"]',
                    style: {
                        'label': 'data(id)',
                        'background-color': '#00ff00'  // Green for 'Key Event'
                    }
                },
                {
                    selector: 'node[ke_type="Adverse Outcome"]',
                    style: {
                        'label': 'data(id)',
                        'background-color': '#ff0000'  // Red for 'Adverse Outcome'
                    }
                },
                {
                    selector: 'node[ke_type="Key Event"]',
                    style: {
                        'label': 'data(id)',
                        'background-color': '#ffA500'  // Orange for 'Key Event'
                    }
                },
                {
                    selector: 'node[ke_type="genes"]',
                    style: {
                        'label': 'data(id)',
                        'background-color': '#0000FF',  // Blue for 'genes'
                        'width': 10,
                        'height': 10
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 3,
                        'line-color': '#7A7A7A',
                        'target-arrow-color': '#7A7A7A',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'target-arrow-scale': 1.5,
                        'opacity': 1
                    }
                },
                {
                    selector: 'node.highlighted, edge.highlighted',
                    style: {
                        'background-opacity': 1,
                        'border-color': 'black',
                        'border-width': 2,
                        'border-opacity': 1,
                        'text-opacity': 1 // labels are visible for highlighted nodes
                    }
                },
                {
                    selector: 'node.non-highlighted, edge.non-highlighted',
                    style: {
                        'background-opacity': 0.1,
                        'text-opacity': 0, // Hide label text
                        'border-opacity': 0
                    }
                }
            ],
            layout: {
                    name: 'cose',
                    idealEdgeLength: 100,
                    nodeRepulsion: function( node ){ return 400000; },
                    animate: true,
                    animationDuration: 1000,
                    animationEasing: undefined,
                    fit: true,
                    padding: 30,
                    randomize: false,
                    componentSpacing: 100,
                    nodeOverlap: 50,
                    nestingFactor: 5,
                    gravity: 80,
                    numIter: 1000,
                    initialTemp: 200,
                    coolingFactor: 0.95,
                    minTemp: 1.0
            }
        });
        //edges between genes set to opacity 50%
        cy.ready(function() {
            // Iterate over all edges
            cy.edges().forEach(function(edge) {
                // Check if either the source or target node has 'ke_type' equal to 'genes'
                var sourceNode = edge.source();
                var targetNode = edge.target();

                if (sourceNode.data('ke_type') === 'genes' || targetNode.data('ke_type') === 'genes') {
                    // Update the edge more translucent
                    edge.style('opacity', 0.5);
                }
            });
        });
        // Inside render_graph, after cy initialization
        setupEdgeAddition(cy);
    })
    .catch(error => console.error('Error:', error));
}

document.addEventListener('DOMContentLoaded', function() {
    // Get the modal
    var modal = document.getElementById("mergePopup");

    // Get the button that opens the modal
    var btn = document.getElementById("mergeButtonKeyEvent");

    var span = document.getElementsByClassName("close")[0];

    btn.onclick = function() {
        modal.style.display = "block";
        createMergeButtons(globalMergeJson);
    }

    span.onclick = function() {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
});

function highlightNodesById(idToHighlight) {
    // First, mark all nodes as non-highlighted
    cy.nodes().forEach(node => {
        node.addClass('non-highlighted');
    });

    // Then, find and highlight the matching nodes
    cy.nodes().filter(node => {
        // Assuming each node has an array of IDs in 'relatedIds'
        return node.data('relatedIds') && node.data('relatedIds').includes(idToHighlight);
    }).forEach(node => {
        node.removeClass('non-highlighted').addClass('highlighted');
    });
}

//Logic for merging nodes
function mergeNodes(keepNodeId, loseNodeId) {
    let keepNode = cy.getElementById(keepNodeId);
    let loseNode = cy.getElementById(loseNodeId);

    // Transfer edges from loseNode to keepNode
    loseNode.connectedEdges().forEach(edge => {
        let sourceId = edge.source().id();
        let targetId = edge.target().id();

        // Determine the new source and target for the edge
        let newSourceId = sourceId === loseNodeId ? keepNodeId : sourceId;
        let newTargetId = targetId === loseNodeId ? keepNodeId : targetId;

        // Check if an equivalent edge already exists
        let existingEdge = cy.edges().some(e => {
            return (e.source().id() === newSourceId && e.target().id() === newTargetId) ||
                   (e.source().id() === newTargetId && e.target().id() === newSourceId);
        });

        // Add a new edge if no equivalent edge exists
        if (!existingEdge) {
            cy.add({
                group: 'edges',
                data: {
                    source: newSourceId,
                    target: newTargetId
                }
            });
        }
    });

    // Remove the loseNode and update dropdown
    loseNode.remove();
    removeButtonPairs(keepNodeId, loseNodeId);
    //update globaljsonmerge
    console.log("merge options {}",globalMergeJson);
    globalMergeJson = globalMergeJson.filter(([source, target]) => source !== loseNodeId && target !== loseNodeId);

    globalGraphJson.nodes = globalGraphJson.nodes.filter(node => node.data.name !== loseNodeId);

    const destinationDropdown = document.getElementById('keepNodeDropDown');
    const sourceDropdown = document.getElementById('loseNodeDropDown');
    populateMergeOptionsDropDown(destinationDropdown,sourceDropdown,globalGraphJson);
    //regenerate the updated buttons
    createMergeButtons(globalMergeJson);
}

function createMergeButtons(mergeOptions) {
  const container = document.getElementById('dynamicButtons');
  container.innerHTML = ''; // Clear existing content if any

  mergeOptions.forEach((pair, index) => {
    // Create a div to group buttons for each option pair
    const pairDiv = document.createElement('div');
    pairDiv.className = 'merge-option-group';
    pairDiv.id = `merge-pair-${index}`;

    // Iterate over each option in the pair to create buttons
    pair.forEach((option, optionIndex) => {
      const button = document.createElement('button');
      button.textContent = option; // Set the button text
      button.className = 'merge-option-button';
      button.id = `merge-option-${index}-${optionIndex}`;

      button.setAttribute('data-node-id', option);

      // Attach the event listener to each button
      button.addEventListener('click', function() {
          // Remove 'active' class from sibling button in the same pair
          const siblingButton = pairDiv.querySelector('.merge-option-button.active');
          if (siblingButton) {
              siblingButton.classList.remove('active');
          }
          // Toggle 'active' class on clicked button
          this.classList.toggle('active');
          console.log(`Merge option selected: ${option}`);
      });

      pairDiv.appendChild(button); // Add the button to the pair's div
    });

    container.appendChild(pairDiv); // Add the pair's div to the dynamicButtons container
  });
}

function populateMergeOptionsDropDown(dropDownKeep, dropDownLose, graphJson) {

    dropDownKeep.innerHTML = '';
    dropDownLose.innerHTML = '';

    const nodes = graphJson.nodes;

    nodes.forEach(nodeItem => {
        const nodeName = nodeItem.data.name;
        const option = document.createElement('option');
        option.value = nodeName;
        option.textContent = nodeName;

        const nodeNameTwo = nodeItem.data.name;
        const optionTwo = document.createElement('option');
        optionTwo.value = nodeNameTwo;
        optionTwo.textContent = nodeNameTwo;

        dropDownKeep.appendChild(option); // Appending the new option to the dropdown
        dropDownLose.appendChild(optionTwo);
    });

    $(dropDownKeep).select2({ placeholder: "Select a node to keep" });
    $(dropDownLose).select2({ placeholder: "Select a node to merge" });

    $(dropDownKeep).val(null).trigger('change');
    $(dropDownLose).val(null).trigger('change');
}

function populateHighlightAopDropDown(dropDownAop, graphJson) {

    const aopAfterFilter = graphJson;
    console.log(aopAfterFilter);
    dropDownAop.innerHTML = '';

    aopAfterFilter.forEach(aopItem => {
        const option = document.createElement('option');
        option.value = aopItem;
        option.textContent = `AOP ${aopItem}`;

        dropDownAop.appendChild(option);
    });

    $(dropDownAop).select2({ placeholder: "Select an AOP to highlight" });

    $(dropDownAop).val(null).trigger('change');
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('processButton').addEventListener('click', function() {
        //Manuel merge process
        var keepNodeDropDown = document.getElementById("keepNodeDropDown").value;
        var loseNodeDropDown = document.getElementById("loseNodeDropDown").value;

        //if they are equal or if one of the options are empty, skip manuel merge
        if (keepNodeDropDown === '' || loseNodeDropDown === '' || keepNodeDropDown === loseNodeDropDown) {
            console.log('Either one of the options is empty or both options are equal. Skipping manual merge.');
        } else {
        // manuel merge
             mergeNodes(keepNodeDropDown, loseNodeDropDown)
        }

        //Button merge process
        const mergePairs = document.querySelectorAll('.merge-option-group');
        console.log('merge pairs:', mergePairs);

        mergePairs.forEach(pair => {
            const buttons = pair.querySelectorAll('.merge-option-button');
            let keepNodeId, loseNodeId;

            buttons.forEach(button => {
                if (button.classList.contains('active')) {
                    // This button is the keepNode
                    keepNodeId = button.getAttribute('data-node-id');
                    console.log('keepNode: ', keepNodeId);
                } else {
                    // The other button is the loseNode
                    loseNodeId = button.getAttribute('data-node-id');
                    console.log('loseNode: ', loseNodeId);
                }
            });

            //button merge
            if (keepNodeId && loseNodeId) {
                console.log(`Merging: Keep ${keepNodeId}, Lose ${loseNodeId}`);
                mergeNodes(keepNodeId, loseNodeId); // Perform the merge logic
                //log merging
                loggingMergeActions(keepNodeId, loseNodeId);
            }
        });
    });
});

function removeButtonPairs(keepNodeId, loseNodeId) {
    // Remove the pair directly involved in the merge
    document.querySelectorAll(`button[data-node-id="${keepNodeId}"], button[data-node-id="${loseNodeId}"]`)
        .forEach(button => button.parentNode.remove());

    document.querySelectorAll(`button[data-node-id="${keepNodeId}"], button[data-node-id="${loseNodeId}"]`)
        .forEach(button => {
            if (button.parentNode && button.parentNode.classList.contains('merge-option-group')) {
                button.parentNode.remove();
            }
        });
}

function removeButtonPairsManuelMerge(loseNodeId) {
    document.querySelectorAll(`button[data-node-id="${loseNodeId}"]`).forEach(button => {
        if (button.parentNode && button.parentNode.classList.contains('merge-option-group')) {
            button.parentNode.remove();
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('exportToCytoscape').addEventListener('click', function() {
        const now = new Date();
        const formattedDate = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}`;

        const graphmlContent = generateGraphML(cy);
        const blob = new Blob([graphmlContent], {type: 'application/graphml+xml'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = 'AOP_' + formattedDate + '.graphml';
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        logCytoscape();
    });
});

function generateGraphML(cy) {
    let graphml = '<?xml version="1.0" encoding="UTF-8"?>\n<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n';
    graphml += '<key id="keType" for="node" attr.name="ke_type" attr.type="string"/>\n';
    graphml += '<key id="label" for="node" attr.name="label" attr.type="string"/>\n';
    graphml += '<key id="value" for="node" attr.name="value" attr.type="string"/>\n';
    graphml += '<key id="name" for="node" attr.name="name" attr.type="string"/>\n';
    graphml += '<key id="keInAop" for="node" attr.name="ke_in_aop" attr.type="string"/>\n';
    graphml += '<graph id="G" edgedefault="undirected">\n';

    // Add nodes with attributes
    cy.nodes().forEach((node) => {
        const data = node.data();
        graphml += `<node id="${data.id}">\n`;
        graphml += `<data key="keType">${data.ke_type}</data>\n`;
        graphml += `<data key="label">${data.label}</data>\n`;
        graphml += `<data key="value">${data.value}</data>\n`;
        graphml += `<data key="name">${data.name}</data>\n`;

        const keInAopString = JSON.stringify(data.ke_in_aop || []);
        graphml += `<data key="keInAop">${keInAopString}</data>\n`;
        graphml += '</node>\n';
    });

    // Add edges
    cy.edges().forEach((edge) => {
        const data = edge.data();
        graphml += `<edge source="${data.source}" target="${data.target}"></edge>\n`;
    });

    graphml += '</graph>\n</graphml>';
    return graphml;
}

$(document).ready(function() {
    fetch('/get_stressors')
        .then(response => response.json())
        .then(data => {
            const formattedData = data.map(stressor => ({
                id: stressor,
                text: stressor
            }));

            $('#stressorDropdown').select2({
                placeholder: "Search for a stressor",
                allowClear: true,
                data: formattedData
            });
        })
        .catch(error => console.error('Fetch error:', error));

    $('#stressorDropdown').val(null).trigger('change');
});

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('saveButtonLog').addEventListener('click', function() {
        if (globalUserActionsLog.length === 0){
            console.log("Log file is empty")
        }else {
            saveLogToFile();
        }
    });
});

function logUserAction(actionDescription) {
    const timestamp = new Date().toISOString();
    globalUserActionsLog.push(`${timestamp}: ${actionDescription}`);
}

function logHeaderName(logDescriptions) {
    globalUserActionsLog.push(`${logDescriptions}`)
}

function logCytoscape() {
    logHeaderName("Export to Cytoscape");
    logUserAction("Graph has been saved in the '.graphml' format.");
}

function logUserInput(formData) {
    logHeaderName("USER INPUTS\n")

    if (formData.get("searchFieldAOP")){
        console.log("logging Aop field: {}", formData.get("searchFieldAOP"));
        logUserAction(formData.get("searchFieldAOP"));
    }

    if (formData.get("searchFieldKE")){
        console.log("logging KE field: {}", formData.get("searchFieldKE"));
        logUserAction(formData.get("searchFieldKE"));
    }

    if (formData.get("stressorDropdown")){
        console.log("logging Stressor field: {}", formData.get("stressorDropdown"));
        logUserAction(formData.get("stressorDropdown"));
    }

    logHeaderName("\n")

    if (formData.get("checkedBoxGene") === '1'){
        console.log("logging Stressor field: {}", formData.get("stressorDropdown"));
        logUserAction("Genes enabled");
    }else{
        console.log("logging Stressor field: {}", formData.get("stressorDropdown"));
        logUserAction("Genes disabled");
    }

    logHeaderName("\nFilters Enabled\n")
    if (formData.get("checkboxDevelopment") === '1'){
        console.log("logging checkboxDevelopment field: {}", formData.get("checkboxDevelopment"));
        logUserAction("OECD Under Development");
    }

    if (formData.get("checkboxEndorsed") === '1'){
        console.log("logging checkboxEndorsed field: {}", formData.get("checkboxEndorsed"));
        logUserAction("OECD WPHA Endorsed");
    }

    if (formData.get("checkboxReview") === '1'){
        console.log("logging checkboxReview field: {}", formData.get("checkboxReview"));
        logUserAction("OECD Under Review");
    }

    if (formData.get("checkboxApproved") === '1'){
        console.log("logging checkboxApproved field: {}", formData.get("checkboxApproved"));
        logUserAction("OECD EAGMST Approved");
    }
}

function loggingMergeActions(keepNode,removeNode){
    logHeaderName("\n")
    logUserAction(`Merging the KE node: ${removeNode} into the KE: ${keepNode}`)
}

function loggingAopVisualized(aop_before_filter, aop_after_filter){
    logHeaderName("\nAOPs before filtering\n")
    logUserAction(aop_before_filter)
    logHeaderName("\nAOPs after filtering (AOP VISUALIZED)\n")
    logUserAction(aop_after_filter)
}

function saveLogToFile() {
    const logContent = globalUserActionsLog.join('\n');
    const blob = new Blob([logContent], {type: "text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "UserActionsLog.txt";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    //Clear the log array after downloading the file.
    globalUserActionsLog = [];
}

// Function to toggle labels
function toggleGeneLabels(showLabels) {
    if (showLabels) {
        // Show labels for genes
        cy.style().selector('node[ke_type="genes"]').style('label', 'data(id)').update();
    } else {
        // Hide labels for genes
        cy.style().selector('node[ke_type="genes"]').style('label', '').update();
    }
}

// Handle checkbox change event
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('toggleLabels').addEventListener('change', function(e) {
        toggleGeneLabels(this.checked);
    });
});

function highlightGraphForAop(aopId) {
    // Reset highlights for nodes and edges
    cy.elements().removeClass('highlighted').addClass('non-highlighted');

    if (aopId && aopId !== "none") {
        // First, highlight the relevant nodes
        const highlightedNodes = cy.nodes().filter(function(node) {
            const keInAop = node.data('ke_in_aop');
            return keInAop && keInAop.includes(aopId);
        }).removeClass('non-highlighted').addClass('highlighted');

        highlightedNodes.connectedEdges().removeClass('non-highlighted').addClass('highlighted');

        cy.edges().not(highlightedNodes.connectedEdges()).addClass('non-highlighted');
    } else {
        // reset
        cy.elements().removeClass('non-highlighted');
    }
}



$(document).ready(function() {
    $('#aopDropDown').select2({
        placeholder: "Select an AOP to highlight",
        allowClear: true
    });

    $('#aopDropDown').on('select2:select', function(e) {
        var selectedAop = $(this).val();
        console.log("Selected AOP", selectedAop);
        highlightGraphForAop(selectedAop);
    });

    $('#aopDropDown').on('select2:unselect', function(e) {
        highlightGraphForAop(null);
    });
});

function setupEdgeAddition(cy) {
    let firstNodeId = null; // to keep track of the first node clicked
    let shiftKeyDown = false; // to track whether the Shift key is held down

    document.addEventListener('keydown', function(event) {
      if(event.key === 'Shift') {
        shiftKeyDown = true;
      }
    });

    document.addEventListener('keyup', function(event) {
      if(event.key === 'Shift') {
        shiftKeyDown = false;
      }
    });

    cy.on('tap', 'node', function(evt){
      if(shiftKeyDown) {
        let nodeId = evt.target.id();
        if(firstNodeId === null) {
          firstNodeId = nodeId;
        } else {
          cy.add([
            { group: "edges", data: { source: firstNodeId, target: nodeId } }
          ]);
          firstNodeId = null; // Reset for next edge addition
        }
      }
    });
}


document.addEventListener('click', function(event) {
    console.log(event.target); // See which element was clicked
});