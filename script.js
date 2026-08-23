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
const MENSAJE_LLAVE = `Es necesario que nos envíe un correo a chat.locatel@cdmx.gob.mx con la siguiente documentación en formato PDF: 📧📁

1.- Identificación oficial vigente (INE, pasaporte, cédula profesional, cartilla del servicio militar, en caso de extranjeros FM2 o FM3). Preferentemente INE por ambos lados. 🪪

2.- Una fotografía del titular de la cuenta Llave CDMX donde sostenga la identificación oficial. (Selfie) 🤳📸

⚠️ IMPORTANTE: En el ASUNTO del correo deberá colocar el siguiente folio: CHAT-0000-000, mismo que tiene una vigencia de 72 horas. ⏳ En el CUERPO del correo deberá describir brevemente la complicación que está presentando agregando número telefónico de contacto. 📞 La información deberá ser enviada desde una cuenta de correo electrónico a la que tenga acceso en todo momento. 📑

NOTA: Procure que las imágenes sean legibles para evitar contratiempos en su trámite. ✅`;

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

// 7. FUNCIONES DE COPIADO ACTUALIZADAS (CON SOPORTE PARA IMÁGENES HTML)
async function copiarDesdeFila(fila, event) {
    if (event && event.target.classList.contains('text-col')) {
        return; // Permite editar sin copiar
    }

    const boton = fila.querySelector('.copy-btn');
    const celdaTexto = fila.querySelector('.text-col');
    
    // Obtenemos el HTML (para detectar imágenes) y el texto plano
    let textoHTML = celdaTexto.innerHTML;
    let textoPlano = celdaTexto.innerText; 
    const valorFolio = campoFolioHeader.value.trim();

    // Reemplazo de folio
    if (textoHTML.includes("0000-000") && valorFolio !== "") {
        textoHTML = textoHTML.replace(/0000-000/g, valorFolio);
        textoPlano = textoPlano.replace(/0000-000/g, valorFolio);
    }

    try {
        const contieneImagen = textoHTML.includes('<img');

        if (contieneImagen) {
            // Copiado con Blob para soportar imágenes HTML
            const type = "text/html";
            const blobHTML = new Blob([textoHTML], { type });
            const blobText = new Blob([textoPlano], { type: "text/plain" });
            const data = [new ClipboardItem({ 
                [type]: blobHTML, 
                "text/plain": blobText 
            })];
            await navigator.clipboard.write(data);
        } else {
            // Si es solo texto normal
            await navigator.clipboard.writeText(textoPlano);
        }
        
        // Animación de copiado
        const textoOriginal = boton.innerText;
        boton.innerText = "¡Copiado!";
        boton.classList.add('copied');

        // --- EFECTO DE ILUMINACIÓN INTELIGENTE ---
        if (document.body.classList.contains('light-mode')) {
            fila.style.backgroundColor = "rgba(4, 255, 109, 0.4)"; 
        } else {
            fila.style.backgroundColor = "rgba(62, 228, 112, 0.44)"; 
        }

        setTimeout(() => {
            boton.innerText = textoOriginal;
            boton.classList.remove('copied');
            fila.style.backgroundColor = ""; 
        }, 1500);
        
    } catch (err) {
        console.error('Error al copiar desde fila: ', err);
        // Plan B: Intentar copiar texto plano si el ClipboardItem falla
        await navigator.clipboard.writeText(textoPlano).catch(e => console.error("Fallo definitivo: ", e));
    }
}

async function copiarAlPortapapeles(boton, event) {
    if(event) event.stopPropagation();

    const fila = boton.closest('tr');
    const celdaTexto = fila.querySelector('.text-col');
    
    // Obtenemos el HTML y el texto plano
    let textoHTML = celdaTexto.innerHTML;
    let textoPlano = celdaTexto.innerText;
    const valorFolio = campoFolioHeader.value.trim();

    // Reemplazo de folio
    if (textoHTML.includes("0000-000") && valorFolio !== "") {
        textoHTML = textoHTML.replace(/0000-000/g, valorFolio);
        textoPlano = textoPlano.replace(/0000-000/g, valorFolio);
    }

    try {
        const contieneImagen = textoHTML.includes('<img');

        if (contieneImagen) {
            // Copiado con Blob para soportar imágenes HTML
            const type = "text/html";
            const blobHTML = new Blob([textoHTML], { type });
            const blobText = new Blob([textoPlano], { type: "text/plain" });
            const data = [new ClipboardItem({ 
                [type]: blobHTML, 
                "text/plain": blobText 
            })];
            await navigator.clipboard.write(data);
        } else {
            // Texto normal
            await navigator.clipboard.writeText(textoPlano);
        }
        
        // Animación de copiado
        const textoOriginal = boton.innerText;
        boton.innerText = "¡Copiado!";
        boton.classList.add('copied');
        
        setTimeout(() => {
            boton.innerText = textoOriginal;
            boton.classList.remove('copied');
        }, 1500);

    } catch (err) {
        console.error('Error al copiar: ', err);
        // Plan B: Intentar copiar texto plano si el ClipboardItem falla
        await navigator.clipboard.writeText(textoPlano).catch(e => console.error("Fallo definitivo: ", e));
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


// Funciones auxiliares para enmascarar datos
function enmascararTelefono(tel) {
    if (tel.length === 10) {
        // Toma los primeros 3, agrega **** y luego toma los últimos 3
        return tel.substring(0, 3) + "****" + tel.substring(7);
    }
    return tel; // Si no tiene 10 dígitos, lo deja igual por seguridad
}

function enmascararCorreo(correo) {
    const partes = correo.split('@');
    if (partes.length !== 2) return correo; // Si no tiene el formato correcto, lo deja igual

    const usuario = partes[0];
    const dominio = partes[1];
    let usuarioOculto = usuario;

    // Lógica para correos según su longitud antes del @
    if (usuario.length >= 6) {
        // Ejemplo: ejemplo -> eje****plo
        usuarioOculto = usuario.substring(0, 3) + "****" + usuario.substring(usuario.length - 3);
    } else if (usuario.length >= 3) {
        // Ejemplo: hola -> h****a
        usuarioOculto = usuario.substring(0, 1) + "****" + usuario.substring(usuario.length - 1);
    } else {
        // Ejemplo: ab -> ****
        usuarioOculto = "****";
    }

    return usuarioOculto + "@" + dominio;
}

// 9. VALIDACIÓN DE MEDIOS DE CONTACTO
const btnCopiarContacto = document.getElementById('btnCopiarContacto');
const telefonoInput = document.getElementById('telefonoInput');
const correoInput = document.getElementById('correoInput');

if (btnCopiarContacto) {
    btnCopiarContacto.addEventListener('click', async () => {
        const telInput = telefonoInput.value.trim();
        const emailInput = correoInput.value.trim();
        let textoFinal = "";

        // Enmascaramos los datos si existen
        const telOculto = telInput !== "" ? enmascararTelefono(telInput) : "";
        const emailOculto = emailInput !== "" ? enmascararCorreo(emailInput) : "";

        // Evaluar los 3 escenarios usando las variables ocultas (telOculto y emailOculto)
        if (telInput !== "" && emailInput !== "") {
            textoFinal = `En su Cuenta Llave se encuentran registrados los siguientes medios de contacto 😊, ¿Podría confirmarme si actualmente tiene acceso a ellos? 📩📱\nTeléfono: ${telOculto}\nCorreo: ${emailOculto}`;
        } 
        else if (telInput !== "" && emailInput === "") {
            textoFinal = `En su Cuenta Llave, su correo electrónico se encuentra registrado correctamente 😊.\n¿Podría indicarme si tiene acceso al número celular que se encuentra registrado? 📱\nNúmero de celular: ${telOculto}`;
        } 
        else if (emailInput !== "" && telInput === "") {
            textoFinal = `En su Cuenta Llave, su número celular se encuentra registrado correctamente 😊.\n¿Podría indicarme si tiene acceso al correo electrónico que se encuentra registrado? 📩\nCorreo: ${emailOculto}`;
        } 
        else {
            alert("Por favor, ingresa al menos el teléfono o el correo.");
            return; 
        }

        try {
            await navigator.clipboard.writeText(textoFinal);
            
            // Animación de éxito consistente con el resto de la app
            const textoOriginal = btnCopiarContacto.innerText;
            btnCopiarContacto.innerText = "¡Copiado!";
            btnCopiarContacto.classList.add('copied');

            // Limpiar los inputs para la siguiente consulta
            telefonoInput.value = "";
            correoInput.value = "";

            setTimeout(() => {
                btnCopiarContacto.innerText = textoOriginal;
                btnCopiarContacto.classList.remove('copied');
            }, 1500);

        } catch (err) {
            console.error('Error al copiar el mensaje de contacto: ', err);
            alert("No se pudo copiar el texto. Verifica los permisos de tu navegador.");
        }
    });
}

// 10. ENVIAR HORA A GOOGLE SHEETS
// 10. ENVIAR HORA A GOOGLE SHEETS
const btnGuardarHora = document.getElementById('btnGuardarHora');
const horaInput = document.getElementById('horaInput');

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxEB6MUC7ZCIMkactyDxJtL3nnRhguppn9OHDo1IPw3DalhqU1jKF9uCeQXq6afCJ-RWw/exec?accion=hora';
// --- NUEVA FUNCIÓN PARA LEER LA HORA ---
// --- NUEVA FUNCIÓN PARA LEER LA HORA (CON DIAGNÓSTICO) ---
async function obtenerHoraGuardada() {
    if (!horaInput) return;
    
    try {
        console.log("Intentando obtener la hora...");
        const respuesta = await fetch(WEB_APP_URL);
        
        // Verificamos si la respuesta de red fue exitosa
        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        const textoPuro = await respuesta.text();
        console.log("Respuesta de Google:", textoPuro); // Para ver qué nos manda Google
        
        const datos = JSON.parse(textoPuro);
        
        if (datos.status === "success" && datos.hora) {
            horaInput.value = datos.hora;
        } else {
            console.warn("Google respondió, pero sin hora válida:", datos);
        }
        
    } catch (error) {
        console.error("Error exacto al leer Google Sheets:", error);
        // Si tienes problemas de CORS, esto te lo dirá en la consola del navegador
    }
}

if (btnGuardarHora) {
    btnGuardarHora.addEventListener('click', async () => {
        const horaValor = horaInput.value;

        if (!horaValor) {
            alert("Por favor, selecciona una hora primero.");
            return;
        }

        // Deshabilitar botón temporalmente
        btnGuardarHora.disabled = true;
        btnGuardarHora.innerText = "⏳";

        try {
            // Enviamos la hora mediante una petición POST (vía URLSearchParams para evitar problemas de CORS simples)
            const respuestas = await fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors', // Necesario para Apps Script ejecutado desde webs externas locales
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'hora': horaValor
                })
            });

            // Al usar 'no-cors' la respuesta es opaca, asumimos éxito si no lanza error
            btnGuardarHora.innerText = "✅";
            alert(`Hora ${horaValor} enviada correctamente a Google Sheets.`);
            
            setTimeout(() => {
                btnGuardarHora.innerText = "💾";
                btnGuardarHora.disabled = false;
            }, 2000);

        } catch (error) {
            console.error("Error al enviar la hora:", error);
            alert("Hubo un error al guardar la hora.");
            btnGuardarHora.innerText = "💾";
            btnGuardarHora.disabled = false;
        }
    });
}

// ==========================================================
// 11. LÓGICA DEL MENÚ LATERAL Y CONTEO DE DESPEDIDAS
// ==========================================================

// ==========================================================
// 11. LÓGICA DEL MENÚ LATERAL Y CONTEO DE DESPEDIDAS
// ==========================================================

const API_CONTEO_URL = 'https://script.google.com/macros/s/AKfycbxEB6MUC7ZCIMkactyDxJtL3nnRhguppn9OHDo1IPw3DalhqU1jKF9uCeQXq6afCJ-RWw/exec?accion=conteo2';

const btnMenuDespedidas = document.getElementById('btnMenuDespedidas');
const sideMenuDespedidas = document.getElementById('sideMenuDespedidas');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const searchHashtag = document.getElementById('searchHashtag');
const hashtagButtonsContainer = document.getElementById('hashtagButtonsContainer');

const textoActivo = `Por último, nos encantaría conocer su experiencia con nuestro servicio a través de una breve encuesta de satisfacción:  https://forms.gle/iXN2fQZvXikwM6HTA 📊📈\nGracias por utilizar los servicios de *0311Locatel, le atendió JOSE GRANADOS. Hasta luego. #LAPALABRADELBOTON`;

const textoInactivo = `Debido a inactividad, el chat de *0311 LOCATEL finaliza su sesión, le recordamos que también podemos brindarle información a través de redes sociales, en Facebook como Locatel Ciudad de México y en Twitter como @locatel_mx o marcando al *0311 las 24 horas del día los 365 días del año, si desea realizar un reporte sobre servicios en la CDMX puede realizarlo por medio de https://311locatel.cdmx.gob.mx/ Le atendió JOSE GRANADOS. Hasta luego. #LAPALABRADELBOTON`;

// Ahora la lista iniciará vacía y se llenará sola
let listaHashtags = []; 


// --- NUEVA FUNCIÓN: LEER LAS COLUMNAS DESDE APPS SCRIPT ---
async function cargarHashtagsDesdeExcel() {
    try {
        // Hacemos un fetch simple (GET) a tu URL de Apps Script
        const respuesta = await fetch(API_CONTEO_URL);
        const datos = await respuesta.json();
        
        if (datos.status === "success" && datos.hashtags) {
            listaHashtags = datos.hashtags;
            renderHashtags(); // Dibujamos los botones
        } else {
            console.error("Error desde Apps Script:", datos.mensaje);
            hashtagButtonsContainer.innerHTML = `<p style="color:var(--text-muted); text-align:center; font-size:14px;">No se encontraron etiquetas.</p>`;
        }
    } catch (error) {
        console.error("Error de conexión al cargar hashtags:", error);
        hashtagButtonsContainer.innerHTML = `<p style="color:var(--danger-color); text-align:center; font-size:14px;">Error de conexión.</p>`;
    }
}

// 1. Abrir y Cerrar el menú lateral
if (btnMenuDespedidas && sideMenuDespedidas) {
    btnMenuDespedidas.addEventListener('click', () => {
        sideMenuDespedidas.classList.add('open');
        // Actualiza los botones cada vez que abres el menú
        cargarHashtagsDesdeExcel(); 
    });
}
if (closeMenuBtn) {
    closeMenuBtn.addEventListener('click', () => {
        sideMenuDespedidas.classList.remove('open');
    });
}

// 2. Función principal: Crear los botones y manejar el clic
function renderHashtags(filtro = "") {
    hashtagButtonsContainer.innerHTML = "";
    
    const filtrados = listaHashtags.filter(h => h.toLowerCase().includes(filtro.toLowerCase()));
    
    if(filtrados.length === 0) {
        hashtagButtonsContainer.innerHTML = `<p style="text-align:center; color: var(--text-muted); font-size:14px;">No se encontraron etiquetas.</p>`;
        return;
    }

    filtrados.forEach(hashtag => {
        const btn = document.createElement('button');
        btn.className = 'hashtag-btn';
        btn.innerHTML = `<span>${hashtag}</span> <span style="font-size: 14px; opacity: 0.7;">📋</span>`;
        
        btn.addEventListener('click', async () => {
            // Leemos el estado del switch (Activo / Inactivo)
            let estadoSeleccionado = document.querySelector('input[name="estadoDespedida"]:checked').value;
            
            // 🔥 REGLA ESTRICTA: Si es #INACTIVIDAD, ignoramos el menú y forzamos inactivo
            if (hashtag === "#INACTIVIDAD") {
                estadoSeleccionado = "inactivo";
            }

            // Seleccionamos el texto según el estado final dictado
            let textoFinal = estadoSeleccionado === "activo" ? textoActivo : textoInactivo;
            
            // Reemplazamos el comodín por el hashtag clickeado
            textoFinal = textoFinal.replace('#LAPALABRADELBOTON', hashtag);
            
            try {
                // Copiamos al portapapeles
                await navigator.clipboard.writeText(textoFinal);
                
                // Animación visual verde de copiado
                btn.classList.add('copied');
                btn.innerHTML = `<span>¡Copiado!</span> <span>✅</span>`;
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = `<span>${hashtag}</span> <span style="font-size: 14px; opacity: 0.7;">📋</span>`;
                }, 1500);

                // Mandamos el hashtag y el estado (activo/inactivo) al Excel de fondo
                fetch(API_CONTEO_URL, {
                    method: 'POST',
                    mode: 'no-cors', 
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ 
                        'hashtag': hashtag,
                        'estado': estadoSeleccionado // Se envía la variable extra
                    })
                }).then(() => console.log(`Clic registrado: ${hashtag} en columna ${estadoSeleccionado}`))
                  .catch(e => console.error("Error al registrar en Sheets:", e));

            } catch (err) {
                console.error('Error al copiar al portapapeles:', err);
                alert("Hubo un problema al copiar el texto. Verifica los permisos.");
            }
        });
        
        hashtagButtonsContainer.appendChild(btn);
    });
}

// 3. Conectar el buscador interno del menú
if (searchHashtag) {
    searchHashtag.addEventListener('input', (e) => {
        renderHashtags(e.target.value.trim());
    });
}


// 4. Cargamos todo por primera vez al entrar a la página
cargarHashtagsDesdeExcel();

// Arrancar el programa
cargarDatos();
obtenerHoraGuardada();
