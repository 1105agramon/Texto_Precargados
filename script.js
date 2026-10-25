// ==========================================================
// 1. IMPORTACIONES Y CONFIGURACIÓN DE FIREBASE
// ==========================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, increment, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC29o9h_DSec1S51A82we6e4nLg3f25mw0",
    authDomain: "gestor-operaciones-chat.firebaseapp.com",
    projectId: "gestor-operaciones-chat",
    storageBucket: "gestor-operaciones-chat.firebasestorage.app",
    messagingSenderId: "822477968222",
    appId: "1:822477968222:web:3667d900c181d13f7ef5cf",
    measurementId: "G-TGQYX3ZQ1G"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================================
// 2. VARIABLES GLOBALES Y UTILIDADES
// ==========================================================
let datosGlobales = []; 
let listaHashtagsFirebase = []; 

// Función global para obtener la fecha de hoy ajustada a la zona horaria local
const getHoyId = () => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000; 
    return (new Date(Date.now() - tzOffset)).toISOString().split('T')[0]; 
};

// Mensajes fijos
const MENSAJE_LLAVE = `Es necesario que nos envíe un correo a chat.locatel@cdmx.gob.mx con la siguiente documentación en formato PDF: 📧📁\n\n1.- Identificación oficial vigente (INE, pasaporte, cédula profesional, cartilla del servicio militar, en caso de extranjeros FM2 o FM3). Preferentemente INE por ambos lados. 🪪\n\n2.- Una fotografía del titular de la cuenta Llave CDMX donde sostenga la identificación oficial. (Selfie) 🤳📸\n\n⚠️ IMPORTANTE: En el ASUNTO del correo deberá colocar el siguiente folio: CHAT-0000-000, mismo que tiene una vigencia de 72 horas. ⏳ En el CUERPO del correo deberá describir brevemente la complicación que está presentando agregando número telefónico de contacto. 📞 La información deberá ser enviada desde una cuenta de correo electrónico a la que tenga acceso en todo momento. 📑\n\nNOTA: Procure que las imágenes sean legibles para evitar contratiempos en su trámite. ✅`;
const textoActivo = `Por último, nos encantaría conocer su experiencia con nuestro servicio a través de una breve encuesta de satisfacción:  https://forms.gle/iXN2fQZvXikwM6HTA 📊📈\nGracias por utilizar los servicios de *0311Locatel, le atendió JOSE GRANADOS. Hasta luego. #LAPALABRADELBOTON`;
const textoInactivo = `Debido a inactividad, el chat de *0311 LOCATEL finaliza su sesión, le recordamos que también podemos brindarle información a través de redes sociales, en Facebook como Locatel Ciudad de México y en Twitter como @locatel_mx o marcando al *0311 las 24 horas del día los 365 días del año, si desea realizar un reporte sobre servicios en la CDMX puede realizarlo por medio de https://311locatel.cdmx.gob.mx/ Le atendió JOSE GRANADOS. Hasta luego. #LAPALABRADELBOTON`;

// ==========================================================
// 3. INTERFAZ (TEMA, SCROLL Y ACORDEÓN)
// ==========================================================
const body = document.body;
const themeToggle = document.getElementById('themeToggle');
const icon = themeToggle.querySelector('.icon');
const btnInicio = document.getElementById('btnInicio');
const contenedorTabla = document.querySelector('.table-container');

// Tema Oscuro / Claro
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

// Scroll al inicio
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

// Acordeón CRUD Plantillas
const toggleCrudBtn = document.getElementById('toggleCrudBtn');
const crudFormBody = document.getElementById('crudFormBody');
const crudToggleIcon = document.getElementById('crudToggleIcon');

if (toggleCrudBtn && crudFormBody) {
    toggleCrudBtn.addEventListener('click', () => {
        if (crudFormBody.style.display === 'none') {
            crudFormBody.style.display = 'block';
            crudToggleIcon.innerText = '▲';
            toggleCrudBtn.style.background = 'rgba(0,0,0,0.3)';
        } else {
            crudFormBody.style.display = 'none';
            crudToggleIcon.innerText = '▼';
            toggleCrudBtn.style.background = 'rgba(0,0,0,0.15)';
        }
    });
}

// ==========================================================
// 4. MÓDULO: HORA DE COMIDA
// ==========================================================
const btnGuardarHora = document.getElementById('btnGuardarHora');
const horaInput = document.getElementById('horaInput');

async function obtenerHoraGuardada() {
    if (!horaInput) return;
    try {
        const docRef = doc(db, "registro_comidas", getHoyId());
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().hora_comida) {
            horaInput.value = docSnap.data().hora_comida;
        }
    } catch (error) {
        console.error("Error al leer la hora:", error);
    }
}

if (btnGuardarHora) {
    btnGuardarHora.addEventListener('click', async () => {
        const horaValor = horaInput.value;
        if (!horaValor) return alert("Por favor, selecciona una hora primero.");

        btnGuardarHora.disabled = true;
        btnGuardarHora.innerText = "⏳";

        try {
            await setDoc(doc(db, "registro_comidas", getHoyId()), {
                fecha: getHoyId(),
                hora_comida: horaValor
            }, { merge: true });
            
            btnGuardarHora.innerText = "✅";
            setTimeout(() => {
                btnGuardarHora.innerText = "💾";
                btnGuardarHora.disabled = false;
            }, 2000);
        } catch (error) {
            console.error("Error al guardar la hora:", error);
            alert("Hubo un error al guardar la hora.");
            btnGuardarHora.innerText = "💾";
            btnGuardarHora.disabled = false;
        }
    });
}

// ==========================================================
// 5. MÓDULO: TABLA PRINCIPAL (PLANTILLAS DE RESPUESTA)
// ==========================================================
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearSearch');

async function cargarDatos() {
    try {
        const querySnapshot = await getDocs(collection(db, "plantillas_respuestas"));
        datosGlobales = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            datosGlobales.push({
                id: doc.id,
                tema: data.tema || "",
                subtema: data.subtema || "",
                categoria: data.categoria || "",
                texto: data.texto || "",
                hashtag: data.hashtag || "",
                timestamp: data.timestamp || 0 
            });
        });

        // Ordenar del más antiguo al más nuevo para no mover el orden original
        datosGlobales.sort((a, b) => a.timestamp - b.timestamp);
        renderizarTabla(datosGlobales);

    } catch (error) {
        console.error("Error al cargar Firestore:", error);
        tableBody.innerHTML = `<tr><td colspan="6" style="color:var(--danger-color); text-align:center;">Error al cargar los datos. Revisa las reglas de seguridad.</td></tr>`;
    }
}

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
            <td class="text-col editable-cell" contenteditable="true" spellcheck="false" title="Haz clic sobre el texto para editarlo" onblur="guardarEdicionPlantilla('${item.id}', this)">${item.texto}</td>
            <td>${item.hashtag}</td>
            <td class="center-col" style="display: flex; gap: 5px; justify-content: center;">
                <button class="copy-btn" onclick="copiarAlPortapapeles(this, event)">Copiar</button>
                <button class="theme-btn" onclick="editarRegistro('${item.id}', event)" style="padding: 6px 10px; margin: 0;" title="Editar Tema, Subtema, etc.">✏️</button>
                <button class="theme-btn" onclick="eliminarPlantilla('${item.id}', event)" style="padding: 6px 10px; margin: 0;" title="Eliminar respuesta">🗑️</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// Búsqueda inteligente
searchInput.addEventListener('input', function(e) {
    const terminoBusqueda = e.target.value.toLowerCase().trim();
    clearBtn.style.display = terminoBusqueda.length > 0 ? 'block' : 'none';

    if (terminoBusqueda === "") return renderizarTabla(datosGlobales);

    const palabras = terminoBusqueda.split(/\s+/);
    const datosFiltrados = datosGlobales.filter(item => {
        const contenidoFila = `${item.tema} ${item.subtema} ${item.categoria} ${item.texto} ${item.hashtag}`.toLowerCase();
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

// ==========================================================
// 6. CRUD: PLANTILLAS DE RESPUESTA
// ==========================================================
const btnAgregarPlantilla = document.getElementById('btnAgregarPlantilla');
if (btnAgregarPlantilla) {
    btnAgregarPlantilla.addEventListener('click', async () => {
        const tema = document.getElementById('nuevoTema').value.trim();
        const subtema = document.getElementById('nuevoSubtema').value.trim();
        const categoria = document.getElementById('nuevaCategoria').value.trim();
        const texto = document.getElementById('nuevoTexto').value.trim();
        let hashtag = document.getElementById('nuevoHashtagPlantilla').value.trim().toUpperCase();

        if (!texto || !tema) return alert("El Tema y el Texto son obligatorios.");
        if (hashtag && !hashtag.startsWith('#') && hashtag !== "NA") hashtag = '#' + hashtag;

        btnAgregarPlantilla.disabled = true;
        btnAgregarPlantilla.innerText = "⏳";

        try {
            await addDoc(collection(db, "plantillas_respuestas"), {
                tema, subtema, categoria, texto, hashtag,
                timestamp: Date.now() // Timestamp exacto para ordenar
            });

            document.getElementById('nuevoTema').value = "";
            document.getElementById('nuevoSubtema').value = "";
            document.getElementById('nuevaCategoria').value = "";
            document.getElementById('nuevoTexto').value = "";
            document.getElementById('nuevoHashtagPlantilla').value = "";

            cargarDatos(); 
        } catch (error) {
            console.error("Error al agregar plantilla:", error);
            alert("Hubo un error al guardar la plantilla.");
        } finally {
            btnAgregarPlantilla.innerText = "➕ Agregar";
            btnAgregarPlantilla.disabled = false;
        }
    });
}

window.guardarEdicionPlantilla = async function(id, celda) {
    const nuevoTexto = celda.innerText.trim();
    try {
        await updateDoc(doc(db, "plantillas_respuestas", id), { texto: nuevoTexto });
        celda.style.backgroundColor = "rgba(80, 250, 123, 0.2)"; 
        setTimeout(() => celda.style.backgroundColor = "", 1500);
        
        const itemIndex = datosGlobales.findIndex(d => d.id === id);
        if(itemIndex > -1) datosGlobales[itemIndex].texto = nuevoTexto;
    } catch (error) {
        console.error("Error al actualizar el texto:", error);
        celda.style.backgroundColor = "rgba(255, 85, 85, 0.2)"; 
    }
}

window.editarRegistro = async function(id, event) {
    if (event) event.stopPropagation(); 
    
    const item = datosGlobales.find(d => d.id === id);
    if (!item) return;

    const nuevoTema = prompt("Edita el Tema:", item.tema);
    if (nuevoTema === null) return; 

    const nuevoSubtema = prompt("Edita el Subtema:", item.subtema);
    if (nuevoSubtema === null) return;

    const nuevaCategoria = prompt("Edita la Categoría:", item.categoria);
    if (nuevaCategoria === null) return;

    let nuevoHashtag = prompt("Edita el Hashtag:", item.hashtag);
    if (nuevoHashtag === null) return;

    nuevoHashtag = nuevoHashtag.trim().toUpperCase();
    if (nuevoHashtag && !nuevoHashtag.startsWith('#') && nuevoHashtag !== "NA") {
        nuevoHashtag = '#' + nuevoHashtag;
    }

    try {
        await updateDoc(doc(db, "plantillas_respuestas", id), {
            tema: nuevoTema.trim(),
            subtema: nuevoSubtema.trim(),
            categoria: nuevaCategoria.trim(),
            hashtag: nuevoHashtag
        });
        cargarDatos(); 
    } catch (error) {
        console.error("Error al actualizar el registro:", error);
        alert("No se pudo actualizar la información.");
    }
}

window.eliminarPlantilla = async function(id, event) {
    if (event) event.stopPropagation(); 
    if (confirm("¿Estás seguro de que deseas eliminar esta respuesta del sistema?")) {
        try {
            await deleteDoc(doc(db, "plantillas_respuestas", id));
            cargarDatos(); 
        } catch (error) {
            console.error("Error al eliminar:", error);
            alert("No se pudo eliminar la respuesta.");
        }
    }
}

// ==========================================================
// 7. FUNCIONES DE COPIADO GENERAL
// ==========================================================
const campoFolioHeader = document.getElementById('folioInput');

window.copiarDesdeFila = async function(fila, event) {
    if (event && event.target.classList.contains('text-col')) return; 

    const boton = fila.querySelector('.copy-btn');
    const celdaTexto = fila.querySelector('.text-col');
    
    let textoHTML = celdaTexto.innerHTML;
    let textoPlano = celdaTexto.innerText; 
    const valorFolio = campoFolioHeader.value.trim();

    if (textoHTML.includes("0000-000") && valorFolio !== "") {
        textoHTML = textoHTML.replace(/0000-000/g, valorFolio);
        textoPlano = textoPlano.replace(/0000-000/g, valorFolio);
    }

    try {
        const contieneImagen = textoHTML.includes('<img');
        if (contieneImagen) {
            const type = "text/html";
            const data = [new ClipboardItem({ 
                [type]: new Blob([textoHTML], { type }), 
                "text/plain": new Blob([textoPlano], { type: "text/plain" }) 
            })];
            await navigator.clipboard.write(data);
        } else {
            await navigator.clipboard.writeText(textoPlano);
        }
        
        const textoOriginal = boton.innerText;
        boton.innerText = "¡Copiado!";
        boton.classList.add('copied');
        fila.style.backgroundColor = document.body.classList.contains('light-mode') ? "rgba(4, 255, 109, 0.4)" : "rgba(62, 228, 112, 0.44)"; 

        setTimeout(() => {
            boton.innerText = textoOriginal;
            boton.classList.remove('copied');
            fila.style.backgroundColor = ""; 
        }, 1500);
    } catch (err) {
        console.error('Error al copiar desde fila: ', err);
        await navigator.clipboard.writeText(textoPlano).catch(e => console.error("Fallo definitivo: ", e));
    }
}

window.copiarAlPortapapeles = async function(boton, event) {
    if(event) event.stopPropagation();
    // Reutiliza la misma lógica, emulando el clic en la fila
    copiarDesdeFila(boton.closest('tr'), null);
}

// ==========================================================
// 8. COPIADO DE CONTACTO Y FOLIO FIJO
// ==========================================================
const btnCopiarFolio = document.getElementById('btnCopiarFolio');
if (btnCopiarFolio) {
    btnCopiarFolio.addEventListener('click', async () => {
        try {
            let textoFinal = MENSAJE_LLAVE;
            const valorFolio = campoFolioHeader.value.trim();
            if (valorFolio !== "") textoFinal = textoFinal.replace(/0000-000/g, valorFolio);

            await navigator.clipboard.writeText(textoFinal);
            const textoOriginal = btnCopiarFolio.innerText;
            btnCopiarFolio.innerText = "¡Copiado!";
            btnCopiarFolio.classList.add('copied');
            setTimeout(() => {
                btnCopiarFolio.innerText = textoOriginal;
                btnCopiarFolio.classList.remove('copied');
            }, 1500);
        } catch (err) {
            console.error('Error al copiar folio: ', err);
        }
    });
}

function enmascararTelefono(tel) {
    return tel.length === 10 ? tel.substring(0, 3) + "****" + tel.substring(7) : tel; 
}

function enmascararCorreo(correo) {
    const partes = correo.split('@');
    if (partes.length !== 2) return correo; 

    const usuario = partes[0];
    const dominio = partes[1];
    let usuarioOculto = usuario;

    if (usuario.length >= 6) usuarioOculto = usuario.substring(0, 3) + "****" + usuario.substring(usuario.length - 3);
    else if (usuario.length >= 3) usuarioOculto = usuario.substring(0, 1) + "****" + usuario.substring(usuario.length - 1);
    else usuarioOculto = "****";

    return usuarioOculto + "@" + dominio;
}

const btnCopiarContacto = document.getElementById('btnCopiarContacto');
const telefonoInput = document.getElementById('telefonoInput');
const correoInput = document.getElementById('correoInput');

if (btnCopiarContacto) {
    btnCopiarContacto.addEventListener('click', async () => {
        const telInput = telefonoInput.value.trim();
        const emailInput = correoInput.value.trim();
        let textoFinal = "";

        const telOculto = telInput !== "" ? enmascararTelefono(telInput) : "";
        const emailOculto = emailInput !== "" ? enmascararCorreo(emailInput) : "";

        if (telInput !== "" && emailInput !== "") {
            textoFinal = `En su Cuenta Llave se encuentran registrados los siguientes medios de contacto 😊, ¿Podría confirmarme si actualmente tiene acceso a ellos? 📩📱\nTeléfono: ${telOculto}\nCorreo: ${emailOculto}`;
        } else if (telInput !== "" && emailInput === "") {
            textoFinal = `En su Cuenta Llave, su correo electrónico se encuentra registrado correctamente 😊.\n¿Podría indicarme si tiene acceso al número celular que se encuentra registrado? 📱\nNúmero de celular: ${telOculto}`;
        } else if (emailInput !== "" && telInput === "") {
            textoFinal = `En su Cuenta Llave, su número celular se encuentra registrado correctamente 😊.\n¿Podría indicarme si tiene acceso al correo electrónico que se encuentra registrado? 📩\nCorreo: ${emailOculto}`;
        } else {
            return alert("Por favor, ingresa al menos el teléfono o el correo.");
        }

        try {
            await navigator.clipboard.writeText(textoFinal);
            const textoOriginal = btnCopiarContacto.innerText;
            btnCopiarContacto.innerText = "¡Copiado!";
            btnCopiarContacto.classList.add('copied');

            telefonoInput.value = "";
            correoInput.value = "";
            setTimeout(() => {
                btnCopiarContacto.innerText = textoOriginal;
                btnCopiarContacto.classList.remove('copied');
            }, 1500);
        } catch (err) {
            console.error('Error al copiar contacto: ', err);
            alert("No se pudo copiar el texto.");
        }
    });
}

// ==========================================================
// 9. MENÚ LATERAL Y CRUD DE HASHTAGS
// ==========================================================
const btnMenuDespedidas = document.getElementById('btnMenuDespedidas');
const sideMenuDespedidas = document.getElementById('sideMenuDespedidas');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const searchHashtag = document.getElementById('searchHashtag');
const hashtagButtonsContainer = document.getElementById('hashtagButtonsContainer');
const btnAgregarHashtag = document.getElementById('btnAgregarHashtag');
const nuevoHashtagInput = document.getElementById('nuevoHashtagInput');

async function cargarHashtagsDesdeFirebase() {
    try {
        const querySnapshot = await getDocs(collection(db, "catalogo_hashtags"));
        listaHashtagsFirebase = [];
        
        querySnapshot.forEach((doc) => {
            listaHashtagsFirebase.push({ id: doc.id, nombre: doc.data().nombre });
        });
        
        if(!listaHashtagsFirebase.some(h => h.nombre === "#INACTIVIDAD")) {
            listaHashtagsFirebase.unshift({ id: "estatico-inactividad", nombre: "#INACTIVIDAD" });
        }
        renderHashtags(); 
    } catch (error) {
        console.error("Error al cargar hashtags del CRUD:", error);
    }
}

if (typeof btnAgregarHashtag !== 'undefined' && btnAgregarHashtag) {
    btnAgregarHashtag.addEventListener('click', async () => {
        let valor = nuevoHashtagInput.value.trim().toUpperCase();
        if(!valor) return;
        if(!valor.startsWith('#')) valor = '#' + valor;

        btnAgregarHashtag.disabled = true;
        btnAgregarHashtag.innerText = "⏳";

        try {
            await addDoc(collection(db, "catalogo_hashtags"), { nombre: valor });
            nuevoHashtagInput.value = "";
            await cargarHashtagsDesdeFirebase(); 
        } catch (error) {
            console.error("Error al crear hashtag:", error);
            alert("No se pudo agregar el hashtag.");
        } finally {
            btnAgregarHashtag.innerText = "➕";
            btnAgregarHashtag.disabled = false;
        }
    });
}

if (btnMenuDespedidas && sideMenuDespedidas) {
    btnMenuDespedidas.addEventListener('click', () => {
        sideMenuDespedidas.classList.add('open');
        cargarHashtagsDesdeFirebase(); 
    });
}
if (closeMenuBtn) {
    closeMenuBtn.addEventListener('click', () => {
        sideMenuDespedidas.classList.remove('open');
    });
}

function renderHashtags(filtro = "") {
    hashtagButtonsContainer.innerHTML = "";
    const filtrados = listaHashtagsFirebase.filter(h => h.nombre.toLowerCase().includes(filtro.toLowerCase()));
    
    if(filtrados.length === 0) {
        hashtagButtonsContainer.innerHTML = `<p style="text-align:center; color: var(--text-muted); font-size:14px;">No se encontraron etiquetas.</p>`;
        return;
    }

    filtrados.forEach(hashtagObj => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '6px';
        row.style.alignItems = 'stretch';
        
        const btn = document.createElement('button');
        btn.className = 'hashtag-btn';
        btn.style.flex = '1';
        btn.style.margin = '0'; 
        btn.innerHTML = `<span>${hashtagObj.nombre}</span> <span style="font-size: 14px; opacity: 0.7;">📋</span>`;
        
        btn.addEventListener('click', async () => {
            let estadoSeleccionado = document.querySelector('input[name="estadoDespedida"]:checked').value;
            if (hashtagObj.nombre === "#INACTIVIDAD") estadoSeleccionado = "inactivo";

            let textoFinal = estadoSeleccionado === "activo" ? textoActivo : textoInactivo;
            textoFinal = textoFinal.replace('#LAPALABRADELBOTON', hashtagObj.nombre);
            
            try {
                await navigator.clipboard.writeText(textoFinal);
                btn.classList.add('copied');
                btn.innerHTML = `<span>¡Copiado!</span> <span>✅</span>`;
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = `<span>${hashtagObj.nombre}</span> <span style="font-size: 14px; opacity: 0.7;">📋</span>`;
                }, 1500);

                const diaActual = getHoyId();
                const hashtagRef = doc(db, "metricas_hashtags", diaActual);
                const updateData = { fecha: diaActual };
                updateData[`${hashtagObj.nombre}.${estadoSeleccionado}`] = increment(1);
                await setDoc(hashtagRef, updateData, { merge: true });

            } catch (err) {
                alert("Hubo un problema al copiar.");
            }
        });
        
        row.appendChild(btn);

        if (hashtagObj.id !== "estatico-inactividad") {
            const btnEdit = document.createElement('button');
            btnEdit.className = 'theme-btn';
            btnEdit.innerHTML = '✏️';
            btnEdit.style.padding = '0 12px';
            btnEdit.style.margin = '0';
            btnEdit.title = "Editar";
            btnEdit.addEventListener('click', async () => {
                let nuevoNombre = prompt("Editar hashtag:", hashtagObj.nombre);
                if (nuevoNombre && nuevoNombre.trim() !== "") {
                    nuevoNombre = nuevoNombre.trim().toUpperCase();
                    if(!nuevoNombre.startsWith('#')) nuevoNombre = '#' + nuevoNombre;
                    try {
                        await updateDoc(doc(db, "catalogo_hashtags", hashtagObj.id), { nombre: nuevoNombre });
                        cargarHashtagsDesdeFirebase();
                    } catch (error) {
                        alert("Error al actualizar.");
                    }
                }
            });
            row.appendChild(btnEdit);

            const btnDel = document.createElement('button');
            btnDel.className = 'theme-btn';
            btnDel.innerHTML = '🗑️';
            btnDel.style.padding = '0 12px';
            btnDel.style.margin = '0';
            btnDel.title = "Eliminar";
            btnDel.addEventListener('click', async () => {
                if (confirm(`¿Estás seguro de eliminar el hashtag ${hashtagObj.nombre}?`)) {
                    try {
                        await deleteDoc(doc(db, "catalogo_hashtags", hashtagObj.id));
                        cargarHashtagsDesdeFirebase();
                    } catch (error) {
                        alert("Error al eliminar.");
                    }
                }
            });
            row.appendChild(btnDel);
        }

        hashtagButtonsContainer.appendChild(row);
    });
}

if (searchHashtag) {
    searchHashtag.addEventListener('input', (e) => {
        renderHashtags(e.target.value.trim());
    });
}

// ==========================================================
// 10. ARRANQUE DEL PROGRAMA
// ==========================================================
cargarDatos();
obtenerHoraGuardada();
