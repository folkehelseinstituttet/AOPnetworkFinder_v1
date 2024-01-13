//sending the user inputted values to the backend for processing
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("searchButtonAOP").addEventListener("click", function(event) {
        console.log('Pressing the button searchButtonAOP')
        event.preventDefault();
        //Data that will be sent to the backend for processing
        var formData = new FormData();

        var searchValue = document.getElementById("searchFieldAOP").value;
        var genesChecked = document.getElementById("checkedBoxGene").checked;

        // Add the filter checkboxes to formData
        document.querySelectorAll('#checkbox-filter input[type="checkbox"]').forEach(function(checkbox) {
            formData.append(checkbox.name, checkbox.checked ? "1" : "0");
        });

        formData.append("checkboxGene", genesChecked ? "1" : "0");

        if (searchValue) {

            formData.append("searchFieldAOP", searchValue);

            render_graph('/searchAops', formData);

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