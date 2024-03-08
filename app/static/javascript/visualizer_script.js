//Global variable for storing the graph strucutr
let globalGraphJson = [];
let globalMergeJson = [];
let globalUserActionsLog = [];
let allowHidePopup = false; // Flag to control the hiding of the popup
var cy;

let isColorBlindMode = false; // Track the color mode state
const defaultColors = {
    "Molecular Initiating Event": "#00A79D",
    "Adverse Outcome": "#ED1C24",
    "Key Event": "#F7941D",
    "genes": "#27AAE1",
};

const colorBlindColors = {
    "Molecular Initiating Event": "#40E0D0",
    "Adverse Outcome": "#FF00FF",
    "Key Event": "#007FFF",
    "genes": "#708090",
};

let lastClickTime = 0;
const doubleClickThreshold = 300; // Milliseconds

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
                        'shape': 'square',
                        'label': 'data(id)',
                        'background-color': '#00A79D'  // Green for 'Key Event'
                    }
                },
                {
                    selector: 'node[ke_type="Adverse Outcome"]',
                    style: {
                        'shape': 'triangle',
                        'label': 'data(id)',
                        'background-color': '#ED1C24'  // Red for 'Adverse Outcome'
                    }
                },
                {
                    selector: 'node[ke_type="Key Event"]',
                    style: {
                        'label': 'data(id)',
                        'background-color': '#F7941D'  // Orange for 'Key Event'
                    }
                },
                {
                    selector: 'node[ke_type="genes"]',
                    style: {
                        'label': 'data(id)',
                        'background-color': '#27AAE1',  // Blue for 'genes'
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
                    selector: 'node.highlighted',
                    style: {
                        'background-opacity': 1,
                        'border-color': 'black',
                        'border-width': 2,
                        'border-opacity': 1,
                        'text-opacity': 1 // labels are visible for highlighted nodes
                    }
                },
                {
                    selector: 'node.non-highlighted',
                    style: {
                        'background-opacity': 0.3,
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
        toggleGeneLabels(document.getElementById('toggleLabels').checked);
        if (isColorBlindMode){
            applyColorScheme(colorBlindColors);
        }

        cy.on('click', 'node', function(evt) {
            const currentTime = new Date().getTime();
            if (currentTime - lastClickTime <= doubleClickThreshold) {
                const node = evt.target;
                let contentHtml = `<strong>Node Data: (${node.data().ke_type})</strong><br><div><table>`;

                if (node.data().ke_type === 'genes') {
                    // For Gene nodes
                    let connectedKEs = node.connectedEdges().map(edge => {
                        // Check connected nodes
                        const connectedNode = edge.source().id() === node.id() ? edge.target() : edge.source();
                        if (connectedNode.data().ke_type !== 'genes') {
                            // Format as clickable link
                            let keId = connectedNode.data('ke_identifier').split('/').pop();
                            return `<a href="${connectedNode.data('ke_identifier')}" target="_blank">${keId}</a>`;
                        }
                    }).filter(ke => ke !== undefined).join(', '); // Filter out undefined and join

                    contentHtml += `<tr><td>Name:</td><td> ${node.data('name') || 'N/A'}</td></tr>`;
                    contentHtml += `<tr><td>Connected KE:</td><td>${connectedKEs || 'N/A'}</td></tr>`;
                } else {

                    let upstreamKEs = [];
                    let downstreamKEs = [];
                    let connectedGenes = [];
                    let ke_aop_urls = node.data('ke_aop_urls') || [];

                    // Determine upstream, downstream KEs, and connected genes
                    node.connectedEdges().forEach(edge => {
                        const targetNode = edge.target();
                        const sourceNode = edge.source();

                        if (sourceNode.id() === node.id()) { // downstream
                            downstreamKEs.push(targetNode.data('ke_identifier'));
                        } else { //upstream
                            if (sourceNode.data().ke_type === 'genes') {
                                connectedGenes.push(sourceNode.data('name'));
                            } else {
                                upstreamKEs.push(sourceNode.data('ke_identifier'));
                            }
                        }
                    });

                    // no upstream/downstream or connected genes
                    if (upstreamKEs.length === 0) upstreamKEs.push('N/A');
                    if (downstreamKEs.length === 0) downstreamKEs.push('N/A');
                    if (connectedGenes.length === 0) connectedGenes.push('N/A');

                    // Generating the clickable KE in AOPs links
                    let keAopLinksHtml = ke_aop_urls.map(url => {
                        const match = url.match(/\/(\d+)$/);
                        if (match) {
                            const aopId = match[1];
                            return `<a href="${url}" target="_blank">${aopId}</a>`; // Create clickable link
                        }
                        return ''; // URL does not match the expected format
                    }).join(', '); // Join all urls

                    const processKEs = (keArray) => {
                        // Check if the array is empty or contains only 'N/A'
                        if (keArray.length === 0 || (keArray.length === 1 && keArray[0] === 'N/A')) {
                            return 'N/A'; // Return 'N/A' as plain text, not a link
                        } else {
                            return keArray.map(ke => {
                                let keId = ke.split('/').pop();
                                return `<a href="${ke}" target="_blank">${keId}</a>`;
                            }).join(', ');
                        }
                    };

                    contentHtml += `<tr><td>ID: </td><td> ${node.data('label') || 'N/A'}</td></tr>`;
                    contentHtml += `<tr><td>Name: </td><td> ${node.data('name') || 'N/A'}</td></tr>`;
                    const url = node.data('ke_url') ? `<a href="${node.data('ke_url')}" target="_blank">${node.data('ke_url')}</a>` : 'N/A';
                    contentHtml += `<tr><td>KE Url: </td><td> ${url}</td></tr>`;
                    contentHtml += `<tr><td>Downstream KE:</td><td>${processKEs(downstreamKEs) || 'N/A'}</td></tr>`;
                    contentHtml += `<tr><td>Upstream KE:</td><td>${processKEs(upstreamKEs) || 'N/A'}</td></tr>`;
                    contentHtml += `<tr><td>Connected Genes: </td><td> ${connectedGenes.join(', ') || 'N/A'}</td></tr>`;
                    if (keAopLinksHtml) {
                        contentHtml += `<tr><td>KE in AOPs:</td><td>${keAopLinksHtml}</td></tr>`;
                    }
                }
                contentHtml += `</table></div>`;
                document.getElementById('nodeInfo').innerHTML = contentHtml;
                document.getElementById('nodePopup').style.display = 'block';

                allowHidePopup = false;
                setTimeout(() => { allowHidePopup = true; }, 50);
            }
            lastClickTime = currentTime;
        });

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
    // Mark all nodes as non-highlighted initially
    cy.nodes().forEach(node => {
        node.removeClass('highlighted').addClass('non-highlighted');
    });

    // Then, find and highlight the matching nodes
    cy.nodes().filter(node => {
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
    // Initially classify all nodes and edges as non-highlighted
    cy.elements().addClass('non-highlighted').removeClass('highlighted');

    if (aopId && aopId !== "none") {
        const highlightedNodes = cy.nodes().filter(node => node.data('ke_in_aop') && node.data('ke_in_aop').includes(aopId));
        highlightedNodes.removeClass('non-highlighted').addClass('highlighted');

        cy.edges().forEach(edge => {
            const sourceHighlighted = edge.source().hasClass('highlighted');
            const targetHighlighted = edge.target().hasClass('highlighted');

            if (sourceHighlighted && targetHighlighted) {
                edge.style('opacity', '1');
            } else {
                edge.style('opacity', '0.1');
            }
        });
    } else {
        // If no aopId is provided or "none" is selected, remove all highlighting
        cy.elements().removeClass('highlighted non-highlighted');
        cy.elements().style('opacity', '1');
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

    //$('#aopDropDown').on('select2:unselect', function(e) {
    //    highlightGraphForAop(null);
    //});

    // Custom clear button functionality
    $('#clearSelection').on('click', function() {
        $('#aopDropDown').val(null).trigger('change');
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

document.addEventListener('click', function(e) {
    var popup = document.getElementById('nodePopup');
    if (popup && popup.style.display === 'block' && !popup.contains(e.target) && allowHidePopup) {
        popup.style.display = 'none';
    }
});

document.getElementById('nodePopup').addEventListener('click', function(e) {
    e.stopPropagation(); // Prevent click inside popup from propagating
});

function applyColorScheme(colors) {
    cy.nodes().forEach(node => {
        const keType = node.data('ke_type');
        const newColor = colors[keType] || node.style('background-color'); // Use current color as fallback
        node.style('background-color', newColor);
    });
}

//document.getElementById('colorBlindModeToggle').addEventListener('click', function() {
//
//    if (cy){
//        //graph initialized, call applyColorchema method
//        isColorBlindMode = !isColorBlindMode; // Toggle the state
//
//        if (isColorBlindMode) {
//            applyColorScheme(colorBlindColors); // color blind mode
//            this.style.backgroundColor = "#AADDAA";
//            this.style.color = "#000000";
//        } else {
//            applyColorScheme(defaultColors); // Revert to default colors
//            this.style.backgroundColor = "";
//            this.style.color = "";
//        }
//    } else {
//    //graph not initialized, change only state and button color.
//        isColorBlindMode = !isColorBlindMode //toggle the state
//        if (isColorBlindMode) {
//            this.style.backgroundColor = "#AADDAA";
//            this.style.color = "#000000";
//        } else {
//            this.style.backgroundColor = "";
//            this.style.color = "";
//        }
//    }
//});

function colorBlindModeToggle() {
    if (cy){
        //graph initialized, call applyColorchema method
        isColorBlindMode = !isColorBlindMode; // Toggle the state

        if (isColorBlindMode) {
            applyColorScheme(colorBlindColors); // color blind mode
            this.style.backgroundColor = "#AADDAA";
            this.style.color = "#000000";
        } else {
            applyColorScheme(defaultColors); // Revert to default colors
            this.style.backgroundColor = "";
            this.style.color = "";
        }
    } else {
    //graph not initialized, change only state and button color.
        isColorBlindMode = !isColorBlindMode //toggle the state
        if (isColorBlindMode) {
            this.style.backgroundColor = "#AADDAA";
            this.style.color = "#000000";
        } else {
            this.style.backgroundColor = "";
            this.style.color = "";
        }
    }
}

document.getElementById('saveIcon').addEventListener('click', function() {

    const fileName = prompt("Enter the filename with extension (.png or .jpg):", "aop.png");

    if (fileName) {
        let dataUrl;

        if (fileName.endsWith('.png')) {
            dataUrl = cy.png({bg: "white"});
        } else if (fileName.endsWith('.jpg')) {
            dataUrl = cy.jpg({bg: "white"});
        } else {
            alert("Invalid file extension. Please use .png or .jpg only.");
            return;
        }

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        console.log("Save operation cancelled or invalid filename.");
    }
});

document.getElementById('colorBlindNotActive').addEventListener('click', function() {
    this.style.display = 'none';
    document.getElementById('colorBlindActive').style.display = 'block';
    // Enable color blind mode
    colorBlindModeToggle()
});

document.getElementById('colorBlindActive').addEventListener('click', function() {
    this.style.display = 'none';
    document.getElementById('colorBlindNotActive').style.display = 'block';
    // Disable color blind mode
    colorBlindModeToggle()
});

document.getElementById('saveStyleIcon').addEventListener('click', function() {
    const choice = prompt("Type '1' to download the Cytoscape Desktop Standard Style Template or '2' to download the Cytoscape Desktop Color-Blind Style Template:");

    if (choice === null) {
        return;
    }

    let fileName;
    switch(choice) {
        case '1':
            fileName = 'Cytoscape_AOPnetworkFinder_Style.xml';
            break;
        case '2':
            fileName = 'Cytoscape_AOPnetworkFinder_Style_Color_Blind.xml';
            break;
        default:
            alert("Invalid choice. Please enter '1' or '2'.");
            return;
    }

    window.location.href = `/download/${fileName}`;
});

document.addEventListener('click', function(event) {
    console.log(event.target); // See which element was clicked
});