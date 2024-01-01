// cytoscape_script.js

// Button event handler for searching AOPs and AOP-networks
document.getElementById('searchButtonAOP').addEventListener('click', function() {
    // Logic related to Cytoscape

    //testing the graph displaying functionality, this is only meant to see if we can display the graph in the
    //Cytoscape window. Wont be used in the final version.
    var cy = cytoscape({
        container: document.getElementById('cy'), // container to render in

        elements: [ // list of graph elements to start with
            // nodes
            { data: { id: 'a' } },
            { data: { id: 'b' } },
            { data: { id: 'c' } },
            // edges
            {
                data: {
                    id: 'ab',
                    source: 'a',
                    target: 'b'
                }
            },
            {
                data: {
                    id: 'bc',
                    source: 'b',
                    target: 'c'
                }
            }
        ],

        style: [ // the stylesheet for the graph
            {
                selector: 'node',
                style: {
                    'background-color': '#666',
                    'label': 'data(id)'
                }
            },

            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'line-color': '#ccc',
                    'target-arrow-color': '#ccc',
                    'target-arrow-shape': 'triangle'
                }
            }
        ],

        layout: {
            name: 'grid',
            rows: 1
        }
    });
});

// Button event handler for exporting to Cytoscape
document.getElementById('exportToCytoscape').addEventListener('click', function() {
    // Logic related to Exporting to Cytoscape
});

//search field AOP
document.getElementById('searchFieldAOP').addEventListener('keypress', function(event) {
    var charCode = event.which || event.keyCode; // Get the ASCII character code

    // Allow only digits and commas
    if ((charCode < 48 || charCode > 57) && charCode !== 44) {
        event.preventDefault(); // Prevent characters that are not digits or commas
    }

    var currentValue = event.target.value;

    // Prevent starting with a comma and having multiple consecutive commas
    if (charCode === 44 && (currentValue.length === 0 || currentValue.endsWith(','))) {
        event.preventDefault();
    }
});

//search field KE
document.getElementById('searchFieldKe').addEventListener('keypress', function(event) {
    var charCode = event.which || event.keyCode; // Get the ASCII character code

    // Allow only digits and commas
    if ((charCode < 48 || charCode > 57) && charCode !== 44) {
        event.preventDefault(); // Prevent characters that are not digits or commas
    }

    var currentValue = event.target.value;

    // Prevent starting with a comma and having multiple consecutive commas
    if (charCode === 44 && (currentValue.length === 0 || currentValue.endsWith(','))) {
        event.preventDefault();
    }
});


