
//Validation of the input boxes using number or numbers separeted with comma.
function validateAopOrKeInput(input){
    var regex = /^[0-9]+(,[0-9]+)*$/;

    return regex.test(input)
}