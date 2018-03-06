/*
    global $
*/

let peliculasLocal;

let usuariosLocal;

let nEntradas = 0;

let tusAsientos = [];

let idPeliculaActual;

$(document).ready(function () {
    if (localStorage.peliculas == undefined) {
        loadStorage(peliculas, 'peliculas');
    }
    peliculasLocal = downFromLocalStorage('peliculas');
    $('#asientos').hide();
    $('#pago').hide();
    $('#completado').hide();
    createMainFilms();
    loadSpinner();

    // $('#divStep1').hide();
    // $('#asientos').show();
    // $('#pago').show();

    cargaFilasAsientos();
    $('.svgAsiento').on('click', function() {
        if (!$(this).hasClass('ocupado')) {
            if (!$(this).hasClass('tuSitio') && tusAsientos.length < nEntradas && nEntradas > 0) {
                $(this).addClass('tuSitio');
                this.classList.forEach(element => {
                    let array = element.split('-');
                    if (array[0] == 'coord') {
                        array.shift();
                        tusAsientos.push(array);
                    }
                });
            } else {
                $(this).removeClass('tuSitio');
                this.classList.forEach(element => {
                    let array = element.split('-');
                    if (array[0] == 'coord') {
                        array.shift();
                        tusAsientos.forEach((element, index) => {
                            if (array.join('-') == element.join('-')) {
                                tusAsientos.splice(index, 1);
                            }
                        });
                    }
                });
            }
        }
    });
});

function createMainFilms() {
    let $mainDiv = $('#plantilla');

    for (const key in peliculasLocal) {
        if (peliculasLocal.hasOwnProperty(key)) {
            const element = peliculasLocal[key];
            let $htmlOutput = $(
                `<div class="card pelicula z-depth-5">
                    <img class="card-img-top" src="${element.image}" alt="Cartel principal de la película ${element.titulo}" data-film="${key}" data-toggle="modal" data-target="#reserveModal" tabIndex="0" />
                    <div class="card-body">
                        <h5 class="card-title" tabIndex="0">${element.titulo}</h5>
                        <p class="card-text" tabIndex="0">${element.sinopsis}</p>
                        <button class="btn btn-primary text-white" data-film="${key}" data-toggle="modal" data-target="#reserveModal" tabIndex="0" aria-label="Votar a la película ${element.titulo}">Ver más</button>
                    </div>
                </div>`
            );
            $mainDiv.append($htmlOutput);
        }
    }
}

function cargaFilasAsientos() {
    let cont = 0;
    let $array = $('.svgAsiento');
    for (let i = 8; i >= 0; i--) {
        for (let j = 0; j < 11; j++) {
            $array.eq(cont).addClass(`coord-${i}-${j}`);
            cont++;
        }
    }
}

function loadStorage(element, name) {
    localStorage.setItem(name, JSON.stringify(element));
}

function downFromLocalStorage(item) {
    return JSON.parse(localStorage.getItem(item));
}

$('#reserveModal').on('show.bs.modal', function (event) {
    let button = $(event.relatedTarget); // Button that triggered the modal
    let recipient = button.data('film'); // Extract info from data-film attribute
    let modal = $(this);
    let data = peliculasLocal[recipient];

    // Atributo aria-labelledby del modal
    modal.attr('aria-label', `Ventana para reservar una entrada a la película ${data.titulo}.`);
    // Título del modal
    modal.find('.modal-title').text(data.titulo);
    // src de imagen principal
    modal.find('img').attr('src', data.image);
    // alt de la imagen principal
    modal.find('img').attr('alt', `Cartel principal de la película ${data.titulo}`);
    // Año de la película
    modal.find('#anioModal').text(data.anio);
    // Duración de la película
    modal.find('#duracionModal').text(data.duracion);
    // Dirección de la película
    modal.find('#direccionModal').text(data.direccion);
    // Sinopsis de la película
    modal.find('#sinopsisModal').text(data.sinopsis);
    // Atributo data-film del botón Votar
    modal.find('.btn-primary').attr('data-film', recipient);
    // Horarios
    fillHorarios(modal, data, recipient);
});

function fillHorarios(modal, data, recipient) {
    let array = modal.find('.tab-pane');
    for (let i = 0; i < array.length; i++) {
        const div = array[i];
        $(div).empty();
        const horario = data.horarios[div.id];
        for (const key in horario) {
            if (horario.hasOwnProperty(key)) {
                const element = horario[key];
                $(div).append(`<h1><span class="badge badge-info" data-film="${recipient}" data-fecha="${div.id}" data-sesion="${key}" onclick=goToAsientos(this);>${key}</span></h1>`);
            }
        }
    }
}

function goToAsientos(param) {
    $('#reserveModal').modal('hide');
    $('#divStep1').hide();
    $('#asientos').show();
    nextStepButtons('step1', 'step2');
    loadPageAsientos(param);
    loadSpinner();
}

function nextStepButtons(prevStep, nextStep) {
    $(`#${prevStep}`).parent().parent().removeClass('btn-outline-info');
    $(`#${prevStep}`).parent().parent().addClass('btn-secondary');
    $(`#${prevStep}`).parent().parent().addClass('disabled');
    $(`#${nextStep}`).parent().parent().removeClass('disabled')
    $(`#${nextStep}`).parent().parent().removeClass('btn-secondary')
    $(`#${nextStep}`).parent().parent().addClass('btn-outline-info');
}

function loadPageAsientos(param) {
    $(document).scrollTop(0);
    idPeliculaActual = $(param).data('film');
    let data = peliculasLocal[idPeliculaActual];
    $('.imageFilm').attr('src', data.image);
    $('.tituloFilm').text(data.titulo);
    let fecha = $(param).data('fecha');
    let sesion = $(param).data('sesion');
    $('.fechaFilm').text(fecha);
    $('.sesionFilm').text(sesion);
    
    loadAsientosOcupados(data, fecha, sesion);
    panzoom($('#svgAsientos')[0]);
}

function loadAsientosOcupados(data, fecha, sesion) {
    let ocupados = data.horarios[fecha][sesion];
    ocupados.forEach(element => {
        $(`.coord-${element.join('-')}`).addClass('ocupado');
    });
}

$('.svgAsiento').hover(
    function() {
        if (!$(this).hasClass('ocupado') && !$(this).hasClass('tuSitio')) {
            $(this).attr('style', 'fill:green;');
        }
    },
    function() {
        if (!$(this).hasClass('ocupado') && !$(this).hasClass('tuSitio')) {
            $(this).attr('style', 'fill:white;');
        }
    }
);

function decrementAsiento() {
    if (nEntradas <= 0) {
        nEntradas = 0;
    } else {
        nEntradas--;
    }
    printnEntradas();
}

function incrementAsiento() {
    if (nEntradas >= 10) {
        nEntradas = 10;
    } else {
        nEntradas++;
    }
    printnEntradas();
}

function printnEntradas() {
    $('#nEntradas').text(nEntradas);
    $('#subtotal').text(nEntradas * 5);
}

$('#goToPago').on('click', function() {
    $(document).scrollTop(0);
    $('#asientos').hide();
    $('#pago').show();
    nextStepButtons('step2', 'step3');
    loadPagePago();
    loadSpinner();
});

function loadPagePago() {
    $('.nEntradas').text(nEntradas);
    $('.total').text(nEntradas * 5);
    tusAsientos.forEach(element => {
        $('.filaInfo').append(`<p>Fila: ${element[0] + 1}, Butaca: ${element[1] + 1}</p>`)
    });
}

$('#formPago').on('submit', function(event) {
    event.preventDefault();
    event.stopPropagation();
    let name = $('#name').val();
    let email = $('#email').val();
    let telephone = $('#telephone').val();
    let film = $('.tituloFilm').eq(0).text();
    let fecha = $('.fechaFilm').eq(0).text();
    let sesion = $('.sesionFilm').eq(0).text();
    registerUser(name, email, telephone, film, fecha, sesion, tusAsientos);
    applyAsiento(fecha, sesion, tusAsientos);
    goToCompletado();
    loadSpinner();
});

function registerUser(name, email, telephone, film, fecha, sesion, butaca) {
    usersJson = [];
    if (localStorage.usuarios != undefined) {
        usersJson = downFromLocalStorage('usuarios');
    }
    usersJson[usersJson.length] = {
        nombre: name,
        email: email,
        telefono: telephone,
        pelicula: film,
        fecha: fecha,
        sesion: sesion,
        butaca: butaca,
    };
    loadStorage(usersJson, 'usuarios');
}

function applyAsiento(fecha, sesion, butaca) {
    butaca.forEach(function(element) {
        peliculasLocal[idPeliculaActual].horarios[fecha][sesion].push(element);
    }, this);
    loadStorage(peliculasLocal, 'peliculas');
}

function goToCompletado() {
    $('#pago').hide();
    $('#completado').show();
    nextStepButtons('step3', 'step4');
}

function loadSpinner() {
    $('#progressModal').modal('show');
    setTimeout(function(){ $('#progressModal').modal('hide'); }, 3000);
    clearTimeout();
}

let heightHeader = window.getComputedStyle($('#header')[0]).getPropertyValue('height');
$('#wrapperPages').attr('style', `margin-top:${heightHeader}`);

function applyVote(film) {
    peliculasLocal = downFromLocalStorage('peliculas');
    peliculasLocal[film].votos++;
    loadStorage(peliculasLocal, 'peliculas');
}

$('#chartsModal').on('shown.bs.modal', function (event) {
    let arrayData = [];
    let stringLabel = 'Votos de las películas más recientes. ';
    for (const key in peliculasLocal) {
        if (peliculasLocal.hasOwnProperty(key)) {
            const element = peliculasLocal[key];
            arrayData.push([element.titulo, parseInt(element.votos)]);
            if(element.votos == 1) {
                stringLabel += `La película ${element.titulo} tiene ${element.votos} voto. `;
            } else if(element.votos > 1) {
                stringLabel += `La película ${element.titulo} tiene ${element.votos} votos. `;
            }
        }
    }
    google.charts.setOnLoadCallback(function () {
        drawChart1(arrayData);
    });
    $('#collapseTwo').collapse('toggle');
    google.charts.setOnLoadCallback(function () {
        drawChart2(arrayData);
    });
    drawChart3();
    $('.chartMe').attr('aria-label', stringLabel);
});

function drawChart1(arrayData) {
    let data = new google.visualization.DataTable();
    data.addColumn('string', 'Película');
    data.addColumn('number', 'Votos');

    data.addRows(arrayData);
    let options = {
        'title': 'Votos de las películas más recientes',
        'height': 500,
    };
    let chart = new google.visualization.PieChart(document.getElementById('chart1'));
    chart.draw(data, options);
}

function drawChart2(arrayData) {
    let data = new google.visualization.DataTable();
    data.addColumn('string', 'Películas');
    data.addColumn('number', 'Votos');
    data.addRows(arrayData);
    let options = {
        'title': 'Votos de las películas más recientes',
        'height': 500,
        'chartArea': {
            'width': '50%'
        },
        'hAxis': {
            'title': 'Votos',
            'minValue': 0
        },
        'vAxis': {
            'title': 'Películas'
        },
    };
    let chart = new google.visualization.BarChart(document.getElementById('chart2'));
    chart.draw(data, options);
}

function drawChart3() {
    let ctxPA = document.getElementById("chart3").getContext('2d');
    let arrayData = [];
    let arrayLabel = [];
    for (const key in peliculasLocal) {
        if (peliculasLocal.hasOwnProperty(key)) {
            const element = peliculasLocal[key];
            arrayData.push(parseInt(element.votos));
            arrayLabel.push(element.titulo);
        }
    }
    let myPolarChart = new Chart(ctxPA, {
        type: 'line',
        data: {
            labels: arrayLabel,
            datasets: [{
                'label': 'Votos',
                'data': arrayData,
                'fill': false,
                "borderColor": "rgb(75, 192, 192)",
                "lineTension": 0.1
            }]
        },
        options: {
            responsive: true
        }
    });
}
