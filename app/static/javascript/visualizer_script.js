//sending the user inputted values to the backend for processing
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("searchButtonAOP").addEventListener("click", function(event) {
        console.log('Pressing the button searchButtonAOP')
        event.preventDefault();

        var searchValue = document.getElementById("searchFieldAOP").value;
        if (searchValue) {

            var form = document.getElementById("aopSearchForm");
            var formData = new FormData(form);

            render_graph('/searchAops', formData)

        } else {
            alert("Please enter an AOP ID");
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
        var cy = cytoscape({
            container: document.getElementById('cy'),
            elements: cyData,
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