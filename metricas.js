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
        const docRef = doc(db, "metricas_hashtags", fecha);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            renderMetricas(docSnap.data());
        } else {
            tbodyMetricas.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 40px; color: var(--text-muted); font-size: 15px;">No se registraron hashtags en la fecha: <strong>${fecha}</strong></td></tr>`;
        }
    } catch (error) {
        console.error("Error al obtener métricas:", error);
        tbodyMetricas.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--danger-color); padding: 20px;">Error al cargar las métricas. Verifica tu conexión a internet o los permisos.</td></tr>`;
    }
}

// 7. RENDERIZAR LOS DATOS EN LA TABLA (AHORA LEE AMBOS FORMATOS)
function renderMetricas(data) {
    tbodyMetricas.innerHTML = "";
    let hayDatos = false;
    
    // Objeto para unificar todos los conteos limpios
    const hashtagMap = {};

    Object.entries(data).forEach(([key, value]) => {
        if (key === 'fecha') return;

        // Si Firebase lo guardó con el formato antiguo (ej: "#079.activo")
        if (key.includes('.')) {
            const partes = key.split('.');
            const nombre = partes[0]; // Extrae el "#079"
            const estado = partes[1]; // Extrae el "activo"
            
            if (!hashtagMap[nombre]) hashtagMap[nombre] = { activo: 0, inactivo: 0 };
            
            if (estado === 'activo' || estado === 'inactivo') {
                // Recupera el número exacto de clics que tenías guardados
                hashtagMap[nombre][estado] += (typeof value === 'number' ? value : 0);
            }
        } 
        // Si Firebase lo guardó con el formato nuevo correcto
        else if (key.startsWith('#') && typeof value === 'object') {
            if (!hashtagMap[key]) hashtagMap[key] = { activo: 0, inactivo: 0 };
            hashtagMap[key].activo += (value.activo || 0);
            hashtagMap[key].inactivo += (value.inactivo || 0);
        }
    });

    // Convertir el mapa unificado a un arreglo y ordenarlo alfabéticamente
    const etiquetas = Object.entries(hashtagMap)
        .sort((a, b) => a[0].localeCompare(b[0]));

    // Dibujar las filas en la tabla
    etiquetas.forEach(([hashtag, valores]) => {
        hayDatos = true;
        
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
        tbodyMetricas.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 40px; color: var(--text-muted);">El registro existe, pero no tiene conteos de hashtags válidos.</td></tr>`;
    }
}

// 8. ESCUCHAR CAMBIOS EN EL CALENDARIO
fechaFiltro.addEventListener('change', cargarMetricas);

// 9. CARGAR MÉTRICAS AL ABRIR LA PÁGINA
cargarMetricas();
