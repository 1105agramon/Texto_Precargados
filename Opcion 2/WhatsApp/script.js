// 1. CONFIGURACIÓN DE TU GOOGLE SHEETS
const SHEET_ID = '1rAokmossR2FNMsMJD5lwMMX9GkBUdPLRvafJNtLPFp4'; 

// IMPORTANTE: Debes colocar el 'gid' exacto de cada hoja. 
// Lo encuentras en la URL de tu Google Sheets cuando cambias de pestaña (al final dice #gid=XXXXX)
const PESTANAS = [
    { id: 'saludos', nombre: 'SALUDOS', gid: '0' },
    { id: 'f', nombre: 'F', gid: '540850684' }, 
    { id: 'llave', nombre: 'Llave', gid: '2' }, // CAMBIAR ESTE GID
    { id: 'lytc', nombre: 'L y TC', gid: '3' }, // CAMBIAR ESTE GID
    { id: 'petc', nombre: 'P e TC', gid: '4' }, // CAMBIAR ESTE GID
    { id: 'hnc', nombre: 'HNC', gid: '5' }, // CAMBIAR ESTE GID
    { id: 'becas', nombre: 'Becas y AS', gid: '6' }, // CAMBIAR ESTE GID
    { id: 'ayb', nombre: 'A y B', gid: '7' }, // CAMBIAR ESTE GID
    { id: 'actcurp', nombre: 'Act y CURP', gid: '8' }, // CAMBIAR ESTE GID
    { id: 'cons', nombre: 'Cons y cert', gid: '9' }, // CAMBIAR ESTE GID
    { id: 'tramites', nombre: 'Tramites', gid: '10' }, // CAMBIAR ESTE GID
    { id: 'rsuac', nombre: 'R SUAC', gid: '11' }, // CAMBIAR ESTE GID
    { id: 'info1', nombre: 'info', gid: '12' }, // CAMBIAR ESTE GID
    { id: 'info2', nombre: 'info 2', gid: '13' }, // CAMBIAR ESTE GID
    { id: 'alcedos', nombre: 'Alc y edos', gid: '14' } // CAMBIAR ESTE GID
];

let cacheDatos = {}; // Memoria para no descargar 2 veces la misma pestaña
let tabActiva = ''; // Guarda el ID de la pestaña actual

const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const tabsContainer = document.getElementById('tabsContainer');
//  botón Limpiar
const clearBtn = document.getElementById('clearSearch');

// 2. INICIALIZAR PESTAÑAS
function inicializarPestanas() {
    PESTANAS.forEach(pestana => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn';
        btn.innerText = pestana.nombre;
        btn.onclick = () => cambiarPestana(pestana.id, pestana.gid);
        btn.id = `btn-${pestana.id}`;
        tabsContainer.appendChild(btn);
    });

    // Cargar la primera pestaña por defecto
    if(PESTANAS.length > 0) {
        cambiarPestana(PESTANAS[0].id, PESTANAS[0].gid);
    }
}

// 3. CAMBIAR DE PESTAÑA Y CARGAR DATOS
async function cambiarPestana(id, gid) {
    // Estilos del botón activo
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${id}`).classList.add('active');
    
    tabActiva = id;
    searchInput.value = ''; // Limpiar el buscador al cambiar de pestaña

    // Si ya descargamos esta hoja antes, mostramos desde la memoria (caché)
    if (cacheDatos[id]) {
        renderizarTabla(cacheDatos[id]);
        return;
    }

    // Si es la primera vez, mostramos "Cargando" y descargamos
    tableBody.innerHTML = `<tr><td colspan="6" class="loading"><div class="loader"></div>Cargando datos de "${id}"...</td></tr>`;

    try {
        const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&tq&gid=${gid}`;
        const respuesta = await fetch(URL);
        const texto = await respuesta.text();
        
        const jsonString = texto.substring(47, texto.length - 2);
        const json = JSON.parse(jsonString);

        let datosProcesados = json.table.rows.map(row => {
            let textoLimpio = row.c[3] ? row.c[3].v : "";
            if (textoLimpio.startsWith('"') && textoLimpio.endsWith('"')) {
                textoLimpio = textoLimpio.substring(1, textoLimpio.length - 1);
            }
            textoLimpio = textoLimpio.replace(/""/g, '"');

            return {
                tema: row.c[0] ? row.c[0].v : "",
                subtema: row.c[1] ? row.c[1].v : "",
                categoria: row.c[2] ? row.c[2].v : "",
                texto: textoLimpio,
                hashtag: row.c[4] ? row.c[4].v : ""
            };
        });

        // Limpiar cabeceras si la primera fila dice "Tema"
        if (datosProcesados.length > 0 && String(datosProcesados[0].tema).toLowerCase() === "tema") {
            datosProcesados.shift(); 
        }

        // Guardar en memoria
        cacheDatos[id] = datosProcesados;
        
        // Renderizar si el usuario no ha cambiado de pestaña súper rápido mientras cargaba
        if(tabActiva === id) {
            renderizarTabla(datosProcesados);
        }

    } catch (error) {
        console.error(`Error al cargar la pestaña ${id}:`, error);
        tableBody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Error al cargar la pestaña. Verifica el GID.</td></tr>`;
    }
}

// 4. FUNCIÓN PARA DIBUJAR LA TABLA
function renderizarTabla(datos) {
    tableBody.innerHTML = ''; 

    if (!datos || datos.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 30px; color: var(--text-muted);">No hay información en esta pestaña o no coincide con la búsqueda.</td></tr>`;
        return;
    }

    datos.forEach(item => {
        const tr = document.createElement('tr');
        const textoCodificado = encodeURIComponent(item.texto);

        tr.setAttribute('onclick', 'copiarDesdeFila(this)');
        tr.innerHTML = `
            <td>${item.tema}</td>
            <td>${item.subtema}</td>
            <td>${item.categoria}</td>
            <td class="text-col">${item.texto}</td>
            <td>${item.hashtag}</td>
            <td class="center-col">
                <button class="copy-btn" data-texto="${textoCodificado}" onclick="copiarAlPortapapeles(event, this)">Copiar</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// 5. LÓGICA DEL BUSCADOR (FILTRO DE LA PESTAÑA ACTUAL)
searchInput.addEventListener('input', function(e) {
    const terminoBusqueda = e.target.value.toLowerCase();
    const datosDePestana = cacheDatos[tabActiva] || [];

    // Control de visibilidad del botón X
    clearBtn.style.display = terminoBusqueda.length > 0 ? 'block' : 'none';

    const datosFiltrados = datosDePestana.filter(item => {
        return String(item.tema).toLowerCase().includes(terminoBusqueda) ||
               String(item.subtema).toLowerCase().includes(terminoBusqueda) ||
               String(item.categoria).toLowerCase().includes(terminoBusqueda);
    });

    renderizarTabla(datosFiltrados);
});

// 6. FUNCIONES DE COPIADO
async function copiarDesdeFila(fila) {
    const boton = fila.querySelector('.copy-btn');
    if(boton) await ejecutarCopiado(boton);
    
    fila.style.backgroundColor = "rgba(16, 185, 129, 0.1)"; 
    setTimeout(() => { fila.style.backgroundColor = ""; }, 1500);
}

async function copiarAlPortapapeles(evento, boton) {
    evento.stopPropagation(); // Evita que se dispare el evento de la fila
    await ejecutarCopiado(boton);
}

// 7. MOTOR DE COPIADO (INTEGRADO CON LÓGICA PARA IMÁGENES)
async function ejecutarCopiado(boton) {
    try {
        const textoExtraido = decodeURIComponent(boton.getAttribute('data-texto'));
        
        // Buscamos si el texto es exactamente una etiqueta HTML de imagen
        // Ejemplo: <img src="https://i.imgur.com/imagen.png">
        const esImagen = textoExtraido.match(/<img[^>]+src=["']([^"']+)["']/i);

        if (esImagen) {
            // Es una imagen. Extraemos la URL
            const urlImagen = esImagen[1];
            
            try {
                // Intentamos descargarla y convertirla a Blob
                const respuesta = await fetch(urlImagen);
                const blob = await respuesta.blob();
                
                // Si funciona, la copiamos como archivo al portapapeles
                const item = new ClipboardItem({ [blob.type]: blob });
                await navigator.clipboard.write([item]);
                
            } catch (errorFetch) {
                console.warn("Bloqueo CORS al descargar la imagen. Se copiará como texto en su lugar.", errorFetch);
                // Plan B: Si falla la descarga, copiamos el código HTML
                await navigator.clipboard.writeText(textoExtraido);
            }
        } else {
            // Si es texto normal, copiamos como siempre
            await navigator.clipboard.writeText(textoExtraido);
        }
        
        // Efecto visual en el botón
        const textoOriginal = boton.innerText;
        boton.innerText = "¡Copiado!";
        boton.classList.add('copied');
        
        setTimeout(() => {
            boton.innerText = "Copiar"; // Reiniciamos texto fijo para evitar bugs visuales
            boton.classList.remove('copied');
        }, 1500);
        
    } catch (err) {
        console.error('Error al copiar: ', err);
        alert("Tu navegador bloqueó la acción. Revisa los permisos del portapapeles.");
    }
}

// FUNCIÓN PARA LIMPIAR (CORREGIDA)
clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    
    // Usamos los datos guardados de la pestaña actual
    const datosOriginales = cacheDatos[tabActiva] || [];
    renderizarTabla(datosOriginales); 
    
    searchInput.focus();
});

// Iniciar aplicación
window.onload = inicializarPestanas;