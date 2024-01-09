// cytoscape_script.js

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



