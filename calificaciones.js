// 1. IMPORTACIONES DE FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, addDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. CONFIGURACIÓN
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

// 3. VARIABLES Y DOM
let calificacionesGlobales = [];
const tablasContainer = document.getElementById('tablasContainer');
const btnAgregarCalificacion = document.getElementById('btnAgregarCalificacion');
const selectCorte = document.getElementById('selectCorte');
const nuevoCorteInput = document.getElementById('nuevoCorteInput');

// 4. MOSTRAR/OCULTAR INPUT DE NUEVA TABLA SEGÚN EL SELECTOR
selectCorte.addEventListener('change', (e) => {
    if (e.target.value === 'nuevo') {
        nuevoCorteInput.style.display = 'block';
        nuevoCorteInput.focus();
    } else {
        nuevoCorteInput.style.display = 'none';
        nuevoCorteInput.value = '';
    }
});

// 5. LEER Y AGRUPAR DATOS (READ)
async function cargarCalificaciones() {
    try {
        const querySnapshot = await getDocs(collection(db, "calificaciones_chat"));
        calificacionesGlobales = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            calificacionesGlobales.push({
                id: doc.id,
                id_corte: data.id_corte || "Sin Grupo",
                semana: Number(data.semana) || 0,
                rango_fecha: data.rango_fecha || "",
                chat_calificacion: Number(data.chat_calificacion) || 0,
                calificacion_general: Number(data.calificacion_general) || 0,
                posicion: data.posicion || "",
                timestamp: data.timestamp || 0
            });
        });

        actualizarSelectorTablas();
        renderizarTablasAgrupadas();
    } catch (error) {
        console.error("Error al cargar calificaciones:", error);
        tablasContainer.innerHTML = `<p style="color:var(--danger-color); text-align:center;">Error al cargar los datos.</p>`;
    }
}

// 6. ACTUALIZAR LAS OPCIONES DEL SELECTOR CON LAS TABLAS EXISTENTES
function actualizarSelectorTablas() {
    // Guardar selección actual si la hay
    const valorActual = selectCorte.value;

    // Obtener nombres de tablas únicos
    const gruposUnicos = [...new Set(calificacionesGlobales.map(item => item.id_corte))].sort();

    // Reconstruir opciones
    selectCorte.innerHTML = `<option value="">-- Seleccionar Tabla --</option>`;
    
    gruposUnicos.forEach(nombre => {
        const option = document.createElement('option');
        option.value = nombre;
        option.textContent = nombre;
        selectCorte.appendChild(option);
    });

    const optionNueva = document.createElement('option');
    optionNueva.value = 'nuevo';
    optionNueva.textContent = '➕ Crear nueva tabla...';
    selectCorte.appendChild(optionNueva);

    // Mantener selección si aún existe
    if (gruposUnicos.includes(valorActual)) {
        selectCorte.value = valorActual;
    }
}

// 7. DIBUJAR TABLAS Y PROMEDIOS
function renderizarTablasAgrupadas() {
    tablasContainer.innerHTML = "";
    
    if (calificacionesGlobales.length === 0) {
        tablasContainer.innerHTML = `<p style="text-align:center; color: var(--text-muted); padding: 20px;">No hay calificaciones registradas. Selecciona "Crear nueva tabla..." arriba para empezar.</p>`;
        return;
    }

    const grupos = {};
    calificacionesGlobales.forEach(item => {
        if (!grupos[item.id_corte]) grupos[item.id_corte] = [];
        grupos[item.id_corte].push(item);
    });

    const nombresGrupos = Object.keys(grupos).sort();

    nombresGrupos.forEach(nombreGrupo => {
        const datosGrupo = grupos[nombreGrupo];
        datosGrupo.sort((a, b) => a.semana - b.semana);

        let suma = 0;
        let count = 0;
        datosGrupo.forEach(d => {
            if (d.chat_calificacion > 0) {
                suma += d.chat_calificacion;
                count++;
            }
        });
        const promedio = count > 0 ? (suma / count).toFixed(2) : 0;

        const tablaHTML = document.createElement('div');
        tablaHTML.className = 'table-container';
        tablaHTML.style.marginBottom = '20px';
        
        let htmlContent = `
            <div style="background: var(--input-bg); padding: 12px 20px; font-weight: 800; color: var(--success-color); border-bottom: 2px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; gap: 8px; align-items: center;">
                    <span>🏷️ Tabla:</span> <span style="color: var(--primary-color);">${nombreGrupo}</span>
                </div>
                <button class="theme-btn" onclick="agregarATabla('${nombreGrupo}')" style="padding: 4px 10px; margin: 0; font-size: 12px;" title="Seleccionar esta tabla rápidamente">📌 Seleccionar para agregar</button>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="padding: 12px 20px; text-align: left; border-bottom: 2px solid var(--border-color); color: var(--text-muted); font-size: 12px;">Semana</th>
                        <th style="padding: 12px 20px; text-align: left; border-bottom: 2px solid var(--border-color); color: var(--text-muted); font-size: 12px;">Fecha</th>
                        <th style="padding: 12px 20px; text-align: center; border-bottom: 2px solid var(--border-color); color: var(--text-muted); font-size: 12px;">Chat Calif</th>
                        <th style="padding: 12px 20px; text-align: center; border-bottom: 2px solid var(--border-color); color: var(--text-muted); font-size: 12px;">Calif Gral</th>
                        <th style="padding: 12px 20px; text-align: center; border-bottom: 2px solid var(--border-color); color: var(--text-muted); font-size: 12px;">Posición</th>
                        <th style="padding: 12px 20px; text-align: center; border-bottom: 2px solid var(--border-color); color: var(--text-muted); font-size: 12px;">Acción</th>
                    </tr>
                </thead>
                <tbody>
        `;

        datosGrupo.forEach(item => {
            htmlContent += `
                <tr style="border-bottom: 1px solid rgba(68, 71, 90, 0.5); transition: background 0.2s;" onmouseover="this.style.background='var(--surface-hover)'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 12px 20px; font-weight: 700;">${item.semana}</td>
                    <td style="padding: 12px 20px; color: var(--info-color);">${item.rango_fecha}</td>
                    <td style="padding: 12px 20px; text-align: center; font-weight: 700; color: #f1fa8c;">${item.chat_calificacion || '-'}</td>
                    <td style="padding: 12px 20px; text-align: center; font-weight: 700; color: #ffb86c;">${item.calificacion_general || '-'}</td>
                    <td style="padding: 12px 20px; text-align: center;">${item.posicion}</td>
                    <td style="padding: 12px 20px; text-align: center;">
                        <button class="theme-btn" onclick="editarCalificacion('${item.id}')" style="padding: 4px 8px; margin: 0; font-size: 12px;" title="Editar Registro">✏️ Editar</button>
                    </td>
                </tr>
            `;
        });

        htmlContent += `
                </tbody>
                <tfoot>
                    <tr style="background-color: #ff5555; color: white; font-weight: 800;">
                        <td colspan="2" style="padding: 12px 20px; text-align: center;">PROMEDIO FINAL</td>
                        <td style="padding: 12px 20px; text-align: center; font-size: 16px;">${promedio}</td>
                        <td colspan="3"></td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        tablaHTML.innerHTML = htmlContent;
        tablasContainer.appendChild(tablaHTML);
    });
}

// Función auxiliar para seleccionar la tabla haciendo clic en su botón superior
window.agregarATabla = function(nombreTabla) {
    selectCorte.value = nombreTabla;
    nuevoCorteInput.style.display = 'none';
    nuevoCorteInput.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('nuevaSemana').focus();
}

// 8. AGREGAR NUEVO REGISTRO (CREATE)
if (btnAgregarCalificacion) {
    btnAgregarCalificacion.addEventListener('click', async () => {
        let id_corte = selectCorte.value;

        if (id_corte === 'nuevo') {
            id_corte = nuevoCorteInput.value.trim();
        }

        if (!id_corte) {
            alert("Por favor, selecciona una tabla existente o crea una nueva.");
            selectCorte.focus();
            return;
        }

        const semana = Number(document.getElementById('nuevaSemana').value) || 0;
        const rango_fecha = document.getElementById('nuevaFecha').value.trim();
        const chat_cal = Number(document.getElementById('nuevoChatCal').value) || 0;
        const cal_gen = Number(document.getElementById('nuevaCalGen').value) || 0;
        const posicion = document.getElementById('nuevaPosicion').value.trim();

        if (!rango_fecha || semana === 0) return alert("Semana y Fecha son obligatorios.");

        btnAgregarCalificacion.disabled = true;
        btnAgregarCalificacion.innerText = "⏳";

        try {
            await addDoc(collection(db, "calificaciones_chat"), {
                id_corte: id_corte,
                semana: semana,
                rango_fecha: rango_fecha,
                chat_calificacion: chat_cal,
                calificacion_general: cal_gen,
                posicion: posicion,
                timestamp: Date.now()
            });

            // Limpiar campos de datos (mantiene la tabla seleccionada para seguir agregando rápido)
            document.getElementById('nuevaSemana').value = "";
            document.getElementById('nuevaFecha').value = "";
            document.getElementById('nuevoChatCal').value = "";
            document.getElementById('nuevaCalGen').value = "";
            document.getElementById('nuevaPosicion').value = "";

            cargarCalificaciones(); 
        } catch (error) {
            console.error("Error al agregar calificación:", error);
            alert("No se pudo agregar el registro.");
        } finally {
            btnAgregarCalificacion.innerText = "➕ Agregar";
            btnAgregarCalificacion.disabled = false;
        }
    });
}

// 9. EDITAR REGISTRO (UPDATE)
window.editarCalificacion = async function(id) {
    const item = calificacionesGlobales.find(d => d.id === id);
    if (!item) return;

    const nuevoCorte = prompt("Nombre de la Tabla / Corte:", item.id_corte);
    if (nuevoCorte === null) return;

    const nuevaSemana = prompt("Semana:", item.semana);
    if (nuevaSemana === null) return;

    const nuevaFecha = prompt("Rango de Fecha:", item.rango_fecha);
    if (nuevaFecha === null) return;

    const nuevoChat = prompt("Chat Calificación:", item.chat_calificacion);
    if (nuevoChat === null) return;

    const nuevaGen = prompt("Calificación General:", item.calificacion_general);
    if (nuevaGen === null) return;

    const nuevaPos = prompt("Posición:", item.posicion);
    if (nuevaPos === null) return;

    try {
        await updateDoc(doc(db, "calificaciones_chat", id), {
            id_corte: nuevoCorte.trim(),
            semana: Number(nuevaSemana) || 0,
            rango_fecha: nuevaFecha.trim(),
            chat_calificacion: Number(nuevoChat) || 0,
            calificacion_general: Number(nuevaGen) || 0,
            posicion: nuevaPos.trim()
        });
        
        cargarCalificaciones();
    } catch (error) {
        console.error("Error al actualizar:", error);
        alert("No se pudo actualizar el registro.");
    }
}

// 10. INICIAR CARGA DE DATOS
cargarCalificaciones();
