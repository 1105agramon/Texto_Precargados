// 1. CONFIGURACIÓN DE TU GOOGLE SHEETS

const SHEET_ID = '1rAokmossR2FNMsMJD5lwMMX9GkBUdPLRvafJNtLPFp4'; 
const GID = '0'; // '0' es la primera pestaña

const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&tq&gid=${GID}`;


let datosGlobales = []; // Aquí guardaremos los datos descargados
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');

// 2. FUNCIÓN PARA OBTENER LOS DATOS
async function cargarDatos() {
    try {
        const respuesta = await fetch(URL);
        const texto = await respuesta.text();
        
        const jsonString = texto.substring(47, texto.length - 2);
        const json = JSON.parse(jsonString);

        datosGlobales = json.table.rows.map(row => {
            // Extraer el texto
            let textoLimpio = row.c[3] ? row.c[3].v : "";

            // LIMPIEZA DE COMILLAS: Si Sheets envolvió el texto en "", se las quitamos.
            if (textoLimpio.startsWith('"') && textoLimpio.endsWith('"')) {
                textoLimpio = textoLimpio.substring(1, textoLimpio.length - 1);
            }
            // Reparar comillas internas escapadas por Google Sheets
            textoLimpio = textoLimpio.replace(/""/g, '"');

            return {
                tema: row.c[0] ? row.c[0].v : "",
                subtema: row.c[1] ? row.c[1].v : "",
                categoria: row.c[2] ? row.c[2].v : "",
                texto: textoLimpio,
                hashtag: row.c[4] ? row.c[4].v : ""
            };
        });

        if (datosGlobales.length > 0 && datosGlobales[0].tema.toLowerCase() === "tema") {
            datosGlobales.shift(); 
        }

        renderizarTabla(datosGlobales);

    } catch (error) {
        console.error("Error al cargar Google Sheets:", error);
        tableBody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Error al cargar los datos.</td></tr>`;
    }
}

// 3. FUNCIÓN PARA DIBUJAR LA TABLA
function renderizarTabla(datos) {
    tableBody.innerHTML = ''; 

    if (datos.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No se encontraron resultados.</td></tr>`;
        return;
    }

    datos.forEach(item => {
        const tr = document.createElement('tr');
        
        // Encriptamos el texto para que los emojis y saltos de línea no rompan el HTML del botón
        const textoCodificado = encodeURIComponent(item.texto);

        
        tr.setAttribute('onclick', 'copiarDesdeFila(this)');

        tr.innerHTML = `
            <td>${item.tema}</td>
            <td>${item.subtema}</td>
            <td>${item.categoria}</td>
            <td class="text-col">${item.texto}</td>
            <td>${item.hashtag}</td>
            <td class="center-col">
                <button class="copy-btn" data-texto="${textoCodificado}" onclick="copiarAlPortapapeles(this)">Copiar</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

async function copiarDesdeFila(fila) {
    try {
        // Buscamos el botón dentro de la fila que acabas de hacer clic
        const boton = fila.querySelector('.copy-btn');
        const textoExtraido = decodeURIComponent(boton.getAttribute('data-texto'));
        
        // Copiamos al portapapeles
        await navigator.clipboard.writeText(textoExtraido);
        
        // Efecto visual en el botón
        const textoOriginal = boton.innerText;
        boton.innerText = "¡Copiado!";
        boton.classList.add('copied');
        
        // Opcional: Iluminamos la fila entera de verde por un segundo
        fila.style.backgroundColor = "rgba(16, 185, 129, 0.1)"; 
        
        setTimeout(() => {
            boton.innerText = textoOriginal;
            boton.classList.remove('copied');
            fila.style.backgroundColor = ""; // Restauramos el color
        }, 1500);
        
    } catch (err) {
        console.error('Error al copiar: ', err);
        alert("Tu navegador bloqueó el copiado automático.");
    }
}

// 4. LÓGICA DEL BUSCADOR (FILTRO)
searchInput.addEventListener('input', function(e) {
    const terminoBusqueda = e.target.value.toLowerCase();

    // Filtra si el término coincide con Tema, Subtema o Categoría
    const datosFiltrados = datosGlobales.filter(item => {
        return item.tema.toLowerCase().includes(terminoBusqueda) ||
               item.subtema.toLowerCase().includes(terminoBusqueda) ||
               item.categoria.toLowerCase().includes(terminoBusqueda);
    });

    renderizarTabla(datosFiltrados);
});

// 5. FUNCIÓN DE COPIADO
async function copiarAlPortapapeles(boton) {
    try {
        // Desencriptamos el texto del botón al momento de copiar
        const textoExtraido = decodeURIComponent(boton.getAttribute('data-texto'));
        
        await navigator.clipboard.writeText(textoExtraido);
        
        const textoOriginal = boton.innerText;
        boton.innerText = "¡Copiado!";
        boton.classList.add('copied');
        
        setTimeout(() => {
            boton.innerText = textoOriginal;
            boton.classList.remove('copied');
        }, 1500);
    } catch (err) {
        console.error('Error al copiar: ', err);
        alert("Tu navegador bloqueó el copiado automático.");
    }
}

// Iniciar la carga al abrir la página
cargarDatos();