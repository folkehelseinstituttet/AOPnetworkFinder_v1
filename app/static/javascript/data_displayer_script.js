//sending the user inputted values to the backend for processing
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('submitBtn').addEventListener('click', function(event) {
        console.log('Pressing the button searchButtonAOP')
        event.preventDefault();

        var formData = new FormData();

        var searchValueAops = document.getElementById("searchFieldAOPs").value;
        var searchValueKes = document.getElementById("searchFieldKEs").value;

        formData.append("searchFieldAOPs", searchValueAops);
        formData.append("searchFieldKEs", searchValueKes);

        document.querySelectorAll('#aop_checkboxes input[type="checkbox"]').forEach(function(checkbox) {
            formData.append(checkbox.name, checkbox.checked ? "1" : "0");
        });

        document.querySelectorAll('#ke_checkboxes input[type="checkbox"]').forEach(function(checkbox) {
            formData.append(checkbox.name, checkbox.checked ? "1" : "0");
        });

        render_table('/data-extraction-submit', formData)
    });
});

function render_table(url_string, formData){
    fetch(url_string, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const table = document.getElementById('dynamicTable');

        // Clear existing table head and body before appending new ones
        table.innerHTML = '';

        // Extract column headers from jsonData.head.vars
        const columns = data.head.vars;

        // Recreate the table head
        let thead = table.createTHead();
        let row = thead.insertRow();
        columns.forEach(header => {
            let th = document.createElement('th');
            th.innerText = header;
            row.appendChild(th);
        });

        // Recreate the table body
        let tbody = document.createElement('tbody'); // Create a new tbody element
        table.appendChild(tbody); // Append the new tbody to the table
        data.results.bindings.forEach(binding => {
            let row = tbody.insertRow();
            columns.forEach(column => {
                let cell = row.insertCell();
                // Insert cell value if available, otherwise insert an empty string
                cell.innerText = binding[column] && binding[column].value ? binding[column].value : "";
            });
        });
    })
    .catch(error => console.error('Error:', error));
}

document.getElementById('saveCsvBtn').addEventListener('click', function() {

        const table = document.getElementById('dynamicTable');
        let csvContent = "data:text/csv;charset=utf-8,";

        // Iterate over each row in the table
        for (let i = 0; i < table.rows.length; i++) {
            let row = [], cols = table.rows[i].querySelectorAll("td, th");

            // Iterate over each column in the row
            cols.forEach(function(col) {
                row.push(col.innerText);
            });

            csvContent += row.join(",") + "\r\n";
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "table_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
});

document.getElementById('saveExcelBtn').addEventListener('click', function() {
    const table = document.getElementById('dynamicTable');
    let tableData = [];

    fetch('/save-excel', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({data: tableData})
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'table_data.xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const inputAOPs = document.getElementById('searchFieldAOPs');
    const inputKEs = document.getElementById('searchFieldKEs');
    const aopCheckboxes = document.querySelectorAll('#aop_checkboxes input[type="checkbox"]');
    const keCheckboxes = document.querySelectorAll('#ke_checkboxes input[type="checkbox"]');

    function clearKE() {
        inputKEs.value = '';
        keCheckboxes.forEach(checkbox => checkbox.checked = false);
    }

    function clearAOP() {
        inputAOPs.value = '';
        aopCheckboxes.forEach(checkbox => checkbox.checked = false);
    }

    inputAOPs.addEventListener('input', clearKE);
    aopCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', clearKE);
    });

    inputKEs.addEventListener('input', clearAOP);
    keCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', clearAOP);
    });
});