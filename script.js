// 1. CONFIGURACIÓN
const SHEET_ID = '1rAokmossR2FNMsMJD5lwMMX9GkBUdPLRvafJNtLPFp4'; 
const GID = '0'; 
const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&tq&gid=${GID}`;

let datosGlobales = []; 
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearSearch');

const btnCopiarFolio = document.getElementById('btnCopiarFolio');
const campoFolioHeader = document.getElementById('folioInput');
const btnInicio = document.getElementById('btnInicio');
const contenedorTabla = document.querySelector('.table-container');

// Mensaje Fijo Llave CDMX
const MENSAJE_LLAVE = `Es necesario que nos envíe un correo a chat.locatel@cdmx.gob.mx con la siguiente documentación en formato PDF: 
1.- Identificación oficial vigente (INE, pasaporte, cédula profesional, cartilla del servicio militar, en caso de extranjeros FM2 o FM3). Preferentemente INE por ambos lados 
2.- Una fotografía del titular de la cuenta Llave CDMX donde sostenga la identificación oficial. (Selfie)  

IMPORTANTE: En el ASUNTO del correo deberá colocar el siguiente folio: CHAT-0000-000, mismo que tiene una vigencia de 72 horas. En el CUERPO del correo deberá describir brevemente la complicación que está presentando agregando número telefónico de contacto. La información deberá ser enviada desde una cuenta de correo electrónico a la que tenga acceso en todo momento.`;

// 2. MODO CLARO / OSCURO
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const icon = themeToggle.querySelector('.icon');

if (localStorage.getItem('theme') === 'light') {
    body.classList.add('light-mode');
    icon.innerText = '☀️';
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('light-mode');
    if (body.classList.contains('light-mode')) {
        icon.innerText = '☀️';
        localStorage.setItem('theme', 'light');
    } else {
        icon.innerText = '🌙';
        localStorage.setItem('theme', 'dark');
    }
});

// 3. SCROLL AL INICIO
contenedorTabla.addEventListener('scroll', () => {
    if (contenedorTabla.scrollTop > 100) {
        btnInicio.classList.add('show');
    } else {
        btnInicio.classList.remove('show');
    }
});

btnInicio.addEventListener('click', () => {
    contenedorTabla.scrollTo({ top: 0, behavior: 'smooth' });
});


// 4. CARGA DE DATOS DESDE SHEETS
async function cargarDatos() {
    try {
        const respuesta = await fetch(URL);
        const texto = await respuesta.text();
        
        const jsonString = texto.substring(47, texto.length - 2);
        const json = JSON.parse(jsonString);

        datosGlobales = json.table.rows.map(row => {
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

        // Eliminar fila de encabezados si viene de Sheets
        if (datosGlobales.length > 0 && datosGlobales[0].tema.toLowerCase() === "tema") {
            datosGlobales.shift(); 
        }
        
        renderizarTabla(datosGlobales);

    } catch (error) {
        console.error("Error al cargar Google Sheets:", error);
        tableBody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Error al cargar los datos. Revisa los permisos de lectura de Google Sheets.</td></tr>`;
    }
}

// 5. RENDERIZAR LA TABLA Y EDICIÓN
function renderizarTabla(datos) {
    tableBody.innerHTML = ''; 

    if (datos.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No se encontraron resultados.</td></tr>`;
        return;
    }

    datos.forEach(item => {
        const tr = document.createElement('tr');
        
        tr.setAttribute('onclick', 'copiarDesdeFila(this, event)');

        tr.innerHTML = `
            <td>${item.tema}</td>
            <td>${item.subtema}</td>
            <td>${item.categoria}</td>
            <td class="text-col editable-cell" contenteditable="true" spellcheck="false" title="Haz clic para editar">${item.texto}</td>
            <td>${item.hashtag}</td>
            <td class="center-col">
                <button class="copy-btn" onclick="copiarAlPortapapeles(this, event)">Copiar</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// 6. FILTRO INTELIGENTE
searchInput.addEventListener('input', function(e) {
    const terminoBusqueda = e.target.value.toLowerCase().trim();
    
    clearBtn.style.display = terminoBusqueda.length > 0 ? 'block' : 'none';

    if (terminoBusqueda === "") {
        renderizarTabla(datosGlobales);
        return;
    }

    const palabras = terminoBusqueda.split(/\s+/);

    const datosFiltrados = datosGlobales.filter(item => {
        const contenidoFila = `
            ${item.tema} 
            ${item.subtema} 
            ${item.categoria} 
            ${item.texto} 
            ${item.hashtag}
        `.toLowerCase();

        return palabras.every(palabra => contenidoFila.includes(palabra));
    });

    renderizarTabla(datosFiltrados);
});

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    renderizarTabla(datosGlobales); 
    searchInput.focus();
});

// 7. FUNCIONES DE COPIADO
async function copiarDesdeFila(fila, event) {
    if (event && event.target.classList.contains('text-col')) {
        return; // Permite editar sin copiar
    }

    try {
        const boton = fila.querySelector('.copy-btn');
        const celdaTexto = fila.querySelector('.text-col');
        let textoExtraido = celdaTexto.innerText; 
        
        const valorFolio = campoFolioHeader.value.trim();

        if (textoExtraido.includes("0000-000") && valorFolio !== "") {
            textoExtraido = textoExtraido.replace(/0000-000/g, valorFolio);
        }
        
        await navigator.clipboard.writeText(textoExtraido);
        
        const textoOriginal = boton.innerText;
        boton.innerText = "¡Copiado!";
        boton.classList.add('copied');


        // --- EFECTO DE ILUMINACIÓN INTELIGENTE ---
        if (document.body.classList.contains('light-mode')) {
            // Si está en Modo Claro: Destello en Azul Cerúleo
            fila.style.backgroundColor = "rgba(4, 255, 109, 0.4)"; 
        } else {
            // Si está en Modo Oscuro: Destello en Morado Drácula
            fila.style.backgroundColor = "rgba(62, 228, 112, 0.44)"; 
        }


        setTimeout(() => {
            boton.innerText = textoOriginal;
            boton.classList.remove('copied');
            fila.style.backgroundColor = ""; 
        }, 1500);
        
    } catch (err) {
        console.error('Error al copiar desde fila: ', err);
    }
}

async function copiarAlPortapapeles(boton, event) {
    if(event) event.stopPropagation();

    try {
        const fila = boton.closest('tr');
        const celdaTexto = fila.querySelector('.text-col');
        let textoExtraido = celdaTexto.innerText;
        
        const valorFolio = campoFolioHeader.value.trim();

        if (textoExtraido.includes("0000-000") && valorFolio !== "") {
            textoExtraido = textoExtraido.replace(/0000-000/g, valorFolio);
        }
        
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
    }
}

// 8. BOTÓN HEADER "COPIAR LLAVE"
btnCopiarFolio.addEventListener('click', async () => {
    try {
        let textoFinal = MENSAJE_LLAVE;
        const valorFolio = campoFolioHeader.value.trim();

        if (valorFolio !== "") {
            textoFinal = textoFinal.replace(/0000-000/g, valorFolio);
        }

        await navigator.clipboard.writeText(textoFinal);

        const textoOriginal = btnCopiarFolio.innerText;
        btnCopiarFolio.innerText = "¡Copiado!";
        btnCopiarFolio.classList.add('copied');

        setTimeout(() => {
            btnCopiarFolio.innerText = textoOriginal;
            btnCopiarFolio.classList.remove('copied');
        }, 1500);

    } catch (err) {
        console.error('Error al copiar el mensaje Llave desde el header: ', err);
    }
});

// Arrancar el programa
cargarDatos();