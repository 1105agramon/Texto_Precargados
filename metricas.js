// 1. IMPORTACIONES DE FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyC29o9h_DSec1S51A82we6e4nLg3f25mw0",
    authDomain: "gestor-operaciones-chat.firebaseapp.com",
    projectId: "gestor-operaciones-chat",
    storageBucket: "gestor-operaciones-chat.firebasestorage.app",
    messagingSenderId: "822477968222",
    appId: "1:822477968222:web:3667d900c181d13f7ef5cf",
    measurementId: "G-TGQYX3ZQ1G"
};

// 3. INICIALIZAR
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 4. ELEMENTOS DEL DOM
const fechaFiltro = document.getElementById('fechaFiltro');
const tbodyMetricas = document.getElementById('tbodyMetricas');

// 5. OBTENER FECHA ACTUAL (Ajustada a tu zona horaria)
const getHoyId = () => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000; 
    return (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
};

// Establecer la fecha de hoy en el calendario por defecto
fechaFiltro.value = getHoyId();

// 6. FUNCIÓN PARA CARGAR LOS CONTEOS DESDE FIREBASE
async function cargarMetricas() {
    const fecha = fechaFiltro.value;
    if(!fecha) return;

    tbodyMetricas.innerHTML = `<tr><td colspan="4" class="loading"><div class="loader"></div>Buscando métricas del ${fecha}...</td></tr>`;

    try {
        // Buscamos el documento en Firebase que tenga como ID la fecha seleccionada
        const docRef = doc(db, "metricas_hashtags", fecha);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            renderMetricas(docSnap.data());
        } else {
            // Si no hay datos ese día
            tbodyMetricas.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 40px; color: var(--text-muted); font-size: 15px;">No se registraron hashtags en la fecha: <strong>${fecha}</strong></td></tr>`;
        }
    } catch (error) {
        console.error("Error al obtener métricas:", error);
        tbodyMetricas.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--danger-color); padding: 20px;">Error al cargar las métricas. Verifica tu conexión a internet o los permisos.</td></tr>`;
    }
}

// 7. RENDERIZAR LOS DATOS EN LA TABLA
function renderMetricas(data) {
    tbodyMetricas.innerHTML = "";
    let hayDatos = false;

    // Convertimos el objeto de Firebase en un Array para poder ordenarlo alfabéticamente
    const etiquetas = Object.entries(data)
        .filter(([key]) => key.startsWith('#')) // Filtramos solo las llaves que sean hashtags
        .sort((a, b) => a[0].localeCompare(b[0])); // Orden alfabético

    etiquetas.forEach(([hashtag, valores]) => {
        hayDatos = true;
        
        // Obtenemos los valores; si no existe, es 0
        const activos = valores.activo || 0;
        const inactivos = valores.inactivo || 0;
        const total = activos + inactivos;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 700; color: var(--primary-color); font-family: 'Courier New', monospace; font-size: 15px;">${hashtag}</td>
            <td class="center-col" style="color: var(--success-color); font-weight: 700; font-size: 16px;">${activos}</td>
            <td class="center-col" style="color: #ff5555; font-weight: 700; font-size: 16px;">${inactivos}</td>
            <td class="center-col" style="font-weight: 800; font-size: 18px; color: var(--text-main);">${total}</td>
        `;
        tbodyMetricas.appendChild(tr);
    });

    if (!hayDatos) {
        tbodyMetricas.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 40px; color: var(--text-muted);">El registro existe, pero no tiene conteos de hashtags.</td></tr>`;
    }
}

// 8. ESCUCHAR CAMBIOS EN EL CALENDARIO
fechaFiltro.addEventListener('change', cargarMetricas);

// 9. CARGAR MÉTRICAS AL ABRIR LA PÁGINA
cargarMetricas();
