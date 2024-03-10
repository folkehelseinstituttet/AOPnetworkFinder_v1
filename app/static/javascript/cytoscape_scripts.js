// cytoscape_script.js

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

document.getElementById('searchFieldAOP').addEventListener('paste', function(event) {

    var pasteData = event.clipboardData || window.clipboardData;
    var pastedText = pasteData.getData('text');

    var validatedText = pastedText.replace(/[^0-9,]/g, '')
                                 .replace(/,,+/g, ',')
                                 .replace(/^,/, '');

    if (validatedText !== pastedText) {
        event.preventDefault();

        event.target.value = validatedText;
    }
});

document.getElementById('searchFieldKE').addEventListener('keypress', function(event) {
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

document.getElementById('searchFieldKE').addEventListener('paste', function(event) {

    var pasteData = event.clipboardData || window.clipboardData;
    var pastedText = pasteData.getData('text');

    var validatedText = pastedText.replace(/[^0-9,]/g, '')
                                 .replace(/,,+/g, ',')
                                 .replace(/^,/, '');

    if (validatedText !== pastedText) {
        event.preventDefault();

        event.target.value = validatedText;
    }
});