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

// 4. LEER Y AGRUPAR DATOS (READ)
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

        renderizarTablasAgrupadas();
    } catch (error) {
        console.error("Error al cargar calificaciones:", error);
        tablasContainer.innerHTML = `<p style="color:var(--danger-color); text-align:center;">Error al cargar los datos.</p>`;
    }
}

// 5. DIBUJAR TABLAS Y PROMEDIOS
function renderizarTablasAgrupadas() {
    tablasContainer.innerHTML = "";
    
    if (calificacionesGlobales.length === 0) {
        tablasContainer.innerHTML = `<p style="text-align:center; color: var(--text-muted);">No hay calificaciones registradas.</p>`;
        return;
    }

    // Agrupar los datos por "id_corte" (Ej: Tabla_1, Tabla_2)
    const grupos = {};
    calificacionesGlobales.forEach(item => {
        if (!grupos[item.id_corte]) grupos[item.id_corte] = [];
        grupos[item.id_corte].push(item);
    });

    // Ordenar los grupos por nombre
    const nombresGrupos = Object.keys(grupos).sort();

    nombresGrupos.forEach(nombreGrupo => {
        const datosGrupo = grupos[nombreGrupo];
        
        // Ordenar internamente por número de semana
        datosGrupo.sort((a, b) => a.semana - b.semana);

        // Calcular promedio de "chat_calificacion" ignorando los 0
        let suma = 0;
        let count = 0;
        datosGrupo.forEach(d => {
            if (d.chat_calificacion > 0) {
                suma += d.chat_calificacion;
                count++;
            }
        });
        const promedio = count > 0 ? (suma / count).toFixed(2) : 0;

        // Crear contenedor de la tabla
        const tablaHTML = document.createElement('div');
        tablaHTML.className = 'table-container';
        tablaHTML.style.marginBottom = '20px';
        
        // Cabecera con nombre del Corte
        let htmlContent = `
            <div style="background: var(--input-bg); padding: 12px 20px; font-weight: 800; color: var(--success-color); border-bottom: 2px solid var(--border-color); display: flex; align-items: center; gap: 8px;">
                <span>🏷️ Corte:</span> <span style="color: var(--primary-color);">${nombreGrupo}</span>
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

        // Filas de datos
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

        // Fila roja final con el promedio (igual que tu Excel)
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

// 6. AGREGAR NUEVO REGISTRO (CREATE)
if (btnAgregarCalificacion) {
    btnAgregarCalificacion.addEventListener('click', async () => {
        const id_corte = document.getElementById('nuevoCorte').value.trim() || "Tabla_1";
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

            // Limpiar inputs
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

// 7. EDITAR REGISTRO (UPDATE - SIN DELETE)
window.editarCalificacion = async function(id) {
    const item = calificacionesGlobales.find(d => d.id === id);
    if (!item) return;

    const nuevoCorte = prompt("Nombre del Corte/Tabla:", item.id_corte);
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

// 8. INICIAR CARGA DE DATOS
cargarCalificaciones();
