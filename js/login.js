document.addEventListener('DOMContentLoaded',() =>{

const form = document.querySelector('form');

form.addEventListener('submit',(event) =>{
    event.preventDefault();
    const mt = document.getElementById('username').value;
    const pss = document.getElementById('password').value;
    console.log(mt,pss)


});
});