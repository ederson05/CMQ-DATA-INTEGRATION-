import { useState, useEffect, useCallback } from "react";
import {
  FiUsers,
  FiFileText,
  FiUser,
  FiSearch,
  FiLogOut,
  FiEye,
  FiPlusCircle,
  FiChevronLeft,
  FiAlertCircle,
  FiCalendar,
  FiFilter,
  FiX,
  FiCheckCircle,
  FiEdit2,
} from "react-icons/fi";
import { FaStethoscope } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./medico_principal.css";
import DoctorUrgencias from "./DoctorUrgencias";
//local
//const API = 'http://localhost:3001/api'
//API
const API = "https://cmq-backend.onrender.com/api";

function ToastContainer({ toasts }) {
  return (
    <div className="toast-wrapper">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{t.type === "success" ? "✓" : "!"}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = "success", delay = 0) => {
    setTimeout(() => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, msg, type }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        4000,
      );
    }, delay);
  }, []);
  return {
    toasts,
    success: (m) => show(m, "success"),
    error: (m) => show(m, "error"),
    errors: (lista) => lista.forEach((m, i) => show(m, "error", i * 180)),
  };
}

function CampoRequerido({ error, children }) {
  return (
    <div style={{ position: "relative" }}>
      {children}
      {error && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            marginTop: "4px",
            fontSize: "12px",
            color: "#dc2626",
            fontWeight: 500,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "14px",
              height: "14px",
              background: "#f97316",
              borderRadius: "3px",
              color: "white",
              fontSize: "10px",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            !
          </span>
          {error}
        </span>
      )}
    </div>
  );
}

const TIPOS = ["PRIMERA_VEZ", "CONTROL", "URGENCIA"];
const TIPO_LABEL = {
  PRIMERA_VEZ: "Primera vez",
  CONTROL: "Control",
  URGENCIA: "Urgencia",
};
const TIPO_COLOR = {
  PRIMERA_VEZ: "tipo-azul",
  CONTROL: "tipo-verde",
  URGENCIA: "tipo-rojo",
};

const ESTADOS_CITA = ["PROGRAMADA", "EN_ESPERA", "ATENDIDO"];
const ESTADO_LABEL = {
  ATENDIDO: "Atendido",
  EN_ESPERA: "En espera",
  PROGRAMADA: "Pendiente",
};
const ESTADO_STYLE = {
  ATENDIDO: {
    background: "#f0fdf4",
    color: "#059669",
    border: "1px solid #bbf7d0",
  },
  EN_ESPERA: {
    background: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fed7aa",
  },
  PROGRAMADA: {
    background: "#eff6ff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
  },
};

const calcEdad = (fn) => {
  if (!fn) return "-";
  const hoy = new Date(),
    nac = new Date(fn);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return `${edad} años`;
};

const fmtFecha = (ts) => {
  if (!ts) return "-";
  const limpia = String(ts).replace("T", " ").split(".")[0];
  const [fecha, hora] = limpia.split(" ");
  const [anio, mes, dia] = fecha.split("-");
  const [hh, mm] = hora.split(":");
  const d = new Date(anio, mes - 1, dia, hh, mm);
  return d.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const initiales = (nombre) =>
  nombre
    ? nombre
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "DR";

const validarAnotacion = (f) => {
  const e = {};
  if (!f.tipoConsulta) e.tipoConsulta = "Seleccione el tipo de consulta";
  if (!f.diagnostico?.trim()) e.diagnostico = "El diagnóstico es requerido";
  if (!f.tratamiento?.trim()) e.tratamiento = "El tratamiento es requerido";
  if (!f.observaciones?.trim())
    e.observaciones = "Las observaciones son requeridas";
  return e;
};




function CitaCard({ cita, onEstadoChange, medId, onVerHistorial }) {
  const [editando, setEditando] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState(cita.estado);

useEffect(() => {
  setNuevoEstado(cita.estado);
}, [cita.estado]);
  const [guardando, setGuardando] = useState(false);

  const fmtHora = (ts) => {
    if (!ts) return "-";
    const limpia = String(ts).replace("T", " ").split(".")[0];
    const [fecha, hora] = limpia.split(" ");
    const [anio, mes, dia] = fecha.split("-");
    const [hh, mm] = hora.split(":");
    const d = new Date(anio, mes - 1, dia, hh, mm);
    return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const handleAceptar = async () => {
    if (nuevoEstado === cita.estado) { setEditando(false); return; }
    setGuardando(true);
    try {
      const res = await fetch(`${API}/citas/${cita.citId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medId,
          fechaHora: String(cita.fechaHora).replace(" ", "T").split(".")[0].slice(0, 16),
          estado: nuevoEstado,
        }),
      });
      const data = await res.json();
      if (data.success) { onEstadoChange(cita.citId, nuevoEstado); setEditando(false); }
      else { alert("Error al actualizar el estado: " + (data.error || "Error desconocido")); setEditando(false); }
    } catch (e) {
      console.error(e);
      alert("Error de conexión al actualizar el estado");
      setEditando(false);
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => { setNuevoEstado(cita.estado); setEditando(false); };

  const esTriage = cita.motivo === "URGENCIA" && cita.estado !== "ATENDIDO";
const nivelColor = {
  CRITICO: { bg: '#fef2f2', border: '#ef4444', shadow: '#fee2e2', avatar: 'linear-gradient(135deg,#ef4444,#b91c1c)', badge: '#fee2e2', badgeText: '#b91c1c', badgeBorder: '#fca5a5' },
  ESTABLE: { bg: '#fffbeb', border: '#f59e0b', shadow: '#fef3c7', avatar: 'linear-gradient(135deg,#f59e0b,#d97706)', badge: '#fef3c7', badgeText: '#92400e', badgeBorder: '#fcd34d' },
  LEVE:    { bg: '#f0fdf4', border: '#22c55e', shadow: '#dcfce7', avatar: 'linear-gradient(135deg,#22c55e,#16a34a)', badge: '#dcfce7', badgeText: '#166534', badgeBorder: '#86efac' },
}
const colores = esTriage ? (nivelColor[cita.nivelPaciente] || nivelColor.ESTABLE) : null

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: "8px",
      padding: "12px 14px",


      background: esTriage ? colores.bg : "white",
borderRadius: "10px",
border: esTriage ? `1.5px solid ${colores.border}` : "1px solid #e2e8f0",
boxShadow: esTriage ? `0 0 0 3px ${colores.shadow}` : "0 1px 3px rgba(0,0,0,0.05)",
      
      
      transition: "all .2s",

    }}>
      {/* Fila superior */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          background: esTriage ? colores.avatar : "linear-gradient(135deg,#3b82f6,#1d4ed8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 700, fontSize: "13px", flexShrink: 0,
        }}>
          {initiales(cita.pacNombre)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {cita.pacNombre}
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
            {cita.motivo}
          </div>
        </div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#475569", flexShrink: 0 }}>
          {fmtHora(cita.fechaHora)}
        </div>
      </div>

      {/* Fila inferior */}
      {!editando ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
          <span style={{
            fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: "12px",
            ...(esTriage
  ? { background: colores.badge, color: colores.badgeText, border: `1px solid ${colores.badgeBorder}` }
  : ESTADO_STYLE[cita.estado])
          }}>
            {esTriage ? `${cita.nivelPaciente === 'CRITICO' ? '🔴' : cita.nivelPaciente === 'LEVE' ? '🟢' : '🟡'} ${cita.nivelPaciente || 'URGENCIA'}` : (ESTADO_LABEL[cita.estado] || cita.estado)}
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            {esTriage && (
  <button
    onClick={() => onVerHistorial(cita)}
    style={{
      display: "flex", alignItems: "center", gap: "4px",
      background: "#dc2626", color: "white", border: "none",
      borderRadius: "6px", padding: "4px 10px", fontSize: "12px",
      fontWeight: 700, cursor: "pointer",
    }}
  >
    <FiEye size={12} /> Ver paciente
  </button>
)}

{cita.estado !== "ATENDIDO" && (
  <button
    onClick={() => { setNuevoEstado(cita.estado); setEditando(true); }}
    style={{
      display: "flex", alignItems: "center", gap: "4px", background: "none",
      border: "1px solid #e2e8f0", borderRadius: "6px", padding: "4px 10px",
      fontSize: "12px", color: "#64748b", cursor: "pointer", fontWeight: 500,
    }}
  >
    <FiEdit2 size={12} /> Cambiar
  </button>
)}





          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)}
            style={{ flex: 1, fontSize: "12px", padding: "6px 10px", border: "1px solid #93c5fd",
              borderRadius: "6px", background: "#eff6ff", color: "#1d4ed8", fontWeight: 600, outline: "none" }}>
            {ESTADOS_CITA.map((e) => (
              <option key={e} value={e}>{ESTADO_LABEL[e] || e}</option>
            ))}
          </select>
          <button onClick={handleAceptar} disabled={guardando}
            style={{ display: "flex", alignItems: "center", gap: "4px", background: "#2563eb",
              color: "white", border: "none", borderRadius: "6px", padding: "6px 12px",
              fontSize: "12px", fontWeight: 600, cursor: guardando ? "not-allowed" : "pointer", opacity: guardando ? 0.7 : 1 }}>
            <FiCheckCircle size={12} /> {guardando ? "..." : "Aceptar"}
          </button>
          <button onClick={handleCancelar} disabled={guardando}
            style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "6px",
              padding: "6px 10px", fontSize: "12px", color: "#94a3b8",
              cursor: guardando ? "not-allowed" : "pointer", display: "flex", alignItems: "center" }}>
            <FiX size={12} />
          </button>
        </div>
      )}
    </div>
  );
}












// ════════════════════════════════════════════════════════════
function MedicoPrincipal() {
  const navigate = useNavigate();
  const { toasts, success, error: showError } = useToast();

  const [usuario] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("usuario")) || {};
    } catch {
      return {};
    }
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [vista, setVista] = useState("pacientes");
  const [todosPacientes, setTodosPacientes] = useState([]);
  const [citasHoy, setCitasHoy] = useState([]);
  const [pacienteSeleccionado, setPaciente] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [aclaratorias, setAclaratorias] = useState([]);
  const [anotSeleccionada, setAnotSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);

  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  const [formAnot, setFormAnot] = useState({
    tipoConsulta: "",
    diagnostico: "",
    tratamiento: "",
    observaciones: "",
    proximaCita: "",
  });
  const [errAnot, setErrAnot] = useState({});
  const [intentoAnot, setIntentoAnot] = useState(false);

  const [descAcl, setDescAcl] = useState("");
  const [errAcl, setErrAcl] = useState("");
  const [intentoAcl, setIntentoAcl] = useState(false);

  const [modalDetalle, setModalDetalle] = useState(null);
  const [modalAcl, setModalAcl] = useState(null);
const [urgenciaPaciente, setUrgenciaPaciente] = useState(null);
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    cargarTodosPacientes();
    cargarCitasHoy();
  }, []);

  const cargarTodosPacientes = async () => {
    try {
      const res = await fetch(`${API}/pacientes`);
      const data = await res.json();
      setTodosPacientes(
        Array.isArray(data)
          ? data.map((r) => ({
              documento: String(r[0]),
              nombre: r[1],
              telefono: String(r[2] || ""),
              fechaNacimiento: r[3] ? String(r[3]).split("T")[0] : "",
              genero: r[4],
              tipoSangre: r[5],
              email: r[6] || "",
              direccion: r[7] || "",
              ciudad: r[8] || "",
            }))
          : [],
      );
    } catch {
      setTodosPacientes([]);
    }
  };

  const cargarCitasHoy = async () => {
    try {
      const medId = usuario.medId || usuario.id;
      const res = await fetch(`${API}/citas/hoy/${medId}`);
      const data = await res.json();
      setCitasHoy(Array.isArray(data) ? data : []);
    } catch {
      setCitasHoy([]);
    }
  };

  const cargarHistorial = async (doc) => {
    try {
      const res = await fetch(`${API}/historias/${doc}`);
      const data = await res.json();
      setHistorial(Array.isArray(data) ? data : []);
    } catch {
      setHistorial([]);
    }
  };

  const cargarAclaratorias = async (anoId) => {
    try {
      const res = await fetch(`${API}/anotaciones/${anoId}/aclaratorias`);
      const data = await res.json();
      setAclaratorias(Array.isArray(data) ? data : []);
    } catch {
      setAclaratorias([]);
    }
  };

  const verHistorial = (pac) => {
    setPaciente(pac);
    setVista("historial");
    limpiarFiltros();
    cargarHistorial(pac.documento);
  };

  // Actualiza el estado de una cita en el estado local sin recargar
  const handleEstadoChange = (citId, nuevoEstado) => {
    setCitasHoy((prev) =>
      prev.map((c) => (c.citId === citId ? { ...c, estado: nuevoEstado } : c)),
    );
    success("Estado de cita actualizado correctamente");
  };

  const histFiltrado = historial.filter((a) => {
    if (filtroTipo && a.tipoConsulta !== filtroTipo) return false;
    if (filtroDesde && new Date(a.fechaConsulta) < new Date(filtroDesde))
      return false;
    if (filtroHasta) {
      const hasta = new Date(filtroHasta);
      hasta.setHours(23, 59, 59);
      if (new Date(a.fechaConsulta) > hasta) return false;
    }
    return true;
  });

  const limpiarFiltros = () => {
    setFiltroTipo("");
    setFiltroDesde("");
    setFiltroHasta("");
  };

  const pacFiltrados = todosPacientes.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.documento.includes(busqueda),
  );

  // Stats derivados
  const citasSinAtender = citasHoy.filter(
    (c) => c.estado !== "ATENDIDO",
  ).length;
  const citasAtendidas = citasHoy.filter((c) => c.estado === "ATENDIDO").length;

  const handleGuardarAnotacion = async () => {
    setIntentoAnot(true);
    const errs = validarAnotacion(formAnot);
    setErrAnot(errs);
    if (Object.keys(errs).length > 0) {
      showError("Complete todos los campos obligatorios");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/anotaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pacDocumento: pacienteSeleccionado.documento,
          medId: usuario.medId || usuario.id,
          usuId: usuario.id,
          tipoConsulta: formAnot.tipoConsulta,
          diagnostico: formAnot.diagnostico,
          tratamiento: formAnot.tratamiento,
          observaciones: formAnot.observaciones,
          proximaCita: formAnot.proximaCita || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        success("Anotación médica registrada exitosamente");
        setFormAnot({
          tipoConsulta: "",
          diagnostico: "",
          tratamiento: "",
          observaciones: "",
          proximaCita: "",
        });
        setErrAnot({});
        setIntentoAnot(false);
        await cargarHistorial(pacienteSeleccionado.documento);
        setVista("historial");
      } else {
        showError("Error al registrar la anotación");
      }
    } catch {
      showError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarAclaratoria = async () => {
    setIntentoAcl(true);
    if (!descAcl.trim() || descAcl.trim().length < 10) {
      setErrAcl("La descripción debe tener al menos 10 caracteres");
      showError("La descripción debe tener al menos 10 caracteres");
      return;
    }
    setErrAcl("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/aclaratorias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anoId: anotSeleccionada.anoId,
          medId: usuario.medId || usuario.id,
          usuId: usuario.id,
          descripcion: descAcl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        success("Nota aclaratoria registrada exitosamente");
        setDescAcl("");
        setErrAcl("");
        setIntentoAcl(false);
        await cargarHistorial(pacienteSeleccionado.documento);
        setVista("historial");
        setAnotSeleccionada(null);
      } else {
        showError("Error al registrar la nota aclaratoria");
      }
    } catch {
      showError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const inputErrStyle = (c) =>
    errAnot[c] ? { borderColor: "#ef4444", background: "#fff5f5" } : {};

  const fmtDateTime = (d) =>
    d.toLocaleString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

  return (
    <div className="medico-container">
      <ToastContainer toasts={toasts} />

      <header className="main-header">
        <div className="header-left">
          <div className="logo-icon">+</div>
          <div className="hospital-info">
            <h1>Hospital CMQ</h1>
            <p>SISTEMA DE INFORMACIÓN CLÍNICA</p>
            <span className="version">v2.41 - Grace OS</span>
          </div>
        </div>
        <div className="header-right">
          <button
            className="btn-logout"
            onClick={() => {
              localStorage.removeItem("usuario");
              navigate("/");
            }}
          >
            <FiLogOut /> Cerrar sesión
          </button>
          <div className="datetime-box">
            <span className="current-date">{fmtDateTime(currentTime)}</span>
          </div>
          <div className="user-profile">
            <div className="user-avatar med-avatar">
              {initiales(usuario.nombre)}
            </div>
            <span>
              {usuario.nombre?.split(" ").slice(0, 2).join(" ") || "Médico"}
            </span>
          </div>
        </div>
      </header>

      <div className="main-content">
        <aside className="sidebar">
          <h3
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#94a3b8",
              marginBottom: "12px",
              paddingLeft: "8px",
            }}
          >
            MÓDULOS
          </h3>
          <nav className="modules-nav">
            <button
              className={`module-item ${vista === "pacientes" ? "active" : ""}`}
              onClick={() => setVista("pacientes")}
            >
              <span className="module-icon">
                <FiUsers />
              </span>
              <span className="module-name">Pacientes</span>
              <span className="module-count">{todosPacientes.length}</span>
            </button>
            <button
              className={`module-item ${["historial", "nueva-anotacion", "aclaratoria"].includes(vista) ? "active" : ""}`}
              onClick={() => pacienteSeleccionado && setVista("historial")}
            >
              <span className="module-icon">
                <FiFileText />
              </span>
              <span className="module-name">Historia Clínica</span>
              <span className="module-count">{historial.length}</span>
            </button>
          </nav>
        </aside>

        <main className="content-area">
          {/* ══ VISTA: DIRECTORIO DE PACIENTES ══ */}
          {vista === "pacientes" && (
            <>
              <div className="page-header">
                <h2>Directorio de Pacientes</h2>
                <p>
                  Seleccione un paciente para consultar su historial o registrar
                  una nueva anotación médica
                </p>
              </div>

              {/* ── 4 stat cards arriba ── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
                <div className="stat-card">
                  <div className="stat-icon-box blue">
                    <FiUsers size={22} />
                  </div>
                  <div className="stat-value">{todosPacientes.length}</div>
                  <div className="stat-label">TOTAL PACIENTES</div>
                  <div className="stat-subtext">
                    <span
                      className="stat-dot"
                      style={{ background: "#3b82f6" }}
                    />
                    Registrados en sistema
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-box green">
                    <FiCalendar size={22} />
                  </div>
                  <div className="stat-value">{citasHoy.length}</div>
                  <div className="stat-label">CITAS HOY</div>
                  <div className="stat-subtext">
                    <span
                      className="stat-dot"
                      style={{ background: "#10b981" }}
                    />
                    {citasAtendidas} atendidas · {citasSinAtender} pendientes
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-box orange">
                    <FiAlertCircle size={22} />
                  </div>
                  <div className="stat-value">{citasSinAtender}</div>
                  <div className="stat-label">SIN ATENDER HOY</div>
                  <div className="stat-subtext">
                    <span
                      className="stat-dot"
                      style={{ background: "#f97316" }}
                    />
                    {citasHoy.filter((c) => c.estado === "EN_ESPERA").length} en
                    espera ·{" "}
                    {citasHoy.filter((c) => c.estado === "PROGRAMADA").length}{" "}
                    pendientes
                  </div>
                </div>

                <div
                  className="stat-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        background: "#fff7ed",
                        color: "#f97316",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <FaStethoscope size={18} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong
                        style={{
                          fontSize: "13px",
                          color: "#1e293b",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {usuario.nombre?.split(" ").slice(0, 3).join(" ") ||
                          "Médico"}
                      </strong>
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#94a3b8",
                          letterSpacing: "0.5px",
                          fontWeight: 500,
                        }}
                      >
                        DOCTOR EN TURNO
                      </span>
                    </div>
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        background: "#10b981",
                        borderRadius: "50%",
                        flexShrink: 0,
                        boxShadow: "0 0 0 2px #d1fae5",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "11px",
                      color: "#10b981",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        background: "#10b981",
                        borderRadius: "50%",
                        display: "inline-block",
                      }}
                    />
                    Sesión activa
                  </div>
                </div>
              </div>

              {/* ── Layout: pacientes del día (izq) + tabla todos (der) ── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "420px 1fr",
                  gap: "20px",
                  alignItems: "start",
                }}
              >
                {/* COLUMNA IZQUIERDA: pacientes del día */}
                <div
                  className="directory-section"
                  style={{
                    margin: 0,
                    background: "white",
                    borderRadius: "12px",
                    padding: "18px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  <h3
                    style={{
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#1e293b",
                    }}
                  >
                    <FiCalendar className="section-icon" /> Pacientes del día
                    <span
                      style={{
                        marginLeft: "8px",
                        fontSize: "12px",
                        fontWeight: 700,
                        background: "#eff6ff",
                        color: "#2563eb",
                        padding: "3px 10px",
                        borderRadius: "12px",
                      }}
                    >
                      {citasHoy.length}
                    </span>
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      maxHeight: "650px",
                      overflowY: "auto",
                      paddingRight: "4px",
                    }}
                  >
                    {citasHoy.length === 0 ? (
                      <p
                        style={{
                          textAlign: "center",
                          color: "#94a3b8",
                          padding: "40px 0",
                          fontSize: "13px",
                        }}
                      >
                        No hay citas programadas para hoy
                      </p>
                    ) : (
                      [...citasHoy]
                        .sort((a, b) => {
                          console.log(
                            "fechaHora a:",
                            a.fechaHora,
                            "| fechaHora b:",
                            b.fechaHora,
                          );
                          const atendidoA = a.estado === "ATENDIDO" ? 1 : 0;
                          const atendidoB = b.estado === "ATENDIDO" ? 1 : 0;
                          if (atendidoA !== atendidoB)
                            return atendidoA - atendidoB;
                          const fechaA = new Date(
                            String(a.fechaHora).replace(" ", "T"),
                          );
                          const fechaB = new Date(
                            String(b.fechaHora).replace(" ", "T"),
                          );
                          console.log("fechaA:", fechaA, "| fechaB:", fechaB);
                          return fechaA - fechaB;
                        })
                        .map((c) => (



                         <CitaCard
  key={c.citId}
  cita={c}
  onEstadoChange={handleEstadoChange}
  medId={usuario.medId || usuario.id}
  onVerHistorial={(cita) => setUrgenciaPaciente(cita)}
/>



                        ))
                    )}
                  </div>
                </div>

                {/* COLUMNA DERECHA: tabla todos los pacientes */}
                <div
                  className="directory-section"
                  style={{
                    margin: 0,
                    minWidth: 0,
                    overflow: "hidden",
                    background: "white",
                    borderRadius: "12px",
                    padding: "18px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  <h3
                    style={{
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#1e293b",
                    }}
                  >
                    <FiUsers className="section-icon" /> Todos los pacientes
                  </h3>
                  <div className="search-box" style={{ marginBottom: "16px" }}>
                    <FiSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder="Búsqueda por nombre o identificación..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      style={{ width: "100%", paddingLeft: "36px" }}
                    />
                  </div>
                  <div className="patient-table" style={{ overflow: "hidden" }}>
                    <table style={{ tableLayout: "fixed", width: "100%" }}>
                      <thead>
                        <tr>
                          <th style={{ width: "18%" }}>IDENTIFICACIÓN</th>
                          <th style={{ width: "28%" }}>NOMBRE COMPLETO</th>
                          <th style={{ width: "13%" }}>GÉNERO</th>
                          <th style={{ width: "12%" }}>TIPO SANGRE</th>
                          <th style={{ width: "13%" }}>CIUDAD</th>
                          <th style={{ width: "16%" }}>ACCIÓN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pacFiltrados.map((p) => (
                          <tr key={p.documento}>
                            <td>{p.documento}</td>
                            <td>{p.nombre}</td>
                            <td>
                              {p.genero === "M"
                                ? "Masculino"
                                : p.genero === "F"
                                  ? "Femenino"
                                  : "Otro"}
                            </td>
                            <td>
                              <span className="badge-sangre">
                                {p.tipoSangre}
                              </span>
                            </td>
                            <td>{p.ciudad}</td>
                            <td>
                              <div className="action-btns">
                                <button
                                  className="btn-eye"
                                  title="Ver historial"
                                  onClick={() => verHistorial(p)}
                                >
                                  <FiEye size={13} />
                                </button>
                                <button
                                  className="btn-anotar"
                                  onClick={() => {
                                    setPaciente(p);
                                    setFormAnot({
                                      tipoConsulta: "",
                                      diagnostico: "",
                                      tratamiento: "",
                                      observaciones: "",
                                      proximaCita: "",
                                    });
                                    setErrAnot({});
                                    setIntentoAnot(false);
                                    setVista("nueva-anotacion");
                                  }}
                                >
                                  <FiPlusCircle size={12} /> Anotar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {pacFiltrados.length === 0 && (
                          <tr>
                            <td colSpan="6" className="no-results">
                              No se encontraron pacientes
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ══ VISTA: HISTORIAL CLÍNICO ══ */}
          {vista === "historial" && pacienteSeleccionado && (
            <>
              <div className="page-header hist-header">
                <button
                  className="btn-back"
                  onClick={() => setVista("pacientes")}
                >
                  <FiChevronLeft /> Volver
                </button>
                <div style={{ flex: 1 }}>
                  <h2>Historial Clínico</h2>
                  <p>
                    {pacienteSeleccionado.nombre} · CC{" "}
                    {pacienteSeleccionado.documento}
                  </p>
                </div>
                <button
                  className="btn-register"
                  style={{ width: "auto", padding: "9px 18px", marginTop: 0 }}
                  onClick={() => {
                    setFormAnot({
                      tipoConsulta: "",
                      diagnostico: "",
                      tratamiento: "",
                      observaciones: "",
                      proximaCita: "",
                    });
                    setErrAnot({});
                    setIntentoAnot(false);
                    setVista("nueva-anotacion");
                  }}
                >
                  <FiPlusCircle /> Nueva anotación
                </button>
              </div>

              <div className="pac-info-bar">
                <div className="pac-avatar">
                  {initiales(pacienteSeleccionado.nombre)}
                </div>
                <div className="pac-datos">
                  <strong>{pacienteSeleccionado.nombre}</strong>
                  <span>CC {pacienteSeleccionado.documento}</span>
                  <span>{calcEdad(pacienteSeleccionado.fechaNacimiento)}</span>
                  <span className="badge-sangre">
                    {pacienteSeleccionado.tipoSangre}
                  </span>
                  <span>{pacienteSeleccionado.ciudad}</span>
                </div>
              </div>

              <div className="filtros-bar">
                <FiFilter
                  size={13}
                  style={{ color: "#64748b", flexShrink: 0 }}
                />
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                >
                  <option value="">Todos los tipos</option>
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {TIPO_LABEL[t]}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={filtroDesde}
                  onChange={(e) => setFiltroDesde(e.target.value)}
                />
                <input
                  type="date"
                  value={filtroHasta}
                  onChange={(e) => setFiltroHasta(e.target.value)}
                />
                {(filtroTipo || filtroDesde || filtroHasta) && (
                  <button
                    className="btn-limpiar-filtros"
                    onClick={limpiarFiltros}
                  >
                    <FiX size={11} /> Limpiar
                  </button>
                )}
                <span className="filtro-count">
                  {histFiltrado.length} resultado(s)
                </span>
              </div>

              {histFiltrado.length === 0 ? (
                <div className="empty-state">
                  <FiFileText size={32} />
                  <p>
                    {filtroTipo || filtroDesde || filtroHasta
                      ? "No se encontraron notas"
                      : "Este paciente aún no tiene anotaciones"}
                  </p>
                  {(filtroTipo || filtroDesde || filtroHasta) && (
                    <button
                      className="btn-limpiar-filtros"
                      style={{ marginTop: "10px" }}
                      onClick={limpiarFiltros}
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="historial-list">
                  {histFiltrado.map((a) => (
                    <div key={a.anoId} className="anotacion-card">
                      <div className="ano-header">
                        <div className="ano-left">
                          <span
                            className={`tipo-badge ${TIPO_COLOR[a.tipoConsulta]}`}
                          >
                            {TIPO_LABEL[a.tipoConsulta]}
                          </span>
                          {a.tieneAclaratoria && (
                            <span className="acl-indicator">
                              <FiAlertCircle size={11} /> Con aclaratoria
                            </span>
                          )}
                        </div>
                        <div className="ano-fecha">
                          <FiCalendar size={12} /> {fmtFecha(a.fechaConsulta)}
                        </div>
                      </div>
                      <div className="ano-body">
                        <div className="ano-campo">
                          <span className="ano-label">Diagnóstico</span>
                          <span>{a.diagnostico}</span>
                        </div>
                        <div className="ano-campo">
                          <span className="ano-label">Tratamiento</span>
                          <span>{a.tratamiento}</span>
                        </div>
                        <div className="ano-campo">
                          <span className="ano-label">Médico</span>
                          <span>{a.medicoNombre}</span>
                        </div>
                      </div>
                      <div className="ano-footer">
                        <button
                          className="btn-eye"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "5px 10px",
                          }}
                          onClick={() => setModalDetalle(a)}
                        >
                          <FiEye size={12} /> Detalle
                        </button>
                        {a.tieneAclaratoria && (
                          <button
                            className="btn-ver-acl"
                            onClick={() => {
                              setModalAcl(a);
                              cargarAclaratorias(a.anoId);
                            }}
                          >
                            <FiAlertCircle size={12} /> Ver aclaratorias
                          </button>
                        )}
                        <button
                          className="btn-acl"
                          onClick={() => {
                            setAnotSeleccionada(a);
                            setDescAcl("");
                            setErrAcl("");
                            setIntentoAcl(false);
                            setVista("aclaratoria");
                          }}
                        >
                          <FiPlusCircle size={12} /> Aclaratoria
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ══ VISTA: NUEVA ANOTACIÓN ══ */}
          {vista === "nueva-anotacion" && pacienteSeleccionado && (
            <>
              <div className="page-header hist-header">
                <button
                  className="btn-back"
                  onClick={() =>
                    setVista(historial.length > 0 ? "historial" : "pacientes")
                  }
                >
                  <FiChevronLeft /> Volver
                </button>
                <div>
                  <h2>Nueva Anotación Médica</h2>
                  <p>
                    {pacienteSeleccionado.nombre} · CC{" "}
                    {pacienteSeleccionado.documento}
                  </p>
                </div>
              </div>

              <div className="form-section" style={{ maxWidth: "680px" }}>
                <h3>
                  <FiFileText className="section-icon" /> Datos de la consulta
                </h3>
                <form
                  className="patient-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleGuardarAnotacion();
                  }}
                >
                  <div className="form-section-label">TIPO Y DIAGNÓSTICO</div>

                  <div className="form-group">
                    <label>TIPO DE CONSULTA *</label>
                    <CampoRequerido error={errAnot.tipoConsulta}>
                      <select
                        value={formAnot.tipoConsulta}
                        onChange={(e) => {
                          setFormAnot((p) => ({
                            ...p,
                            tipoConsulta: e.target.value,
                          }));
                          if (intentoAnot)
                            setErrAnot((p) => ({
                              ...p,
                              tipoConsulta: e.target.value
                                ? ""
                                : "Seleccione el tipo de consulta",
                            }));
                        }}
                        style={inputErrStyle("tipoConsulta")}
                      >
                        <option value="">Seleccione...</option>
                        {TIPOS.map((t) => (
                          <option key={t} value={t}>
                            {TIPO_LABEL[t]}
                          </option>
                        ))}
                      </select>
                    </CampoRequerido>
                  </div>

                  <div className="form-group">
                    <label>
                      DIAGNÓSTICO *{" "}
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#94a3b8",
                          fontWeight: 400,
                        }}
                      >
                        (máx. 200 caracteres)
                      </span>
                    </label>
                    <CampoRequerido error={errAnot.diagnostico}>
                      <textarea
                        rows={3}
                        maxLength={200}
                        placeholder="Describa el diagnóstico médico..."
                        value={formAnot.diagnostico}
                        onChange={(e) => {
                          setFormAnot((p) => ({
                            ...p,
                            diagnostico: e.target.value,
                          }));
                          if (intentoAnot)
                            setErrAnot((p) => ({
                              ...p,
                              diagnostico: e.target.value.trim()
                                ? ""
                                : "El diagnóstico es requerido",
                            }));
                        }}
                        style={{
                          ...inputErrStyle("diagnostico"),
                          resize: "vertical",
                        }}
                      />
                    </CampoRequerido>
                  </div>

                  <div className="form-section-label">
                    TRATAMIENTO Y OBSERVACIONES
                  </div>

                  <div className="form-group">
                    <label>
                      TRATAMIENTO *{" "}
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#94a3b8",
                          fontWeight: 400,
                        }}
                      >
                        (máx. 200 caracteres)
                      </span>
                    </label>
                    <CampoRequerido error={errAnot.tratamiento}>
                      <textarea
                        rows={3}
                        maxLength={200}
                        placeholder="Indique el tratamiento a seguir..."
                        value={formAnot.tratamiento}
                        onChange={(e) => {
                          setFormAnot((p) => ({
                            ...p,
                            tratamiento: e.target.value,
                          }));
                          if (intentoAnot)
                            setErrAnot((p) => ({
                              ...p,
                              tratamiento: e.target.value.trim()
                                ? ""
                                : "El tratamiento es requerido",
                            }));
                        }}
                        style={{
                          ...inputErrStyle("tratamiento"),
                          resize: "vertical",
                        }}
                      />
                    </CampoRequerido>
                  </div>

                  <div className="form-group">
                    <label>
                      OBSERVACIONES *{" "}
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#94a3b8",
                          fontWeight: 400,
                        }}
                      >
                        (máx. 500 caracteres)
                      </span>
                    </label>
                    <CampoRequerido error={errAnot.observaciones}>
                      <textarea
                        rows={4}
                        maxLength={500}
                        placeholder="Observaciones adicionales de la consulta..."
                        value={formAnot.observaciones}
                        onChange={(e) => {
                          setFormAnot((p) => ({
                            ...p,
                            observaciones: e.target.value,
                          }));
                          if (intentoAnot)
                            setErrAnot((p) => ({
                              ...p,
                              observaciones: e.target.value.trim()
                                ? ""
                                : "Las observaciones son requeridas",
                            }));
                        }}
                        style={{
                          ...inputErrStyle("observaciones"),
                          resize: "vertical",
                        }}
                      />
                    </CampoRequerido>
                  </div>

                  <div className="form-section-label">
                    PRÓXIMA CITA (OPCIONAL)
                  </div>

                  <div className="form-group">
                    <label>FECHA Y HORA</label>
                    <input
                      type="datetime-local"
                      value={formAnot.proximaCita}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={(e) =>
                        setFormAnot((p) => ({
                          ...p,
                          proximaCita: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="inmutabilidad-aviso">
                    <FiAlertCircle
                      size={14}
                      style={{ flexShrink: 0, marginTop: "1px" }}
                    />
                    <span>
                      Las anotaciones médicas son <strong>inmutables</strong>.
                      Una vez registrada no puede editarse ni eliminarse. Para
                      correcciones use notas aclaratorias.
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      justifyContent: "flex-end",
                      marginTop: "4px",
                    }}
                  >
                    <button
                      type="button"
                      className="btn-cancelar"
                      onClick={() =>
                        setVista(
                          historial.length > 0 ? "historial" : "pacientes",
                        )
                      }
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-register"
                      style={{
                        width: "auto",
                        padding: "10px 22px",
                        marginTop: 0,
                      }}
                      disabled={loading}
                    >
                      {loading ? (
                        "Registrando..."
                      ) : (
                        <>
                          <FiCheckCircle size={14} /> Registrar anotación
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}

          {/* ══ VISTA: NOTA ACLARATORIA ══ */}
          {vista === "aclaratoria" && anotSeleccionada && (
            <>
              <div className="page-header hist-header">
                <button
                  className="btn-back"
                  onClick={() => setVista("historial")}
                >
                  <FiChevronLeft /> Volver al historial
                </button>
                <div>
                  <h2>Crear Nota Aclaratoria</h2>
                  <p>{pacienteSeleccionado?.nombre}</p>
                </div>
              </div>

              <div className="original-card">
                <div className="original-header">
                  <span className="original-lbl">
                    ANOTACIÓN ORIGINAL — SOLO LECTURA
                  </span>
                  <span
                    className={`tipo-badge ${TIPO_COLOR[anotSeleccionada.tipoConsulta]}`}
                  >
                    {TIPO_LABEL[anotSeleccionada.tipoConsulta]}
                  </span>
                </div>
                {[
                  ["Fecha", fmtFecha(anotSeleccionada.fechaConsulta)],
                  ["Médico", anotSeleccionada.medicoNombre],
                  ["Diagnóstico", anotSeleccionada.diagnostico],
                  ["Tratamiento", anotSeleccionada.tratamiento],
                  ["Observaciones", anotSeleccionada.observaciones],
                  anotSeleccionada.proximaCita
                    ? ["Próxima cita", fmtFecha(anotSeleccionada.proximaCita)]
                    : null,
                ]
                  .filter(Boolean)
                  .map(([k, v]) => (
                    <div key={k} className="original-fila">
                      <span>{k}</span>
                      <span>{v}</span>
                    </div>
                  ))}
              </div>

              <div className="form-section" style={{ maxWidth: "680px" }}>
                <h3>
                  <FiAlertCircle
                    className="section-icon"
                    style={{ color: "#7c3aed" }}
                  />{" "}
                  Nota aclaratoria
                </h3>
                <div className="patient-form">
                  <div className="form-section-label">
                    DESCRIPCIÓN DE LA CORRECCIÓN
                  </div>
                  <div className="form-group">
                    <label>
                      CORRECCIÓN *{" "}
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#94a3b8",
                          fontWeight: 400,
                        }}
                      >
                        (mín. 10 · máx. 500 caracteres)
                      </span>
                    </label>
                    <CampoRequerido error={errAcl}>
                      <textarea
                        rows={5}
                        maxLength={500}
                        placeholder="Describa la corrección o aclaración a la anotación original..."
                        value={descAcl}
                        onChange={(e) => {
                          setDescAcl(e.target.value);
                          if (intentoAcl)
                            setErrAcl(
                              !e.target.value.trim() ||
                                e.target.value.trim().length < 10
                                ? "La descripción debe tener al menos 10 caracteres"
                                : "",
                            );
                        }}
                        style={{
                          ...(errAcl
                            ? { borderColor: "#ef4444", background: "#fff5f5" }
                            : {}),
                          resize: "vertical",
                        }}
                      />
                    </CampoRequerido>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#94a3b8",
                        textAlign: "right",
                      }}
                    >
                      {descAcl.length}/500
                    </span>
                  </div>
                  <div className="inmutabilidad-aviso">
                    <FiAlertCircle
                      size={14}
                      style={{ flexShrink: 0, marginTop: "1px" }}
                    />
                    <span>
                      La anotación original permanecerá{" "}
                      <strong>inalterada</strong>. Esta nota aclaratoria también
                      será inmutable una vez creada.
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      justifyContent: "flex-end",
                      marginTop: "4px",
                    }}
                  >
                    <button
                      className="btn-cancelar"
                      onClick={() => setVista("historial")}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn-register"
                      style={{
                        width: "auto",
                        padding: "10px 22px",
                        marginTop: 0,
                        background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                      }}
                      onClick={handleGuardarAclaratoria}
                      disabled={loading}
                    >
                      {loading ? (
                        "Registrando..."
                      ) : (
                        <>
                          <FiCheckCircle size={14} /> Registrar aclaratoria
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <footer className="main-footer">
        <span>CMQ — Módulo Médico</span>
        <span className="session-info">
          <span className="status-dot" />
          Sesión activa — {fmtDateTime(currentTime)}
        </span>
      </footer>

      {/* MODAL: DETALLE ANOTACIÓN */}
      {modalDetalle && (
        <div className="modal-overlay" onClick={() => setModalDetalle(null)}>
          <div
            className="modal modal-perfil"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-box">
                  <FiFileText size={18} />
                </div>
                <div>
                  <h3>Detalle de Anotación</h3>
                  <p>{fmtFecha(modalDetalle.fechaConsulta)}</p>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setModalDetalle(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body perfil-body">
              <div className="perfil-seccion-titulo">INFORMACIÓN GENERAL</div>
              <div className="perfil-fila">
                <span>Tipo</span>
                <span
                  className={`tipo-badge ${TIPO_COLOR[modalDetalle.tipoConsulta]}`}
                >
                  {TIPO_LABEL[modalDetalle.tipoConsulta]}
                </span>
              </div>
              <div className="perfil-fila">
                <span>Médico</span>
                <span>{modalDetalle.medicoNombre}</span>
              </div>
              <div className="perfil-fila">
                <span>Especialidad</span>
                <span>{modalDetalle.medicoEspecialidad}</span>
              </div>
              <div className="perfil-fila">
                <span>Fecha</span>
                <span>{fmtFecha(modalDetalle.fechaConsulta)}</span>
              </div>
              {modalDetalle.proximaCita && (
                <div className="perfil-fila">
                  <span>Próxima cita</span>
                  <span>{fmtFecha(modalDetalle.proximaCita)}</span>
                </div>
              )}
              <div className="perfil-seccion-titulo">NOTAS CLÍNICAS</div>
              <div
                className="perfil-fila"
                style={{ flexDirection: "column", gap: "3px" }}
              >
                <span>Diagnóstico</span>
                <span style={{ fontWeight: 400, color: "#1e293b" }}>
                  {modalDetalle.diagnostico}
                </span>
              </div>
              <div
                className="perfil-fila"
                style={{ flexDirection: "column", gap: "3px" }}
              >
                <span>Tratamiento</span>
                <span style={{ fontWeight: 400, color: "#1e293b" }}>
                  {modalDetalle.tratamiento}
                </span>
              </div>
              <div
                className="perfil-fila"
                style={{ flexDirection: "column", gap: "3px" }}
              >
                <span>Observaciones</span>
                <span style={{ fontWeight: 400, color: "#1e293b" }}>
                  {modalDetalle.observaciones}
                </span>
              </div>
              {modalDetalle.tieneAclaratoria && (
                <div className="acl-aviso-modal">
                  <FiAlertCircle size={13} /> Esta anotación tiene nota(s)
                  aclaratoria(s)
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancelar"
                onClick={() => setModalDetalle(null)}
              >
                Cerrar
              </button>
              <button
                className="btn-guardar btn-purple"
                onClick={() => {
                  setAnotSeleccionada(modalDetalle);
                  setDescAcl("");
                  setErrAcl("");
                  setIntentoAcl(false);
                  setModalDetalle(null);
                  setVista("aclaratoria");
                }}
              >
                <FiPlusCircle size={13} /> Crear aclaratoria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VER ACLARATORIAS */}
      {modalAcl && (
        <div className="modal-overlay" onClick={() => setModalAcl(null)}>
          <div
            className="modal modal-perfil"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <div
                  className="modal-icon-box"
                  style={{ background: "#fff7ed", color: "#c2410c" }}
                >
                  <FiAlertCircle size={18} />
                </div>
                <div>
                  <h3>Notas Aclaratorias</h3>
                  <p>Anotación del {fmtFecha(modalAcl.fechaConsulta)}</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setModalAcl(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body perfil-body">
              {aclaratorias.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    color: "#94a3b8",
                    padding: "20px 0",
                  }}
                >
                  Cargando...
                </p>
              ) : (
                aclaratorias.map((ac) => (
                  <div key={ac.nacId} className="acl-item">
                    <div className="acl-item-top">
                      <span className="acl-tag">Nota #{ac.nacId}</span>
                      <span className="acl-fecha">
                        {fmtFecha(ac.fechaCreacion)}
                      </span>
                    </div>
                    <p className="acl-desc">{ac.descripcion}</p>
                    <span className="acl-medico">Dr. {ac.medicoNombre}</span>
                  </div>
                ))
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancelar"
                onClick={() => setModalAcl(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>



) }

      {urgenciaPaciente && (
        <DoctorUrgencias
          paciente={urgenciaPaciente}
          onClose={() => setUrgenciaPaciente(null)}
        />
      )}
    </div>
    );
  }