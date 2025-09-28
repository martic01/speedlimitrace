let move = 10;  
let loaded = false;


const load = function () {
    const car = document.querySelector('.moveload')
    if (move < 100) {
        move++;
        car.style.width = `${move}%`
    } else {
        loaded = true
    }

    return { move, loaded }
}

export { load }

