let historial = JSON.parse(localStorage.getItem("historial")) || [];

let ctx = document.getElementById("grafica").getContext("2d");

let grafica = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Nivel de batería',
            data: []
        }]
    }
});

function actualizarGrafica(){
    grafica.data.labels = historial.map(r => r.fecha);
    grafica.data.datasets[0].data = historial.map(r => r.nivel);
    grafica.update();
}

function limpiarHistorial(){

    localStorage.removeItem("historial");
    historial = [];
    
    document.getElementById("velocidad").textContent = "Velocidad: --";
    document.getElementById("consumoTotal").textContent = "Consumo total: --";

    navigator.getBattery().then(function(battery){

        let nivel = battery.level * 100;

        historial.push({
            nivel: nivel,
            fecha: new Date().toLocaleTimeString(),
            tiempo: Date.now()
        });

        localStorage.setItem("historial", JSON.stringify(historial));
        actualizarGrafica();

        Swal.fire("Historial reiniciado");
    });
}

function calcularVelocidad(cargando){

    if(historial.length < 2) return;

    let ultimo = historial[historial.length - 1];
    let anterior = historial[historial.length - 2];

    let diferenciaNivel = ultimo.nivel - anterior.nivel;
    let diferenciaTiempo = (ultimo.tiempo - anterior.tiempo) / 1000;

    if(cargando && diferenciaNivel > 0){

        let tiempoPorPorcentaje = diferenciaTiempo / diferenciaNivel;

        document.getElementById("velocidad").textContent =
        "Carga 1% cada " + tiempoPorPorcentaje.toFixed(1) + " segundos";

    }

    if(!cargando && diferenciaNivel < 0){

        let tiempoPorPorcentaje = diferenciaTiempo / Math.abs(diferenciaNivel);

        document.getElementById("velocidad").textContent =
        "Descarga 1% cada " + tiempoPorPorcentaje.toFixed(1) + " segundos";

    }
}

function calcularTotal(cargando){

    if(historial.length < 2) return;

    let primero = historial[0];
    let ultimo = historial[historial.length - 1];

    let diferenciaNivel = ultimo.nivel - primero.nivel;
    let diferenciaTiempo = (ultimo.tiempo - primero.tiempo) / 60000;

    if(cargando && diferenciaNivel > 0){

        document.getElementById("consumoTotal").textContent =
        "Ha cargado " + diferenciaNivel.toFixed(0) +
        "% en " + diferenciaTiempo.toFixed(1) + " minutos";

    }

    if(!cargando && diferenciaNivel < 0){

        document.getElementById("consumoTotal").textContent =
        "Ha bajado " + Math.abs(diferenciaNivel).toFixed(0) +
        "% en " + diferenciaTiempo.toFixed(1) + " minutos";

    }
}

if("getBattery" in navigator){

navigator.getBattery().then(function(battery){

    function actualizar(){

        let nivel = battery.level * 100;

        document.getElementById("nivel").textContent =
        "Nivel: " + nivel.toFixed(0) + "%";

        document.getElementById("estado").textContent =
        battery.charging ? "Cargando" : "Descargando";

        // 🔥 SI NO HAY HISTORIAL, REGISTRA EL PRIMER DATO
        if(historial.length === 0){

            historial.push({
                nivel: nivel,
                fecha: new Date().toLocaleTimeString(),
                tiempo: Date.now()
            });

            localStorage.setItem("historial", JSON.stringify(historial));
            actualizarGrafica();
        }

        // 🔥 SI CAMBIA EL NIVEL, REGISTRA
        if(historial.length > 0 && historial[historial.length-1].nivel !== nivel){

            historial.push({
                nivel: nivel,
                fecha: new Date().toLocaleTimeString(),
                tiempo: Date.now()
            });

            localStorage.setItem("historial", JSON.stringify(historial));
            actualizarGrafica();
        }

        calcularVelocidad(battery.charging);
        calcularTotal(battery.charging);

        if(!battery.charging && nivel <= 20){
            Swal.fire("Batería baja");
        }
    }

    battery.addEventListener("levelchange", actualizar);
    battery.addEventListener("chargingchange", actualizar);

    // 🔥 DIBUJAR GRAFICA AL INICIAR SI YA HAY DATOS
    if(historial.length > 0){
        actualizarGrafica();
    }

    actualizar();

});

}else{

    alert("Tu navegador no soporta la API de batería");

}
