// 1. IMPORTACIONES DE FIREBASE (Versión CDN para navegadores)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, increment, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. TU CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyC29o9h_DSec1S51A82we6e4nLg3f25mw0",
  authDomain: "gestor-operaciones-chat.firebaseapp.com",
  projectId: "gestor-operaciones-chat",
  storageBucket: "gestor-operaciones-chat.firebasestorage.app",
  messagingSenderId: "822477968222",
  appId: "1:822477968222:web:3667d900c181d13f7ef5cf",
  measurementId: "G-TGQYX3ZQ1G"
};

// 3. INICIALIZAR FIREBASE Y FIRESTORE
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================================
// VARIABLES GLOBALES Y ELEMENTOS DEL DOM
// ==========================================================
let datosGlobales = []; 
let listaHashtags = []; 

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

// ==========================================================
// MODO CLARO / OSCURO
// ==========================================================
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

// ==========================================================
// SCROLL AL INICIO
// ==========================================================
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

// ==========================================================
// CARGA DE DATOS DESDE FIREBASE FIRESTORE
// ==========================================================
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
                hashtag: data.hashtag || ""
            });
        });

        renderizarTabla(datosGlobales);
        cargarHashtagsDesdeFirebase(); 

    } catch (error) {
        console.error("Error al cargar Firestore:", error);
        tableBody.innerHTML = `<tr><td colspan="6" style="color:var(--danger-color); text-align:center;">Error al cargar los datos. Revisa las reglas de seguridad de Firestore.</td></tr>`;
    }
}

// ==========================================================
// RENDERIZAR LA TABLA Y EDICIÓN
// ==========================================================
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

// ==========================================================
// FILTRO INTELIGENTE
// ==========================================================
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

// ==========================================================
// FUNCIONES DE COPIADO ACTUALIZADAS PARA MÓDULOS (window.)
// ==========================================================
window.copiarDesdeFila = async function(fila, event) {
    if (event && event.target.classList.contains('text-col')) {
        return; 
    }

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
            const blobHTML = new Blob([textoHTML], { type });
            const blobText = new Blob([textoPlano], { type: "text/plain" });
            const data = [new ClipboardItem({ 
                [type]: blobHTML, 
                "text/plain": blobText 
            })];
            await navigator.clipboard.write(data);
        } else {
            await navigator.clipboard.writeText(textoPlano);
        }
        
        const textoOriginal = boton.innerText;
        boton.innerText = "¡Copiado!";
        boton.classList.add('copied');

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
        await navigator.clipboard.writeText(textoPlano).catch(e => console.error("Fallo definitivo: ", e));
    }
}

window.copiarAlPortapapeles = async function(boton, event) {
    if(event) event.stopPropagation();

    const fila = boton.closest('tr');
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
            const blobHTML = new Blob([textoHTML], { type });
            const blobText = new Blob([textoPlano], { type: "text/plain" });
            const data = [new ClipboardItem({ 
                [type]: blobHTML, 
                "text/plain": blobText 
            })];
            await navigator.clipboard.write(data);
        } else {
            await navigator.clipboard.writeText(textoPlano);
        }
        
        const textoOriginal = boton.innerText;
        boton.innerText = "¡Copiado!";
        boton.classList.add('copied');
        
        setTimeout(() => {
            boton.innerText = textoOriginal;
            boton.classList.remove('copied');
        }, 1500);

    } catch (err) {
        console.error('Error al copiar: ', err);
        await navigator.clipboard.writeText(textoPlano).catch(e => console.error("Fallo definitivo: ", e));
    }
}

// ==========================================================
// BOTÓN HEADER "COPIAR LLAVE"
// ==========================================================
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

// ==========================================================
// VALIDACIÓN DE MEDIOS DE CONTACTO
// ==========================================================
function enmascararTelefono(tel) {
    if (tel.length === 10) {
        return tel.substring(0, 3) + "****" + tel.substring(7);
    }
    return tel; 
}

function enmascararCorreo(correo) {
    const partes = correo.split('@');
    if (partes.length !== 2) return correo; 

    const usuario = partes[0];
    const dominio = partes[1];
    let usuarioOculto = usuario;

    if (usuario.length >= 6) {
        usuarioOculto = usuario.substring(0, 3) + "****" + usuario.substring(usuario.length - 3);
    } else if (usuario.length >= 3) {
        usuarioOculto = usuario.substring(0, 1) + "****" + usuario.substring(usuario.length - 1);
    } else {
        usuarioOculto = "****";
    }

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
            console.error('Error al copiar el mensaje de contacto: ', err);
            alert("No se pudo copiar el texto. Verifica los permisos de tu navegador.");
        }
    });
}

// ==========================================================
// REGISTRO DE HORA DE COMIDA EN FIREBASE
// ==========================================================
const btnGuardarHora = document.getElementById('btnGuardarHora');
const horaInput = document.getElementById('horaInput');

// Función auxiliar para obtener la fecha en formato YYYY-MM-DD
const getHoyId = () => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000; 
    return (new Date(Date.now() - tzOffset)).toISOString().split('T')[0]; 
};

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

        if (!horaValor) {
            alert("Por favor, selecciona una hora primero.");
            return;
        }

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
// LÓGICA DEL MENÚ LATERAL Y CONTEO DE DESPEDIDAS EN FIREBASE
// ==========================================================
const btnMenuDespedidas = document.getElementById('btnMenuDespedidas');
const sideMenuDespedidas = document.getElementById('sideMenuDespedidas');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const searchHashtag = document.getElementById('searchHashtag');
const hashtagButtonsContainer = document.getElementById('hashtagButtonsContainer');

const textoActivo = `Por último, nos encantaría conocer su experiencia con nuestro servicio a través de una breve encuesta de satisfacción:  https://forms.gle/iXN2fQZvXikwM6HTA 📊📈\nGracias por utilizar los servicios de *0311Locatel, le atendió JOSE GRANADOS. Hasta luego. #LAPALABRADELBOTON`;

const textoInactivo = `Debido a inactividad, el chat de *0311 LOCATEL finaliza su sesión, le recordamos que también podemos brindarle información a través de redes sociales, en Facebook como Locatel Ciudad de México y en Twitter como @locatel_mx o marcando al *0311 las 24 horas del día los 365 días del año, si desea realizar un reporte sobre servicios en la CDMX puede realizarlo por medio de https://311locatel.cdmx.gob.mx/ Le atendió JOSE GRANADOS. Hasta luego. #LAPALABRADELBOTON`;

function cargarHashtagsDesdeFirebase() {
    // Extrae los hashtags únicos directamente de la colección principal
    const hashtagsUnicos = [...new Set(datosGlobales
        .map(d => d.hashtag)
        .filter(h => h && h !== "NA" && h.startsWith("#")))
    ];
    
    // Añadimos manualmente el de inactividad que se usa por defecto
    if(!hashtagsUnicos.includes("#INACTIVIDAD")) hashtagsUnicos.unshift("#INACTIVIDAD");
    
    listaHashtags = hashtagsUnicos;
    renderHashtags(); 
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
            let estadoSeleccionado = document.querySelector('input[name="estadoDespedida"]:checked').value;
            
            // Si es inactividad forzamos el estado a inactivo
            if (hashtag === "#INACTIVIDAD") {
                estadoSeleccionado = "inactivo";
            }

            let textoFinal = estadoSeleccionado === "activo" ? textoActivo : textoInactivo;
            textoFinal = textoFinal.replace('#LAPALABRADELBOTON', hashtag);
            
            try {
                await navigator.clipboard.writeText(textoFinal);
                
                btn.classList.add('copied');
                btn.innerHTML = `<span>¡Copiado!</span> <span>✅</span>`;
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = `<span>${hashtag}</span> <span style="font-size: 14px; opacity: 0.7;">📋</span>`;
                }, 1500);

                // --- REGISTRAR CONTEO EN FIREBASE ---
                const diaActual = getHoyId();
                const hashtagRef = doc(db, "metricas_hashtags", diaActual);
                
                // Creamos un objeto dinámico para no sobreescribir los otros hashtags del mismo día
                const updateData = { fecha: diaActual };
                // Firebase usa notación de punto para modificar propiedades anidadas
                updateData[`${hashtag}.${estadoSeleccionado}`] = increment(1);
                
                await setDoc(hashtagRef, updateData, { merge: true });
                console.log(`Clic registrado en Firebase: ${hashtag} -> ${estadoSeleccionado}`);

            } catch (err) {
                console.error('Error al procesar el hashtag:', err);
                alert("Hubo un problema. Verifica los permisos del portapapeles o la conexión a Firebase.");
            }
        });
        
        hashtagButtonsContainer.appendChild(btn);
    });
}

if (searchHashtag) {
    searchHashtag.addEventListener('input', (e) => {
        renderHashtags(e.target.value.trim());
    });
}

// ==========================================================
// ARRANQUE DEL PROGRAMA
// ==========================================================
cargarDatos();
obtenerHoraGuardada();
