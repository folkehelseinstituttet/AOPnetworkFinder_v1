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

        loggingAopVisualized(cyData['aop_before_filter'], cyData['aop_after_filter']);

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
                        'background-color': '#0000FF'  // Blue for 'genes'
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
                        'target-arrow-scale': 1.5
                    }
                }
            ],
            layout: {
                name: 'grid',
            }
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

    // Remove the loseNode
    loseNode.remove();
    removeButtonPairs(keepNodeId, loseNodeId);
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

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('processButton').addEventListener('click', function() {
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
    graphml += '<graph id="G" edgedefault="undirected">\n';

    // Add nodes with attributes
    cy.nodes().forEach((node) => {
        const data = node.data();
        graphml += `<node id="${data.id}">\n`;
        graphml += `<data key="keType">${data.ke_type}</data>\n`;
        graphml += `<data key="label">${data.label}</data>\n`;
        graphml += `<data key="value">${data.value}</data>\n`;
        graphml += `<data key="name">${data.name}</data>\n`;
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

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('input[name="options"]').forEach((radio) => {
    radio.addEventListener('change', function() {
      alert(`Option ${this.value} selected.`);
    });
  });
});

