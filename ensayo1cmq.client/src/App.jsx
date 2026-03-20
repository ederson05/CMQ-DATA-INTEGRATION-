import { useEffect, useState } from "react";
import "./App.css";

// ─── Hora en tiempo real ──────────────────────────────────────────────────────
function useCurrentTime() {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(t);
    }, []);
    return time;
}

const API_URL = "https://localhost:7169/api";

// ─── Sistema de Toast (reemplaza alert) ──────────────────────────────────────
function ToastContainer({ toasts }) {
    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast-${t.type}`}>
                    <span className="toast-icon">
                        {t.type === "success" ? "✔" : t.type === "error" ? "✖" : "ℹ"}
                    </span>
                    {t.msg}
                </div>
            ))}
        </div>
    );
}

function useToast() {
    const [toasts, setToasts] = useState([]);
    const add = (msg, type = "success") => {
        const id = Date.now();
        setToasts(t => [...t, { id, msg, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
    };
    return { toasts, success: m => add(m, "success"), error: m => add(m, "error"), info: m => add(m, "info") };
}

// ─── Pantalla de Login ────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
    const [usuario, setUsuario] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setErrorMsg("");
        if (!usuario.trim() || !contrasena.trim()) {
            setErrorMsg("Por favor ingrese su usuario y contraseña.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/Auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario: usuario.trim(), contrasena })
            });
            const data = await res.json();
            if (res.ok && data.exitoso) {
                onLogin(data);
            } else {
                setErrorMsg(data.mensaje || "Usuario o contraseña incorrectos.");
            }
        } catch {
            setErrorMsg("No se pudo conectar al servidor. Verifique que la API esté en ejecución.");
        }
        setLoading(false);
    };

    const handleKey = e => { if (e.key === "Enter") handleLogin(); };

    return (
        <div className="login-screen">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">✚</div>
                    <h1>Hospital CMQ</h1>
                    <p>Sistema de Información Clínica</p>
                </div>
                <div className="login-body">
                    <div className="field">
                        <label>Usuario</label>
                        <input
                            placeholder="usuario"
                            value={usuario}
                            onChange={e => setUsuario(e.target.value)}
                            onKeyDown={handleKey}
                            autoFocus
                        />
                    </div>
                    <div className="field">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={contrasena}
                            onChange={e => setContrasena(e.target.value)}
                            onKeyDown={handleKey}
                        />
                    </div>
                    {errorMsg && <div className="login-error">{errorMsg}</div>}
                    <button
                        className="btn btn-primary"
                        style={{ width: "100%", justifyContent: "center", padding: "10px" }}
                        onClick={handleLogin}
                        disabled={loading}
                    >
                        {loading ? "Verificando..." : "Ingresar al sistema"}
                    </button>
                </div>
                <div className="login-footer">
                    v2.4.1 · Oracle DB · Sprint 1
                </div>
            </div>
        </div>
    );
}

// ─── Modal Perfil Paciente ────────────────────────────────────────────────────
function ModalPerfil({ paciente, onClose }) {
    if (!paciente) return null;
    const fila = (label, val) => val ? (
        <div className="perfil-fila">
            <span className="perfil-label">{label}</span>
            <span className="perfil-val">{val}</span>
        </div>
    ) : null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>👤 Perfil del Paciente</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="perfil-section-title">Identificación</div>
                    {fila("Número ID", `${paciente.tipoIdentificacion} ${paciente.numeroIdentificacion}`)}
                    {fila("Nombre Completo", `${paciente.nombre} ${paciente.apellido}`)}
                    {fila("Fecha de Nacimiento", paciente.fechaNacimiento ? new Date(paciente.fechaNacimiento).toLocaleDateString("es-CO") : null)}
                    {fila("Edad", paciente.edad ? `${paciente.edad} años` : null)}
                    {fila("Género", paciente.genero)}
                    {fila("Tipo de Sangre", paciente.tipoSangre)}

                    <div className="perfil-section-title" style={{ marginTop: 16 }}>Contacto</div>
                    {fila("Teléfono", paciente.telefono)}
                    {fila("Email", paciente.email)}
                    {fila("Dirección", paciente.direccion)}
                    {fila("Ciudad", paciente.ciudad)}

                    <div className="perfil-section-title" style={{ marginTop: 16 }}>Contacto de Emergencia</div>
                    {fila("Nombre", paciente.contactoEmergencia)}
                    {fila("Teléfono", paciente.telefonoEmergencia)}

                    <div className="perfil-section-title" style={{ marginTop: 16 }}>Sistema</div>
                    {fila("Fecha de Registro", paciente.fechaRegistro ? new Date(paciente.fechaRegistro).toLocaleDateString("es-CO") : null)}
                </div>
            </div>
        </div>
    );
}

// ─── Formulario de Paciente (nuevo / editar) ──────────────────────────────────
const FORM_VACIO = {
    id: "", numeroIdentificacion: "", tipoIdentificacion: "CC",
    nombre: "", apellido: "", fechaNacimiento: "", edad: "",
    genero: "", tipoSangre: "", telefono: "", email: "",
    direccion: "", ciudad: "", contactoEmergencia: "", telefonoEmergencia: ""
};

// ─── App principal ────────────────────────────────────────────────────────────
function App() {
    // Auth
    const [auth, setAuth] = useState(null);

    // Datos
    const [pacientes, setPacientes] = useState([]);
    const [citas, setCitas] = useState([]);
    const [medicos, setMedicos] = useState([]);
    const [historias, setHistorias] = useState([]);

    // UI
    const [tab, setTab] = useState("pacientes");
    const [formP, setFormP] = useState({ ...FORM_VACIO });
    const [editandoPaciente, setEditandoPaciente] = useState(false);
    const [perfilPaciente, setPerfilPaciente] = useState(null);

    // Búsqueda
    const [busquedaId, setBusquedaId] = useState("");
    const [resultadoBusqueda, setResultadoBusqueda] = useState(null); // null | false | objeto
    const [buscando, setBuscando] = useState(false);

    // Filtros
    const [filtroPaciente, setFiltroPaciente] = useState("");
    const [filtroFecha, setFiltroFecha] = useState("");

    // Citas / Historia
    const [formC, setFormC] = useState({ paciente_Id: "", medico_Id: "", fecha: "", motivo: "" });
    const [formHC, setFormHC] = useState({ paciente_Id: "", diagnostico: "", tratamiento: "" });

    // Toast
    const toast = useToast();
    const now = useCurrentTime();

    useEffect(() => { if (auth) cargarTodo(); }, [auth]);

    const cargarTodo = () => {
        const load = (endpoint, setter) =>
            fetch(`${API_URL}/${endpoint}`)
                .then(r => r.ok ? r.json() : Promise.reject(r.status))
                .then(d => setter(d))
                .catch(e => console.error(`Error cargando ${endpoint}:`, e));

        load("Pacientes", setPacientes);
        load("Citas", setCitas);
        load("Medicos", setMedicos);
        load("HistoriaClinica", setHistorias);
    };

    // ─── Login / Logout ────────────────────────────────────────────────────────
    if (!auth) return <LoginScreen onLogin={setAuth} />;

    const logout = () => { setAuth(null); };

    // ─── Guardar Paciente (nuevo o editar) ─────────────────────────────────────
    const guardarPaciente = async () => {
        // Validar campos obligatorios (CA HU1 y HU2)
        const faltantes = [];
        if (!formP.numeroIdentificacion.trim()) faltantes.push("Número de Identificación");
        if (!formP.nombre.trim()) faltantes.push("Nombre");
        if (!formP.apellido.trim()) faltantes.push("Apellido");
        if (!formP.telefono.trim()) faltantes.push("Teléfono");
        if (faltantes.length > 0) {
            toast.error(`Faltan campos obligatorios: ${faltantes.join(", ")}.`);
            return;
        }

        const payload = {
            id: editandoPaciente ? Number(formP.id) : Math.floor(Math.random() * 900000) + 10000,
            numeroIdentificacion: formP.numeroIdentificacion.trim(),
            tipoIdentificacion: formP.tipoIdentificacion,
            nombre: formP.nombre.trim(),
            apellido: formP.apellido.trim(),
            fechaNacimiento: formP.fechaNacimiento || null,
            edad: formP.edad ? parseInt(formP.edad) : null,
            genero: formP.genero || null,
            tipoSangre: formP.tipoSangre || null,
            telefono: formP.telefono.trim(),
            email: formP.email.trim() || null,
            direccion: formP.direccion.trim() || null,
            ciudad: formP.ciudad.trim() || null,
            contactoEmergencia: formP.contactoEmergencia.trim() || null,
            telefonoEmergencia: formP.telefonoEmergencia.trim() || null,
        };

        const url = editandoPaciente ? `${API_URL}/Pacientes/${payload.id}` : `${API_URL}/Pacientes`;
        const method = editandoPaciente ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            toast.success(data.mensaje || (editandoPaciente
                ? "Datos del paciente actualizados correctamente."
                : `Paciente '${payload.nombre} ${payload.apellido}' registrado exitosamente.`));
            cancelarEdicion();
            cargarTodo();
        } else {
            toast.error(data.mensaje || "Error al guardar el paciente.");
        }
    };

    const cancelarEdicion = () => {
        setEditandoPaciente(false);
        setFormP({ ...FORM_VACIO });
    };

    // ─── Buscar paciente por identificación (HU #3) ────────────────────────────
    const buscarPaciente = async () => {
        if (!busquedaId.trim()) {
            toast.error("El número de identificación es un campo obligatorio para realizar la consulta.");
            return;
        }
        setBuscando(true);
        setResultadoBusqueda(null);
        const res = await fetch(`${API_URL}/Pacientes/buscar/${encodeURIComponent(busquedaId.trim())}`);
        setBuscando(false);
        if (res.ok) {
            const data = await res.json();
            setResultadoBusqueda(data);
        } else {
            const data = await res.json().catch(() => ({}));
            setResultadoBusqueda(false);
            toast.info(data.mensaje || "Paciente no encontrado.");
        }
    };

    // ─── Agregar Cita ──────────────────────────────────────────────────────────
    const agregarCita = async () => {
        if (!formC.paciente_Id || !formC.medico_Id || !formC.fecha || !formC.motivo.trim()) {
            toast.error("Complete todos los campos de la cita.");
            return;
        }
        const res = await fetch(`${API_URL}/Citas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: Math.floor(Math.random() * 900000) + 10000,
                paciente_Id: parseInt(formC.paciente_Id),
                medico_Id: parseInt(formC.medico_Id),
                fecha: formC.fecha,
                motivo: formC.motivo.trim()
            })
        });
        if (res.ok) {
            toast.success("Cita programada exitosamente.");
            setFormC({ paciente_Id: "", medico_Id: "", fecha: "", motivo: "" });
            cargarTodo();
        } else {
            const data = await res.json().catch(() => ({}));
            toast.error(data.mensaje || "Error al programar la cita.");
        }
    };

    // ─── Agregar Historia Clínica ──────────────────────────────────────────────
    const agregarHistoria = async () => {
        if (!formHC.paciente_Id || !formHC.diagnostico.trim() || !formHC.tratamiento.trim()) {
            toast.error("Complete todos los campos del registro clínico.");
            return;
        }
        const res = await fetch(`${API_URL}/HistoriaClinica`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: Math.floor(Math.random() * 900000) + 10000,
                paciente_Id: parseInt(formHC.paciente_Id),
                fecha_Registro: new Date().toISOString(),
                diagnostico: formHC.diagnostico.trim(),
                tratamiento: formHC.tratamiento.trim()
            })
        });
        if (res.ok) {
            toast.success("Registro clínico guardado exitosamente.");
            setFormHC({ paciente_Id: "", diagnostico: "", tratamiento: "" });
            cargarTodo();
        } else {
            const data = await res.json().catch(() => ({}));
            toast.error(data.mensaje || "Error al guardar el registro.");
        }
    };

    // ─── Helpers ───────────────────────────────────────────────────────────────
    const pacientesFiltrados = pacientes.filter(p =>
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(filtroPaciente.toLowerCase()) ||
        (p.numeroIdentificacion || "").includes(filtroPaciente)
    );
    const citasFiltradas = citas.filter(c =>
        !filtroFecha || (c.fecha && c.fecha.startsWith(filtroFecha))
    );

    const fechaHoy = now.toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const horaHoy = now.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

    const navItems = [
        { key: "pacientes", icon: "👤", label: "Registro Pacientes", count: pacientes.length },
        { key: "buscar", icon: "🔍", label: "Consultar Paciente", count: null },
        { key: "citas", icon: "📋", label: "Citas Médicas", count: citas.length },
        { key: "historia", icon: "📁", label: "Historia Clínica", count: historias.length },
    ];

    const initiales = auth.nombreCompleto
        ? auth.nombreCompleto.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
        : "?";

    // ─── Campo de formulario reutilizable ──────────────────────────────────────
    const F = ({ label, req, children }) => (
        <div className="field">
            <label>{label}{req && <span style={{ color: "var(--red)", marginLeft: 2 }}>*</span>}</label>
            {children}
        </div>
    );

    // ──────────────────────────────────────────────────────────────────────────
    return (
        <>
            <ToastContainer toasts={toast.toasts} />
            {perfilPaciente && <ModalPerfil paciente={perfilPaciente} onClose={() => setPerfilPaciente(null)} />}

            {/* ── TOPBAR ── */}
            <div className="topbar">
                <div className="topbar-logo">
                    <div className="logo-icon">✚</div>
                    <div className="logo-text">
                        <strong>Hospital CMQ</strong>
                        <span>Sistema de Información Clínica</span>
                    </div>
                </div>
                <div className="topbar-divider" />
                <span className="topbar-meta">v2.4.1 · Oracle DB</span>
                <div className="topbar-right">
                    <span className="topbar-meta">{fechaHoy} · {horaHoy}</span>
                    <div className="topbar-user">
                        <div className="avatar">{initiales}</div>
                        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{auth.nombreCompleto}</span>
                            <span style={{ fontSize: 10, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                {auth.rol}
                            </span>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={logout} style={{ fontSize: 11 }}>
                        Cerrar sesión
                    </button>
                </div>
            </div>

            {/* ── LAYOUT ── */}
            <div className="app-layout">

                {/* ── SIDEBAR ── */}
                <aside className="sidebar">
                    <div className="sidebar-section">
                        <div className="sidebar-label">Módulos Secretaría</div>
                        {navItems.map(item => (
                            <button
                                key={item.key}
                                className={`nav-item ${tab === item.key ? "active" : ""}`}
                                onClick={() => setTab(item.key)}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                {item.label}
                                {item.count !== null && (
                                    <span className="nav-badge">{item.count}</span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="sidebar-footer">
                        <span>CMQ · Módulo Clínico</span>
                        <span>Sesión activa · {horaHoy}</span>
                    </div>
                </aside>

                {/* ── CONTENIDO ── */}
                <main className="main-content">

                    {/* ════════════════════════════════════
                        PESTAÑA: REGISTRO DE PACIENTES
                    ════════════════════════════════════ */}
                    {tab === "pacientes" && (
                        <div className="fade-in">
                            <div className="page-header">
                                <div className="page-header-left">
                                    <h2>Gestión de Pacientes</h2>
                                    <p>Registro, consulta y actualización de pacientes del sistema</p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="stats-row">
                                <div className="stat-card">
                                    <div className="stat-label">Total Pacientes</div>
                                    <div className="stat-value">{pacientes.length}</div>
                                    <div className="stat-sub"><span className="stat-indicator blue" />Registrados</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Citas Activas</div>
                                    <div className="stat-value">{citas.length}</div>
                                    <div className="stat-sub"><span className="stat-indicator green" />Programadas</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Médicos</div>
                                    <div className="stat-value">{medicos.length}</div>
                                    <div className="stat-sub"><span className="stat-indicator amber" />Activos</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Historiales</div>
                                    <div className="stat-value">{historias.length}</div>
                                    <div className="stat-sub"><span className="stat-indicator blue" />Registros</div>
                                </div>
                            </div>

                            <div className="panel-grid">
                                {/* ── Formulario Paciente ── */}
                                <div className="panel">
                                    <div className="panel-header">
                                        <h3>
                                            <span className="ph-icon">👤</span>
                                            {editandoPaciente ? "Actualizar Paciente" : "Nuevo Paciente"}
                                        </h3>
                                    </div>
                                    <div className="panel-body">
                                        <div className="form-stack">
                                            <div className="form-row-2">
                                                <F label="Tipo ID" req>
                                                    <select value={formP.tipoIdentificacion} onChange={e => setFormP({ ...formP, tipoIdentificacion: e.target.value })}>
                                                        <option value="CC">CC</option>
                                                        <option value="TI">TI</option>
                                                        <option value="CE">CE</option>
                                                        <option value="RC">RC</option>
                                                        <option value="Pasaporte">Pasaporte</option>
                                                    </select>
                                                </F>
                                                <F label="Número Identificación" req>
                                                    <input
                                                        placeholder="Ej. 1061234567"
                                                        value={formP.numeroIdentificacion}
                                                        onChange={e => setFormP({ ...formP, numeroIdentificacion: e.target.value })}
                                                        disabled={editandoPaciente}
                                                    />
                                                </F>
                                            </div>
                                            <div className="form-row-2">
                                                <F label="Nombre" req>
                                                    <input placeholder="Juan" value={formP.nombre} onChange={e => setFormP({ ...formP, nombre: e.target.value })} />
                                                </F>
                                                <F label="Apellido" req>
                                                    <input placeholder="Pérez García" value={formP.apellido} onChange={e => setFormP({ ...formP, apellido: e.target.value })} />
                                                </F>
                                            </div>
                                            <div className="form-row-2">
                                                <F label="Fecha Nacimiento">
                                                    <input type="date" value={formP.fechaNacimiento} onChange={e => setFormP({ ...formP, fechaNacimiento: e.target.value })} />
                                                </F>
                                                <F label="Edad (años)">
                                                    <input type="number" min="0" max="130" placeholder="0" value={formP.edad} onChange={e => setFormP({ ...formP, edad: e.target.value })} />
                                                </F>
                                            </div>
                                            <div className="form-row-2">
                                                <F label="Género">
                                                    <select value={formP.genero} onChange={e => setFormP({ ...formP, genero: e.target.value })}>
                                                        <option value="">— Seleccione —</option>
                                                        <option value="Masculino">Masculino</option>
                                                        <option value="Femenino">Femenino</option>
                                                        <option value="Otro">Otro</option>
                                                    </select>
                                                </F>
                                                <F label="Tipo de Sangre">
                                                    <select value={formP.tipoSangre} onChange={e => setFormP({ ...formP, tipoSangre: e.target.value })}>
                                                        <option value="">— Seleccione —</option>
                                                        {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </F>
                                            </div>
                                            <hr className="form-divider" />
                                            <F label="Teléfono" req>
                                                <input placeholder="3001234567" value={formP.telefono} onChange={e => setFormP({ ...formP, telefono: e.target.value })} />
                                            </F>
                                            <F label="Correo Electrónico">
                                                <input type="email" placeholder="correo@ejemplo.com" value={formP.email} onChange={e => setFormP({ ...formP, email: e.target.value })} />
                                            </F>
                                            <F label="Dirección">
                                                <input placeholder="Calle 5 # 10-20" value={formP.direccion} onChange={e => setFormP({ ...formP, direccion: e.target.value })} />
                                            </F>
                                            <F label="Ciudad">
                                                <input placeholder="Popayán" value={formP.ciudad} onChange={e => setFormP({ ...formP, ciudad: e.target.value })} />
                                            </F>
                                            <hr className="form-divider" />
                                            <div className="form-row-2">
                                                <F label="Contacto Emergencia">
                                                    <input placeholder="Nombre" value={formP.contactoEmergencia} onChange={e => setFormP({ ...formP, contactoEmergencia: e.target.value })} />
                                                </F>
                                                <F label="Tel. Emergencia">
                                                    <input placeholder="3009876543" value={formP.telefonoEmergencia} onChange={e => setFormP({ ...formP, telefonoEmergencia: e.target.value })} />
                                                </F>
                                            </div>
                                            <hr className="form-divider" />
                                            <div className="form-actions">
                                                <button
                                                    className={`btn ${editandoPaciente ? "btn-primary" : "btn-success"}`}
                                                    onClick={guardarPaciente}
                                                >
                                                    {editandoPaciente ? "💾 Actualizar registro" : "✚ Registrar paciente"}
                                                </button>
                                                {editandoPaciente && (
                                                    <button className="btn btn-ghost" onClick={cancelarEdicion}>Cancelar</button>
                                                )}
                                            </div>
                                            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                                                <span style={{ color: "var(--red)" }}>*</span> Campo obligatorio
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Tabla Pacientes ── */}
                                <div className="panel">
                                    <div className="panel-header">
                                        <h3><span className="ph-icon">📋</span>Directorio de Pacientes</h3>
                                        <div className="filter-bar">
                                            <div className="search-box">
                                                <span className="search-icon">🔍</span>
                                                <input
                                                    placeholder="Buscar por nombre o ID..."
                                                    value={filtroPaciente}
                                                    onChange={e => setFiltroPaciente(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="table-container">
                                        {pacientesFiltrados.length === 0 ? (
                                            <div className="empty-state">
                                                <div className="empty-icon">👤</div>
                                                <p>No se encontraron pacientes</p>
                                            </div>
                                        ) : (
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Identificación</th>
                                                        <th>Paciente</th>
                                                        <th>Edad</th>
                                                        <th>Teléfono</th>
                                                        <th>Ciudad</th>
                                                        <th>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pacientesFiltrados.map(p => (
                                                        <tr key={p.id}>
                                                            <td className="td-mono">{p.tipoIdentificacion} {p.numeroIdentificacion}</td>
                                                            <td className="td-primary">{p.nombre} {p.apellido}</td>
                                                            <td>{p.edad ? `${p.edad} años` : "—"}</td>
                                                            <td>{p.telefono || "—"}</td>
                                                            <td>{p.ciudad || "—"}</td>
                                                            <td style={{ display: "flex", gap: 6 }}>
                                                                <button
                                                                    className="btn btn-ghost btn-sm"
                                                                    onClick={() => setPerfilPaciente(p)}
                                                                    title="Ver perfil completo"
                                                                >👁</button>
                                                                <button
                                                                    className="btn btn-warning btn-sm"
                                                                    onClick={() => {
                                                                        setFormP({
                                                                            id: p.id,
                                                                            numeroIdentificacion: p.numeroIdentificacion,
                                                                            tipoIdentificacion: p.tipoIdentificacion,
                                                                            nombre: p.nombre,
                                                                            apellido: p.apellido,
                                                                            fechaNacimiento: p.fechaNacimiento ? p.fechaNacimiento.substring(0, 10) : "",
                                                                            edad: p.edad ?? "",
                                                                            genero: p.genero ?? "",
                                                                            tipoSangre: p.tipoSangre ?? "",
                                                                            telefono: p.telefono ?? "",
                                                                            email: p.email ?? "",
                                                                            direccion: p.direccion ?? "",
                                                                            ciudad: p.ciudad ?? "",
                                                                            contactoEmergencia: p.contactoEmergencia ?? "",
                                                                            telefonoEmergencia: p.telefonoEmergencia ?? "",
                                                                        });
                                                                        setEditandoPaciente(true);
                                                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                                                    }}
                                                                    title="Editar paciente"
                                                                >✏ Editar</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ════════════════════════════════════
                        PESTAÑA: CONSULTAR PACIENTE (HU #3)
                    ════════════════════════════════════ */}
                    {tab === "buscar" && (
                        <div className="fade-in">
                            <div className="page-header">
                                <div className="page-header-left">
                                    <h2>Consultar Paciente</h2>
                                    <p>Búsqueda del perfil completo por número de identificación</p>
                                </div>
                            </div>

                            <div className="panel" style={{ maxWidth: 600, marginBottom: 20 }}>
                                <div className="panel-header">
                                    <h3><span className="ph-icon">🔍</span>Buscar por Número de Identificación</h3>
                                </div>
                                <div className="panel-body">
                                    <div className="form-stack">
                                        <F label="Número de Identificación del Paciente" req>
                                            <input
                                                placeholder="Ej. 1061234567"
                                                value={busquedaId}
                                                onChange={e => { setBusquedaId(e.target.value); setResultadoBusqueda(null); }}
                                                onKeyDown={e => e.key === "Enter" && buscarPaciente()}
                                            />
                                        </F>
                                        <div className="form-actions">
                                            <button className="btn btn-primary" onClick={buscarPaciente} disabled={buscando}>
                                                {buscando ? "Buscando..." : "🔍 Consultar paciente"}
                                            </button>
                                            {busquedaId && (
                                                <button className="btn btn-ghost" onClick={() => { setBusquedaId(""); setResultadoBusqueda(null); }}>
                                                    Limpiar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Resultado no encontrado */}
                            {resultadoBusqueda === false && (
                                <div className="panel" style={{ maxWidth: 600 }}>
                                    <div className="panel-body">
                                        <div className="empty-state">
                                            <div className="empty-icon">🔍</div>
                                            <p>No se encontró ningún paciente con la identificación <strong>'{busquedaId}'</strong></p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Perfil completo encontrado */}
                            {resultadoBusqueda && resultadoBusqueda !== false && (
                                <div className="panel fade-in" style={{ maxWidth: 700 }}>
                                    <div className="panel-header">
                                        <h3><span className="ph-icon">👤</span>Perfil del Paciente</h3>
                                        <span className="badge badge-green">✔ Encontrado</span>
                                    </div>
                                    <div className="panel-body">
                                        <div className="perfil-grid">
                                            <div>
                                                <div className="perfil-section-title">Identificación</div>
                                                <div className="perfil-fila"><span className="perfil-label">Tipo ID</span><span className="perfil-val">{resultadoBusqueda.tipoIdentificacion}</span></div>
                                                <div className="perfil-fila"><span className="perfil-label">Número ID</span><span className="perfil-val">{resultadoBusqueda.numeroIdentificacion}</span></div>
                                                <div className="perfil-fila"><span className="perfil-label">Nombre Completo</span><span className="perfil-val">{resultadoBusqueda.nombre} {resultadoBusqueda.apellido}</span></div>
                                                <div className="perfil-fila"><span className="perfil-label">Fecha de Nacimiento</span><span className="perfil-val">{resultadoBusqueda.fechaNacimiento ? new Date(resultadoBusqueda.fechaNacimiento).toLocaleDateString("es-CO") : "—"}</span></div>
                                                <div className="perfil-fila"><span className="perfil-label">Edad</span><span className="perfil-val">{resultadoBusqueda.edad ? `${resultadoBusqueda.edad} años` : "—"}</span></div>
                                                <div className="perfil-fila"><span className="perfil-label">Género</span><span className="perfil-val">{resultadoBusqueda.genero || "—"}</span></div>
                                                <div className="perfil-fila"><span className="perfil-label">Tipo de Sangre</span><span className="perfil-val">{resultadoBusqueda.tipoSangre || "—"}</span></div>
                                            </div>
                                            <div>
                                                <div className="perfil-section-title">Contacto</div>
                                                <div className="perfil-fila"><span className="perfil-label">Teléfono</span><span className="perfil-val">{resultadoBusqueda.telefono || "—"}</span></div>
                                                <div className="perfil-fila"><span className="perfil-label">Email</span><span className="perfil-val">{resultadoBusqueda.email || "—"}</span></div>
                                                <div className="perfil-fila"><span className="perfil-label">Dirección</span><span className="perfil-val">{resultadoBusqueda.direccion || "—"}</span></div>
                                                <div className="perfil-fila"><span className="perfil-label">Ciudad</span><span className="perfil-val">{resultadoBusqueda.ciudad || "—"}</span></div>

                                                <div className="perfil-section-title" style={{ marginTop: 12 }}>Emergencia</div>
                                                <div className="perfil-fila"><span className="perfil-label">Contacto</span><span className="perfil-val">{resultadoBusqueda.contactoEmergencia || "—"}</span></div>
                                                <div className="perfil-fila"><span className="perfil-label">Teléfono</span><span className="perfil-val">{resultadoBusqueda.telefonoEmergencia || "—"}</span></div>

                                                <div className="perfil-section-title" style={{ marginTop: 12 }}>Sistema</div>
                                                <div className="perfil-fila"><span className="perfil-label">Fecha Registro</span><span className="perfil-val">{resultadoBusqueda.fechaRegistro ? new Date(resultadoBusqueda.fechaRegistro).toLocaleDateString("es-CO") : "—"}</span></div>
                                            </div>
                                        </div>
                                        <div className="form-actions" style={{ marginTop: 16 }}>
                                            <button className="btn btn-warning btn-sm" onClick={() => {
                                                const p = resultadoBusqueda;
                                                setFormP({
                                                    id: p.id,
                                                    numeroIdentificacion: p.numeroIdentificacion,
                                                    tipoIdentificacion: p.tipoIdentificacion,
                                                    nombre: p.nombre,
                                                    apellido: p.apellido,
                                                    fechaNacimiento: p.fechaNacimiento ? p.fechaNacimiento.substring(0, 10) : "",
                                                    edad: p.edad ?? "",
                                                    genero: p.genero ?? "",
                                                    tipoSangre: p.tipoSangre ?? "",
                                                    telefono: p.telefono ?? "",
                                                    email: p.email ?? "",
                                                    direccion: p.direccion ?? "",
                                                    ciudad: p.ciudad ?? "",
                                                    contactoEmergencia: p.contactoEmergencia ?? "",
                                                    telefonoEmergencia: p.telefonoEmergencia ?? "",
                                                });
                                                setEditandoPaciente(true);
                                                setTab("pacientes");
                                            }}>
                                                ✏ Editar paciente
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ════════════════════════════════════
                        PESTAÑA: CITAS MÉDICAS
                    ════════════════════════════════════ */}
                    {tab === "citas" && (
                        <div className="fade-in">
                            <div className="page-header">
                                <div className="page-header-left">
                                    <h2>Citas Médicas</h2>
                                    <p>Programación y consulta de citas con especialistas</p>
                                </div>
                            </div>
                            <div className="panel-grid">
                                <div className="panel">
                                    <div className="panel-header">
                                        <h3><span className="ph-icon">📋</span>Programar Cita</h3>
                                    </div>
                                    <div className="panel-body">
                                        <div className="form-stack">
                                            <F label="Paciente" req>
                                                <select value={formC.paciente_Id} onChange={e => setFormC({ ...formC, paciente_Id: e.target.value })}>
                                                    <option value="">— Seleccione un paciente —</option>
                                                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido} · {p.numeroIdentificacion}</option>)}
                                                </select>
                                            </F>
                                            <F label="Médico / Especialista" req>
                                                <select value={formC.medico_Id} onChange={e => setFormC({ ...formC, medico_Id: e.target.value })}>
                                                    <option value="">— Seleccione un médico —</option>
                                                    {medicos.map(m => <option key={m.id} value={m.id}>{m.nombre} · {m.especialidad}</option>)}
                                                </select>
                                            </F>
                                            <F label="Fecha y Hora" req>
                                                <input type="datetime-local" value={formC.fecha} onChange={e => setFormC({ ...formC, fecha: e.target.value })} />
                                            </F>
                                            <F label="Motivo de Consulta" req>
                                                <input placeholder="Ej. Dolor de cabeza, control rutinario..." value={formC.motivo} onChange={e => setFormC({ ...formC, motivo: e.target.value })} />
                                            </F>
                                            <hr className="form-divider" />
                                            <div className="form-actions">
                                                <button className="btn btn-primary" onClick={agregarCita}>Confirmar Cita</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="panel">
                                    <div className="panel-header">
                                        <h3><span className="ph-icon">📅</span>Registro de Citas</h3>
                                        <div className="filter-bar">
                                            <input type="date" style={{ padding: "6px 10px", fontSize: "13px", border: "1px solid var(--border-strong)", borderRadius: "var(--radius)" }} value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} />
                                            {filtroFecha && <button className="btn btn-ghost btn-sm" onClick={() => setFiltroFecha("")}>Limpiar</button>}
                                        </div>
                                    </div>
                                    <div className="table-container">
                                        {citasFiltradas.length === 0 ? (
                                            <div className="empty-state"><div className="empty-icon">📋</div><p>No hay citas registradas</p></div>
                                        ) : (
                                            <table>
                                                <thead><tr><th>ID</th><th>Paciente</th><th>Médico</th><th>Fecha y Hora</th><th>Motivo</th><th>Estado</th></tr></thead>
                                                <tbody>
                                                    {citasFiltradas.map(c => (
                                                        <tr key={c.id}>
                                                            <td className="td-mono">{c.id}</td>
                                                            <td className="td-primary">{pacientes.find(p => p.id === c.paciente_Id)?.nombre || `#${c.paciente_Id}`}</td>
                                                            <td>{medicos.find(m => m.id === c.medico_Id)?.nombre || `#${c.medico_Id}`}</td>
                                                            <td className="td-mono">{c.fecha ? new Date(c.fecha).toLocaleString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                                                            <td>{c.motivo}</td>
                                                            <td><span className="badge badge-blue">Programada</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ════════════════════════════════════
                        PESTAÑA: HISTORIA CLÍNICA
                    ════════════════════════════════════ */}
                    {tab === "historia" && (
                        <div className="fade-in">
                            <div className="page-header">
                                <div className="page-header-left">
                                    <h2>Historia Clínica</h2>
                                    <p>Registro de diagnósticos y tratamientos por paciente</p>
                                </div>
                            </div>
                            <div className="panel-grid">
                                <div className="panel">
                                    <div className="panel-header">
                                        <h3><span className="ph-icon">📁</span>Nuevo Registro Clínico</h3>
                                    </div>
                                    <div className="panel-body">
                                        <div className="form-stack">
                                            <F label="Paciente" req>
                                                <select value={formHC.paciente_Id} onChange={e => setFormHC({ ...formHC, paciente_Id: e.target.value })}>
                                                    <option value="">— Seleccione un paciente —</option>
                                                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                                                </select>
                                            </F>
                                            <F label="Diagnóstico" req>
                                                <textarea placeholder="Describa el diagnóstico médico en detalle..." value={formHC.diagnostico} onChange={e => setFormHC({ ...formHC, diagnostico: e.target.value })} />
                                            </F>
                                            <F label="Tratamiento Prescrito" req>
                                                <textarea placeholder="Medicamentos, dosis, indicaciones..." value={formHC.tratamiento} onChange={e => setFormHC({ ...formHC, tratamiento: e.target.value })} />
                                            </F>
                                            <hr className="form-divider" />
                                            <div className="form-actions">
                                                <button className="btn btn-success" onClick={agregarHistoria}>Guardar Registro</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="panel">
                                    <div className="panel-header">
                                        <h3><span className="ph-icon">📂</span>Historiales Registrados</h3>
                                        <span className="badge badge-blue">{historias.length} registros</span>
                                    </div>
                                    <div className="table-container">
                                        {historias.length === 0 ? (
                                            <div className="empty-state"><div className="empty-icon">📁</div><p>No hay historiales registrados</p></div>
                                        ) : (
                                            <table>
                                                <thead><tr><th>Paciente</th><th>Fecha</th><th>Diagnóstico</th><th>Tratamiento</th></tr></thead>
                                                <tbody>
                                                    {historias.map(h => {
                                                        const pac = pacientes.find(p => p.id === h.paciente_Id);
                                                        return (
                                                            <tr key={h.id}>
                                                                <td className="td-primary">{pac ? `${pac.nombre} ${pac.apellido}` : `#${h.paciente_Id}`}</td>
                                                                <td className="td-mono">{h.fecha_Registro ? new Date(h.fecha_Registro).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                                                                <td>{h.diagnostico}</td>
                                                                <td>{h.tratamiento}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </>
    );
}

export default App;
