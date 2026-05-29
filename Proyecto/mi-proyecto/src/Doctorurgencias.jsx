import { useState, useEffect } from "react";
import {
  FiX,
  FiActivity,
  FiHeart,
  FiThermometer,
  FiAlertTriangle,
  FiClock,
  FiUser,
  FiFileText,
  FiDroplet,
} from "react-icons/fi";
import "./DoctorUrgencias.css";

const API = "https://cmq-backend.onrender.com/api";

/* ── helpers ── */
const fmtFecha = (ts) => {
  if (!ts) return "—";
  const d = new Date(String(ts).replace(" ", "T"));
  return d.toLocaleString("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
};

const calcEdad = (fn) => {
  if (!fn) return "—";
  const hoy = new Date(), nac = new Date(fn);
  let e = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
  return `${e} años`;
};

/* ────────────────────────────────────────────────────────── */
/*  CONFIGURACIÓN DE CRITICIDAD                               */
/* ────────────────────────────────────────────────────────── */
const NIVEL_CONFIG = {
  CRITICO: {
    label: "CRÍTICO",
    pulse: true,
    bar: 100,
    tag: "urg-tag-critico",
    icon: "🔴",
    triageRom: ["I", "II"],
  },
  ESTABLE: {
    label: "ESTABLE",
    pulse: false,
    bar: 55,
    tag: "urg-tag-estable",
    icon: "🟡",
    triageRom: ["III"],
  },
  LEVE: {
    label: "LEVE",
    pulse: false,
    bar: 25,
    tag: "urg-tag-leve",
    icon: "🟢",
    triageRom: ["IV", "V"],
  },
};

const TRIAGE_LABEL = {
  I: "Triage I — Resucitación",
  II: "Triage II — Emergencia",
  III: "Triage III — Urgencia",
  IV: "Triage IV — Menor urgencia",
  V: "Triage V — No urgente",
};

/* ────────────────────────────────────────────────────────── */
/*  COMPONENTE PRINCIPAL                                       */
/* ────────────────────────────────────────────────────────── */
export default function DoctorUrgencias({ paciente, onClose }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!paciente?.pacDoc) { setCargando(false); return; }
    const cargar = async () => {
      try {
        /* triage + signos vitales de la cita */
        const [triRes, pacRes] = await Promise.all([
          fetch(`${API}/triage/cita/${paciente.citId}`),
          fetch(`${API}/pacientes/${paciente.pacDoc}`),
        ]);
        const triData = triRes.ok ? await triRes.json() : null;
        const pacData = pacRes.ok ? await pacRes.json() : null;
        setDatos({ triage: triData, pacInfo: pacData });
      } catch {
        setDatos({ triage: null, pacInfo: null });
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [paciente]);

  if (!paciente) return null;

  const nivel = paciente.nivelPaciente || "ESTABLE";
  const cfg   = NIVEL_CONFIG[nivel] || NIVEL_CONFIG.ESTABLE;
  const triage = datos?.triage;
  const pac    = datos?.pacInfo;

  return (
    <div className="urg-overlay" onClick={onClose}>
      <div className="urg-panel" onClick={(e) => e.stopPropagation()}>

        {/* ── HEADER ── */}
        <div className={`urg-header urg-header-${nivel.toLowerCase()}`}>
          <div className="urg-header-left">
            <div className={`urg-avatar ${cfg.pulse ? "urg-pulse" : ""}`}>
              {paciente.pacNombre?.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "??"}
            </div>
            <div>
              <div className="urg-nombre">{paciente.pacNombre}</div>
              <div className="urg-sub">
                CC {paciente.pacDoc}
                {pac?.fechaNacimiento && <span> · {calcEdad(pac.fechaNacimiento)}</span>}
                {pac?.tipoSangre && (
                  <span className="urg-sangre">
                    <FiDroplet size={10} /> {pac.tipoSangre}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="urg-header-right">
            <span className={`urg-tag ${cfg.tag}`}>
              {cfg.icon} {cfg.label}
            </span>
            <button className="urg-close" onClick={onClose}><FiX size={18} /></button>
          </div>
        </div>

        {/* ── BARRA DE CRITICIDAD ── */}
        <div className="urg-criticidad-bar-wrap">
          <div className="urg-criticidad-label">
            <span>Nivel de criticidad</span>
            <span className="urg-criticidad-pct">{cfg.bar}%</span>
          </div>
          <div className="urg-criticidad-track">
            <div
              className={`urg-criticidad-fill urg-fill-${nivel.toLowerCase()}`}
              style={{ width: `${cfg.bar}%` }}
            />
          </div>
          <div className="urg-criticidad-steps">
            <span className={nivel === "LEVE"    ? "active" : ""}>LEVE</span>
            <span className={nivel === "ESTABLE" ? "active" : ""}>ESTABLE</span>
            <span className={nivel === "CRITICO" ? "active" : ""}>CRÍTICO</span>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="urg-body">
          {cargando ? (
            <div className="urg-loading">
              <div className="urg-spinner" />
              <span>Cargando datos clínicos…</span>
            </div>
          ) : (
            <>
              {/* TRIAGE */}
              {triage ? (
                <section className="urg-section">
                  <h4 className="urg-section-title">
                    <FiActivity size={14} /> Clasificación de Triage
                  </h4>
                  <div className="urg-grid2">
                    <div className="urg-dato">
                      <span className="urg-dato-lbl">Nivel</span>
                      <span className="urg-dato-val">
                        {TRIAGE_LABEL[triage.nivel] || `Triage ${triage.nivel}`}
                      </span>
                    </div>
                    <div className="urg-dato">
                      <span className="urg-dato-lbl"><FiClock size={11} /> Registrado</span>
                      <span className="urg-dato-val">{fmtFecha(triage.fechaHora)}</span>
                    </div>
                  </div>
                  {triage.sintomas && (
                    <div className="urg-sintomas">
                      <span className="urg-dato-lbl"><FiFileText size={11} /> Síntomas / Motivo</span>
                      <p>{triage.sintomas}</p>
                    </div>
                  )}
                </section>
              ) : (
                <div className="urg-no-triage">
                  <FiAlertTriangle size={16} />
                  <span>Triage aún no registrado por enfermería</span>
                </div>
              )}

              {/* SIGNOS VITALES */}
              {triage?.signosVitales && (
                <section className="urg-section">
                  <h4 className="urg-section-title">
                    <FiHeart size={14} /> Signos Vitales
                  </h4>
                  <div className="urg-signos-grid">
                    <SignoCard
                      icon={<FiHeart size={14} />}
                      label="F. Cardíaca"
                      valor={triage.signosVitales.frecuenciaCardiaca}
                      unidad="LPM"
                      alerta={
                        triage.signosVitales.frecuenciaCardiaca > 100 ||
                        triage.signosVitales.frecuenciaCardiaca < 60
                      }
                    />
                    <SignoCard
                      icon={<FiActivity size={14} />}
                      label="Presión"
                      valor={triage.signosVitales.presionArterial}
                      unidad="mmHg"
                    />
                    <SignoCard
                      icon={<FiThermometer size={14} />}
                      label="Temperatura"
                      valor={triage.signosVitales.temperatura}
                      unidad="°C"
                      alerta={triage.signosVitales.temperatura >= 38.5}
                    />
                    <SignoCard
                      icon={<FiDroplet size={14} />}
                      label="Saturación O₂"
                      valor={triage.signosVitales.saturacion}
                      unidad="%"
                      alerta={triage.signosVitales.saturacion < 90}
                    />
                  </div>
                </section>
              )}

              {/* INFO PACIENTE (si viene del backend) */}
              {pac && (
                <section className="urg-section">
                  <h4 className="urg-section-title">
                    <FiUser size={14} /> Datos del Paciente
                  </h4>
                  <div className="urg-grid2">
                    {pac.nombre     && <FilaDato label="Nombre"    valor={pac.nombre} />}
                    {pac.genero     && <FilaDato label="Género"    valor={pac.genero === "M" ? "Masculino" : pac.genero === "F" ? "Femenino" : "Otro"} />}
                    {pac.tipoSangre && <FilaDato label="Sangre"    valor={pac.tipoSangre} />}
                    {pac.ciudad     && <FilaDato label="Ciudad"    valor={pac.ciudad} />}
                    {pac.telefono   && <FilaDato label="Teléfono"  valor={pac.telefono} />}
                    {pac.emergenciaNombre && (
                      <FilaDato label="Contacto emergencia" valor={`${pac.emergenciaNombre} · ${pac.emergenciaTel}`} />
                    )}
                  </div>
                </section>
              )}

              {/* CITA */}
              <section className="urg-section">
                <h4 className="urg-section-title">
                  <FiClock size={14} /> Datos de la Cita
                </h4>
                <div className="urg-grid2">
                  <FilaDato label="ID Cita"  valor={`#${paciente.citId}`} />
                  <FilaDato label="Motivo"   valor={paciente.motivo || "URGENCIA"} />
                  <FilaDato label="Estado"   valor={paciente.estado} />
                  <FilaDato label="Hora"     valor={fmtFecha(paciente.fechaHora)} />
                </div>
              </section>
            </>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="urg-footer">
          <span className="urg-footer-note">
            Vista de solo lectura — Módulo Urgencias CMQ
          </span>
          <button className="urg-btn-cerrar" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-componentes ── */
function SignoCard({ icon, label, valor, unidad, alerta }) {
  return (
    <div className={`urg-signo-card ${alerta ? "urg-signo-alerta" : ""}`}>
      <div className="urg-signo-icon">{icon}</div>
      <div className="urg-signo-valor">
        {valor != null ? valor : "—"}
        {valor != null && <span className="urg-signo-unit"> {unidad}</span>}
      </div>
      <div className="urg-signo-label">{label}</div>
      {alerta && <div className="urg-signo-warn">⚠️</div>}
    </div>
  );
}

function FilaDato({ label, valor }) {
  return (
    <div className="urg-dato">
      <span className="urg-dato-lbl">{label}</span>
      <span className="urg-dato-val">{valor || "—"}</span>
    </div>
  );
}