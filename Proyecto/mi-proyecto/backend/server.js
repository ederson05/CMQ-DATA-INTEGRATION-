//Local
/*
const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174']
}));
app.use(express.json());

const dbConfig = {
  user: 'cmq2',
  password: 'oracle',
  connectString: 'localhost:1521/XEPDB1'
};

// ══════════════════════════════════════════════════════════════
// TEST
// ══════════════════════════════════════════════════════════════
app.get('/api/test', async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    res.json({ mensaje: 'Conectado a Oracle!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// ══════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(
      `SELECT USU_ID, USU_EMAIL, USU_NOMBRE, USU_ROL
       FROM TBL_USUARIO
       WHERE USU_EMAIL = :email
         AND USU_CONTRASENA = :password
         AND USU_ACTIVO = 1`,
      { email, password }
    );
    if (result.rows.length > 0) {
      const u = result.rows[0];

      let medId = null;
      if (u[3] === 'MEDICO') {
        const med = await conn.execute(
          `SELECT MED_ID FROM TBL_MEDICO WHERE MED_ID = :id`,
          { id: u[0] }
        );
        if (med.rows.length > 0) medId = med.rows[0][0];
      }

      await conn.execute(
        `UPDATE TBL_USUARIO SET USU_ULTIMO_ACCESO = CURRENT_TIMESTAMP WHERE USU_ID = :id`,
        { id: u[0] },
        { autoCommit: true }
      );

      res.json({
        success: true,
        usuario: { id: u[0], email: u[1], nombre: u[2], rol: u[3], medId }
      });
    } else {
      res.status(401).json({ success: false, mensaje: 'Credenciales incorrectas' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// ══════════════════════════════════════════════════════════════
// PACIENTES
// ══════════════════════════════════════════════════════════════
app.get('/api/pacientes', async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute('SELECT * FROM TBL_PACIENTE ORDER BY PAC_NOMBRE ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

app.post('/api/pacientes', async (req, res) => {
  const {
    id, nombre, telefono, fechaNacimiento, genero, tipoSangre,
    email, direccion, ciudad, contactoEmergenciaNombre, contactoEmergenciaTel
  } = req.body;
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    await conn.execute(
      `INSERT INTO TBL_PACIENTE
         (PAC_DOCUMENTO, PAC_NOMBRE, PAC_TELEFONO, PAC_FECHA_NACIMIENTO, PAC_GENERO,
          PAC_TIPO_SANGRE, PAC_EMAIL, PAC_DIRECCION, PAC_CIUDAD,
          PAC_EMERGENCIA_NOMBRE, PAC_EMERGENCIA_TELEFONO, PAC_REGISTRO)
       VALUES
         (:documento, :nombre, :telefono, TO_DATE(:fechaNacimiento,'YYYY-MM-DD'), :genero,
          :tipoSangre, :email, :direccion, :ciudad,
          :emergenciaNombre, :emergenciaTel, CURRENT_TIMESTAMP)`,
      {
        documento:        String(id).trim(),
        nombre,
        telefono,
        fechaNacimiento,
        genero,
        tipoSangre,
        email:            email                    || ' ',
        direccion,
        ciudad,
        emergenciaNombre: contactoEmergenciaNombre || ' ',
        emergenciaTel:    contactoEmergenciaTel    || ' '
      },
      { autoCommit: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('❌ ERROR POST /api/pacientes:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

app.put('/api/pacientes/:id', async (req, res) => {
  const {
    nombre, telefono, email, direccion, ciudad,
    contactoEmergenciaNombre, contactoEmergenciaTel
  } = req.body;
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(
      `UPDATE TBL_PACIENTE SET
         PAC_NOMBRE              = :nombre,
         PAC_TELEFONO            = :telefono,
         PAC_EMAIL               = :email,
         PAC_DIRECCION           = :direccion,
         PAC_CIUDAD              = :ciudad,
         PAC_EMERGENCIA_NOMBRE   = :emergenciaNombre,
         PAC_EMERGENCIA_TELEFONO = :emergenciaTel
       WHERE PAC_DOCUMENTO = :documento`,
      {
        nombre,
        telefono,
        email:           email                    || ' ',
        direccion,
        ciudad,
        emergenciaNombre: contactoEmergenciaNombre || ' ',
        emergenciaTel:    contactoEmergenciaTel    || ' ',
        documento:        req.params.id
      },
      { autoCommit: true }
    );
    res.json({ success: result.rowsAffected > 0 });
  } catch (err) {
    console.error('❌ ERROR PUT /api/pacientes:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// ══════════════════════════════════════════════════════════════
// MÉDICOS
// ══════════════════════════════════════════════════════════════
app.get('/api/medicos', async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(
      'SELECT MED_ID, MED_NOMBRE, MED_ESPECIALIDAD FROM TBL_MEDICO WHERE MED_ACTIVO = 1'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// ══════════════════════════════════════════════════════════════
// CITAS
// ══════════════════════════════════════════════════════════════
app.get('/api/citas', async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(
      `SELECT c.CIT_ID, c.PAC_DOCUMENTO, p.PAC_NOMBRE, m.MED_ID, m.MED_NOMBRE,
              c.CIT_FECHA_HORA, c.CIT_MOTIVO_CONSULTA, c.CIT_ESTADO, c.CIT_NIVEL_PACIENTE
       FROM TBL_CITA c
       JOIN TBL_PACIENTE p ON c.PAC_DOCUMENTO = p.PAC_DOCUMENTO
       JOIN TBL_MEDICO   m ON c.MED_ID        = m.MED_ID
       ORDER BY c.CIT_FECHA_HORA DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

app.post('/api/citas', async (req, res) => {
  const { pacDocumento, medId, usuId, fechaHora, motivo, nivelPaciente } = req.body;
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    const citId = (await conn.execute('SELECT NVL(MAX(CIT_ID),0)+1 FROM TBL_CITA')).rows[0][0];
    await conn.execute(
      `INSERT INTO TBL_CITA
         (CIT_ID, PAC_DOCUMENTO, MED_ID, USU_ID, CIT_FECHA_HORA,
          CIT_MOTIVO_CONSULTA, CIT_ESTADO, CIT_OBSERVACIONES, CIT_FECHA_CREACION, CIT_NIVEL_PACIENTE)
       VALUES
         (:citId, :pacDocumento, :medId, :usuId,
          TO_TIMESTAMP(:fechaHora,'YYYY-MM-DD"T"HH24:MI'),
          :motivo, 'PROGRAMADA', ' ', CURRENT_TIMESTAMP, :nivelPaciente)`,
      {
        citId, pacDocumento, medId,
        usuId: usuId || 1,
        fechaHora,
        motivo: motivo || 'Sin motivo',
        nivelPaciente: nivelPaciente || 'ESTABLE'
      },
      { autoCommit: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('❌ ERROR POST /api/citas:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

app.put('/api/citas/:id', async (req, res) => {
  const { medId, fechaHora, estado, nivelPaciente } = req.body;
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    await conn.execute(
      `UPDATE TBL_CITA SET
         MED_ID         = :medId,
         CIT_FECHA_HORA = TO_TIMESTAMP(:fechaHora,'YYYY-MM-DD"T"HH24:MI'),
         CIT_ESTADO     = :estado,
         CIT_NIVEL_PACIENTE = :nivelPaciente
       WHERE CIT_ID = :id`,
      { medId, fechaHora, estado, nivelPaciente, id: req.params.id },
      { autoCommit: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// ══════════════════════════════════════════════════════════════
// USUARIOS
// ══════════════════════════════════════════════════════════════
app.get('/api/usuarios', async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute('SELECT * FROM TBL_USUARIO');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// ══════════════════════════════════════════════════════════════
// HISTORIA CLÍNICA
// ══════════════════════════════════════════════════════════════

// Conteo de historias (para stats del dashboard)
app.get('/api/historias', async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(
      'SELECT HIS_ID, PAC_DOCUMENTO FROM TBL_HISTORIA_CLINICA'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// Historial completo de un paciente
app.get('/api/historias/:pacDocumento', async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(
      `SELECT
         hc.HIS_ID,
         hc.PAC_DOCUMENTO,
         a.ANO_ID,
         a.ANO_TIPO_CONSULTA,
         a.ANO_FECHA_CONSULTA,
         a.ANO_DIAGNOSTICO,
         a.ANO_TRATAMIENTO,
         a.ANO_OBSERVACIONES,
         a.ANO_PROXIMA_CITA,
         a.ANO_FECHA_CREACION,
         m.MED_NOMBRE,
         m.MED_ESPECIALIDAD,
         CASE WHEN EXISTS (
           SELECT 1 FROM TBL_NOTA_ACLARATORIA na WHERE na.ANO_ID = a.ANO_ID
         ) THEN 1 ELSE 0 END AS TIENE_ACLARATORIA
       FROM TBL_HISTORIA_CLINICA hc
       JOIN TBL_ANOTACION a ON a.HIS_ID = hc.HIS_ID
       JOIN TBL_MEDICO    m ON m.MED_ID = a.MED_ID
       WHERE hc.PAC_DOCUMENTO = :pacDocumento
       ORDER BY a.ANO_FECHA_CONSULTA DESC`,
      { pacDocumento: req.params.pacDocumento }
    );
    res.json(result.rows.map(r => ({
      hisId:              r[0],
      pacDocumento:       r[1],
      anoId:              r[2],
      tipoConsulta:       r[3],
      fechaConsulta:      r[4],
      diagnostico:        r[5],
      tratamiento:        r[6],
      observaciones:      r[7],
      proximaCita:        r[8],
      fechaCreacion:      r[9],
      medicoNombre:       r[10],
      medicoEspecialidad: r[11],
      tieneAclaratoria:   r[12] === 1
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// Notas aclaratorias de una anotación
app.get('/api/anotaciones/:anoId/aclaratorias', async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(
      `SELECT na.NAC_ID, na.ANO_ID, na.MED_ID, m.MED_NOMBRE,
              na.NAC_DESCRIPCION, na.NAC_FECHA_CREACION
       FROM TBL_NOTA_ACLARATORIA na
       JOIN TBL_MEDICO m ON m.MED_ID = na.MED_ID
       WHERE na.ANO_ID = :anoId
       ORDER BY na.NAC_FECHA_CREACION ASC`,
      { anoId: Number(req.params.anoId) }
    );
    res.json(result.rows.map(r => ({
      nacId:         r[0],
      anoId:         r[1],
      medId:         r[2],
      medicoNombre:  r[3],
      descripcion:   r[4],
      fechaCreacion: r[5]
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// Crear anotación médica (crea historia si no existe)
app.post('/api/anotaciones', async (req, res) => {
  const {
    pacDocumento, medId, usuId,
    tipoConsulta, diagnostico, tratamiento, observaciones, proximaCita
  } = req.body;
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);

    // 1 — Obtener o crear historia clínica
    let hisId;
    const hisResult = await conn.execute(
      'SELECT HIS_ID FROM TBL_HISTORIA_CLINICA WHERE PAC_DOCUMENTO = :pacDocumento',
      { pacDocumento }
    );

    if (hisResult.rows.length > 0) {
      hisId = hisResult.rows[0][0];
    } else {
      const newHisId = (await conn.execute(
        'SELECT NVL(MAX(HIS_ID),0)+1 FROM TBL_HISTORIA_CLINICA'
      )).rows[0][0];
      hisId = newHisId;
      await conn.execute(
        `INSERT INTO TBL_HISTORIA_CLINICA (HIS_ID, PAC_DOCUMENTO, HIS_FECHA_APERTURA)
         VALUES (:hisId, :pacDocumento, CURRENT_TIMESTAMP)`,
        { hisId, pacDocumento }
      );
    }

    // 2 — Insertar anotación
    const anoId = (await conn.execute(
      'SELECT NVL(MAX(ANO_ID),0)+1 FROM TBL_ANOTACION'
    )).rows[0][0];

    await conn.execute(
      `INSERT INTO TBL_ANOTACION
         (ANO_ID, HIS_ID, MED_ID, ANO_TIPO_CONSULTA, ANO_FECHA_CONSULTA,
          ANO_DIAGNOSTICO, ANO_TRATAMIENTO, ANO_OBSERVACIONES,
          ANO_PROXIMA_CITA, ANO_FECHA_CREACION)
       VALUES
         (:anoId, :hisId, :medId, :tipoConsulta, CURRENT_TIMESTAMP,
          :diagnostico, :tratamiento, :observaciones,
          :proximaCita, CURRENT_TIMESTAMP)`,
      {
        anoId, hisId, medId, tipoConsulta, diagnostico, tratamiento, observaciones,
        proximaCita: proximaCita ? new Date(proximaCita) : null
      }
    );

    // 3 — Auditoría (no bloquea si falla)
    try {
      const audId = (await conn.execute(
        'SELECT NVL(MAX(AUD_ID),0)+1 FROM TBL_AUDITORIA'
      )).rows[0][0];
      await conn.execute(
        `INSERT INTO TBL_AUDITORIA
           (AUD_ID, USU_ID, AUD_ACCION, AUD_ENTIDAD, AUD_REGISTRO_ID,
            AUD_DETALLES, AUD_FECHA_HORA, AUD_ID_ADDRESS)
         VALUES
           (:audId, :usuId, 'INSERT', 'TBL_ANOTACION', :anoId,
            'Nueva anotacion medica', CURRENT_TIMESTAMP, '127.0.0.1')`,
        { audId, usuId: usuId || 1, anoId: String(anoId) }
      );
    } catch (_) {}

    await conn.commit();
    res.json({ success: true, anoId, hisId });
  } catch (err) {
    console.error('❌ ERROR POST /api/anotaciones:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// Crear nota aclaratoria
app.post('/api/aclaratorias', async (req, res) => {
  const { anoId, medId, usuId, descripcion } = req.body;
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);

    const nacId = (await conn.execute(
      'SELECT NVL(MAX(NAC_ID),0)+1 FROM TBL_NOTA_ACLARATORIA'
    )).rows[0][0];

    await conn.execute(
      `INSERT INTO TBL_NOTA_ACLARATORIA
         (NAC_ID, ANO_ID, MED_ID, NAC_DESCRIPCION, NAC_FECHA_CREACION)
       VALUES
         (:nacId, :anoId, :medId, :descripcion, CURRENT_TIMESTAMP)`,
      { nacId, anoId, medId, descripcion }
    );

    try {
      const audId = (await conn.execute(
        'SELECT NVL(MAX(AUD_ID),0)+1 FROM TBL_AUDITORIA'
      )).rows[0][0];
      await conn.execute(
        `INSERT INTO TBL_AUDITORIA
           (AUD_ID, USU_ID, AUD_ACCION, AUD_ENTIDAD, AUD_REGISTRO_ID,
            AUD_DETALLES, AUD_FECHA_HORA, AUD_ID_ADDRESS)
         VALUES
           (:audId, :usuId, 'INSERT', 'TBL_NOTA_ACLARATORIA', :nacId,
            'Nota aclaratoria creada', CURRENT_TIMESTAMP, '127.0.0.1')`,
        { audId, usuId: usuId || 1, nacId: String(nacId) }
      );
    } catch (_) {}

    await conn.commit();
    res.json({ success: true, nacId });
  } catch (err) {
    console.error('❌ ERROR POST /api/aclaratorias:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// Pacientes que tienen anotaciones del médico en sesión
app.get('/api/medico/:medId/pacientes', async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(
      `SELECT DISTINCT
         p.PAC_DOCUMENTO, p.PAC_NOMBRE, p.PAC_TELEFONO,
         p.PAC_GENERO, p.PAC_TIPO_SANGRE,
         p.PAC_FECHA_NACIMIENTO, p.PAC_EMAIL
       FROM TBL_PACIENTE p
       JOIN TBL_HISTORIA_CLINICA hc ON hc.PAC_DOCUMENTO = p.PAC_DOCUMENTO
       JOIN TBL_ANOTACION        a  ON a.HIS_ID          = hc.HIS_ID
       WHERE a.MED_ID = :medId
       ORDER BY p.PAC_NOMBRE`,
      { medId: Number(req.params.medId) }
    );
    res.json(result.rows.map(r => ({
      documento:       r[0],
      nombre:          r[1],
      telefono:        String(r[2] || ''),
      genero:          r[3],
      tipoSangre:      r[4],
      fechaNacimiento: r[5] ? r[5].toISOString().split('T')[0] : '',
      email:           r[6] || ''
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// ══════════════════════════════════════════════════════════════
app.listen(3001, () => console.log('Backend CMQ corriendo en puerto 3001'));
*/
// ============================================================
// HOSPITAL CMQ — Backend API
// Base de datos: Supabase (PostgreSQL)
// Framework: Express.js + pg (node-postgres)
// ============================================================

const express = require('express');
const { Pool } = require('pg');
const cors    = require('cors');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// ============================================================
// CONEXIÓN A SUPABASE
// Session Pooler — compatible con IPv4 (funciona en Render)
// ============================================================
const pool = new Pool({
  connectionString: 'postgresql://postgres.zwxzkbzuuriigrxhewnu:Cmq2026*cxz@aws-1-us-east-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

// ============================================================
// TEST — Verifica que la conexión a Supabase funciona
// GET /api/test
// ============================================================
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS hora');
    res.json({ mensaje: 'Conectado a Supabase!', hora: result.rows[0].hora });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// LOGIN
// POST /api/login
// Body: { email, password }
// Retorna datos del usuario + medId si el rol es MEDICO
// ============================================================
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT usu_id, usu_email, usu_nombre, usu_rol
       FROM tbl_usuario
       WHERE usu_email      = $1
         AND usu_contrasena = $2
         AND usu_activo     = 1`,
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, mensaje: 'Credenciales incorrectas' });
    }

    const u = result.rows[0];

    // Si es médico, busca su MED_ID (coincide con USU_ID por convención del proyecto)
    let medId = null;
    if (u.usu_rol === 'MEDICO') {
      const med = await pool.query(
        'SELECT med_id FROM tbl_medico WHERE med_id = $1',
        [u.usu_id]
      );
      if (med.rows.length > 0) medId = med.rows[0].med_id;
    }

    // Actualiza el último acceso
    await pool.query(
      'UPDATE tbl_usuario SET usu_ultimo_acceso = NOW() WHERE usu_id = $1',
      [u.usu_id]
    );

    res.json({
      success: true,
      usuario: {
        id:     u.usu_id,
        email:  u.usu_email,
        nombre: u.usu_nombre,
        rol:    u.usu_rol,
        medId
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PACIENTES
// ============================================================

// ── Listar todos los pacientes ───────────────────────────────
// GET /api/pacientes
// Retorna array de arrays (formato esperado por el frontend)
app.get('/api/pacientes', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tbl_paciente ORDER BY pac_nombre ASC'
    );
    const rows = result.rows.map(r => [
      r.pac_documento,
      r.pac_nombre,
      r.pac_telefono,
      r.pac_fecha_nacimiento,
      r.pac_genero,
      r.pac_tipo_sangre,
      r.pac_email,
      r.pac_direccion,
      r.pac_ciudad,
      r.pac_emergencia_nombre,
      r.pac_emergencia_telefono,
      r.pac_registro
    ]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Registrar nuevo paciente ─────────────────────────────────
// POST /api/pacientes
// Body: { id, nombre, telefono, fechaNacimiento, genero, tipoSangre,
//         email, direccion, ciudad, contactoEmergenciaNombre, contactoEmergenciaTel }
app.post('/api/pacientes', async (req, res) => {
  const {
    id, nombre, telefono, fechaNacimiento, genero, tipoSangre,
    email, direccion, ciudad, contactoEmergenciaNombre, contactoEmergenciaTel
  } = req.body;
  try {
    await pool.query(
      `INSERT INTO tbl_paciente (
         pac_documento, pac_nombre, pac_telefono, pac_fecha_nacimiento,
         pac_genero, pac_tipo_sangre, pac_email, pac_direccion,
         pac_ciudad, pac_emergencia_nombre, pac_emergencia_telefono, pac_registro
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, NOW())`,
      [
        String(id).trim(),
        nombre,
        telefono,
        fechaNacimiento,
        genero,
        tipoSangre,
        email                    || '',
        direccion,
        ciudad,
        contactoEmergenciaNombre || '',
        contactoEmergenciaTel    || ''
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('❌ ERROR POST /api/pacientes:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Editar paciente ──────────────────────────────────────────
// PUT /api/pacientes/:id
// Body: { nombre, telefono, email, direccion, ciudad,
//         contactoEmergenciaNombre, contactoEmergenciaTel }
app.put('/api/pacientes/:id', async (req, res) => {
  const {
    nombre, telefono, email, direccion, ciudad,
    contactoEmergenciaNombre, contactoEmergenciaTel
  } = req.body;
  try {
    const result = await pool.query(
      `UPDATE tbl_paciente SET
         pac_nombre              = $1,
         pac_telefono            = $2,
         pac_email               = $3,
         pac_direccion           = $4,
         pac_ciudad              = $5,
         pac_emergencia_nombre   = $6,
         pac_emergencia_telefono = $7
       WHERE pac_documento = $8`,
      [
        nombre,
        telefono,
        email                    || '',
        direccion,
        ciudad,
        contactoEmergenciaNombre || '',
        contactoEmergenciaTel    || '',
        req.params.id
      ]
    );
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    console.error('❌ ERROR PUT /api/pacientes:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// MÉDICOS
// ============================================================

// ── Listar médicos activos ───────────────────────────────────
// GET /api/medicos
// Retorna array de arrays [med_id, med_nombre, med_especialidad]
app.get('/api/medicos', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT med_id, med_nombre, med_especialidad
       FROM tbl_medico
       WHERE med_activo = 1
       ORDER BY med_nombre ASC`
    );
    const rows = result.rows.map(r => [r.med_id, r.med_nombre, r.med_especialidad]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// CITAS
// ============================================================

// ── Listar todas las citas ───────────────────────────────────
// GET /api/citas
// Retorna array de arrays con datos de cita + paciente + médico
app.get('/api/citas', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.cit_id, c.pac_documento, p.pac_nombre,
              c.med_id, m.med_nombre,
              c.cit_fecha_hora, c.cit_motivo_consulta,
              c.cit_estado, c.cit_observaciones
       FROM tbl_cita c
       JOIN tbl_paciente p ON c.pac_documento = p.pac_documento
       JOIN tbl_medico   m ON c.med_id        = m.med_id
       ORDER BY c.cit_fecha_hora DESC`
    );
    const rows = result.rows.map(r => [
      r.cit_id, r.pac_documento, r.pac_nombre,
      r.med_id, r.med_nombre,
      r.cit_fecha_hora, r.cit_motivo_consulta,
      r.cit_estado, r.cit_observaciones
    ]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Crear nueva cita ─────────────────────────────────────────
// POST /api/citas
// Body: { pacDocumento, medId, usuId, fechaHora, motivo, observaciones }
app.post('/api/citas', async (req, res) => {
  const { pacDocumento, medId, usuId, fechaHora, motivo, observaciones } = req.body;
  try {
    const idResult = await pool.query(
      'SELECT COALESCE(MAX(cit_id), 0) + 1 AS nuevo_id FROM tbl_cita'
    );
    const citId = idResult.rows[0].nuevo_id;

    await pool.query(
      `INSERT INTO tbl_cita (
         cit_id, pac_documento, med_id, usu_id,
         cit_fecha_hora, cit_motivo_consulta,
         cit_estado, cit_observaciones, cit_fecha_creacion
       ) VALUES ($1,$2,$3,$4,$5,$6,'PROGRAMADA',$7, NOW())`,
      [
        citId,
        pacDocumento,
        medId,
        usuId         || 1,
        fechaHora,
        motivo        || 'Sin motivo',
        observaciones || 'Sin observaciones'
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('❌ ERROR POST /api/citas:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Editar cita ──────────────────────────────────────────────
// PUT /api/citas/:id
// Body: { medId, fechaHora, estado, observaciones }
app.put('/api/citas/:id', async (req, res) => {
  const { medId, fechaHora, estado, observaciones } = req.body;
  try {
    await pool.query(
      `UPDATE tbl_cita SET
         med_id            = $1,
         cit_fecha_hora    = $2,
         cit_estado        = $3,
         cit_observaciones = $4
       WHERE cit_id = $5`,
      [medId, fechaHora, estado, observaciones, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// USUARIOS
// ============================================================

// ── Listar usuarios (sin exponer contraseña) ─────────────────
// GET /api/usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT usu_id, usu_email, usu_nombre, usu_rol, usu_activo
       FROM tbl_usuario
       ORDER BY usu_nombre ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// HISTORIA CLÍNICA
// ============================================================

// ── Conteo general de historias (para el dashboard) ──────────
// GET /api/historias
app.get('/api/historias', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT his_id, pac_documento, his_fecha_apertura, his_observaciones_generales
       FROM tbl_historia_clinica
       ORDER BY his_fecha_apertura DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Historia completa de un paciente con todas sus anotaciones ──
// GET /api/historias/:pacDocumento
app.get('/api/historias/:pacDocumento', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         hc.his_id,
         hc.pac_documento,
         a.ano_id,
         a.ano_tipo_consulta,
         a.ano_fecha_consulta,
         a.ano_diagnostico,
         a.ano_tratamiento,
         a.ano_observaciones,
         a.ano_proxima_cita,
         a.ano_fecha_creacion,
         m.med_nombre,
         m.med_especialidad,
         EXISTS (
           SELECT 1 FROM tbl_nota_aclaratoria na WHERE na.ano_id = a.ano_id
         ) AS tiene_aclaratoria
       FROM tbl_historia_clinica hc
       JOIN tbl_anotacion a ON a.his_id = hc.his_id
       JOIN tbl_medico    m ON m.med_id = a.med_id
       WHERE hc.pac_documento = $1
       ORDER BY a.ano_fecha_consulta DESC`,
      [req.params.pacDocumento]
    );

    res.json(result.rows.map(r => ({
      hisId:              r.his_id,
      pacDocumento:       r.pac_documento,
      anoId:              r.ano_id,
      tipoConsulta:       r.ano_tipo_consulta,
      fechaConsulta:      r.ano_fecha_consulta,
      diagnostico:        r.ano_diagnostico,
      tratamiento:        r.ano_tratamiento,
      observaciones:      r.ano_observaciones,
      proximaCita:        r.ano_proxima_cita,
      fechaCreacion:      r.ano_fecha_creacion,
      medicoNombre:       r.med_nombre,
      medicoEspecialidad: r.med_especialidad,
      tieneAclaratoria:   r.tiene_aclaratoria
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Notas aclaratorias de una anotación específica ───────────
// GET /api/anotaciones/:anoId/aclaratorias
app.get('/api/anotaciones/:anoId/aclaratorias', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT na.nac_id, na.ano_id, na.med_id, m.med_nombre,
              na.nac_descripcion, na.nac_fecha_creacion
       FROM tbl_nota_aclaratoria na
       JOIN tbl_medico m ON m.med_id = na.med_id
       WHERE na.ano_id = $1
       ORDER BY na.nac_fecha_creacion ASC`,
      [Number(req.params.anoId)]
    );

    res.json(result.rows.map(r => ({
      nacId:         r.nac_id,
      anoId:         r.ano_id,
      medId:         r.med_id,
      medicoNombre:  r.med_nombre,
      descripcion:   r.nac_descripcion,
      fechaCreacion: r.nac_fecha_creacion
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Crear anotación médica ───────────────────────────────────
// POST /api/anotaciones
// Body: { pacDocumento, medId, usuId, tipoConsulta,
//         diagnostico, tratamiento, observaciones, proximaCita }
// Crea la historia clínica automáticamente si el paciente no tiene una
app.post('/api/anotaciones', async (req, res) => {
  const {
    pacDocumento, medId, usuId,
    tipoConsulta, diagnostico, tratamiento, observaciones, proximaCita
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1 — Buscar historia clínica existente del paciente
    let hisId;
    const hisResult = await client.query(
      'SELECT his_id FROM tbl_historia_clinica WHERE pac_documento = $1',
      [pacDocumento]
    );

    if (hisResult.rows.length > 0) {
      hisId = hisResult.rows[0].his_id;
    } else {
      // No existe — la creamos como contenedor vacío
      const newHisId = (await client.query(
        'SELECT COALESCE(MAX(his_id), 0) + 1 AS nuevo_id FROM tbl_historia_clinica'
      )).rows[0].nuevo_id;
      hisId = newHisId;

      await client.query(
        `INSERT INTO tbl_historia_clinica (his_id, pac_documento, his_fecha_apertura)
         VALUES ($1, $2, NOW())`,
        [hisId, pacDocumento]
      );
    }

    // 2 — Crear la anotación médica
    const anoId = (await client.query(
      'SELECT COALESCE(MAX(ano_id), 0) + 1 AS nuevo_id FROM tbl_anotacion'
    )).rows[0].nuevo_id;

    await client.query(
      `INSERT INTO tbl_anotacion (
         ano_id, his_id, med_id, ano_tipo_consulta, ano_fecha_consulta,
         ano_diagnostico, ano_tratamiento, ano_observaciones,
         ano_proxima_cita, ano_fecha_creacion
       ) VALUES ($1,$2,$3,$4, NOW(),$5,$6,$7,$8, NOW())`,
      [
        anoId, hisId, medId, tipoConsulta,
        diagnostico, tratamiento, observaciones,
        proximaCita ? new Date(proximaCita) : null
      ]
    );

    // 3 — Auditoría (no bloquea si falla)
    try {
      const audId = (await client.query(
        'SELECT COALESCE(MAX(aud_id), 0) + 1 AS nuevo_id FROM tbl_auditoria'
      )).rows[0].nuevo_id;

      await client.query(
        `INSERT INTO tbl_auditoria (
           aud_id, usu_id, aud_accion, aud_entidad, aud_registro_id,
           aud_detalles, aud_fecha_hora, aud_id_address
         ) VALUES ($1,$2,'INSERT','tbl_anotacion',$3,'Nueva anotacion medica', NOW(),'127.0.0.1')`,
        [audId, usuId || 1, String(anoId)]
      );
    } catch (audErr) {
      console.warn('⚠️ Auditoría falló (no crítico):', audErr.message);
    }

    await client.query('COMMIT');
    res.json({ success: true, anoId, hisId });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ ERROR POST /api/anotaciones:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ── Crear nota aclaratoria ───────────────────────────────────
// POST /api/aclaratorias
// Body: { anoId, medId, usuId, descripcion }
// Solo INSERT — no hay PUT ni DELETE (inmutabilidad por diseño)
app.post('/api/aclaratorias', async (req, res) => {
  const { anoId, medId, usuId, descripcion } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const nacId = (await client.query(
      'SELECT COALESCE(MAX(nac_id), 0) + 1 AS nuevo_id FROM tbl_nota_aclaratoria'
    )).rows[0].nuevo_id;

    await client.query(
      `INSERT INTO tbl_nota_aclaratoria (nac_id, ano_id, med_id, nac_descripcion, nac_fecha_creacion)
       VALUES ($1,$2,$3,$4, NOW())`,
      [nacId, anoId, medId, descripcion]
    );

    // Auditoría (no crítica)
    try {
      const audId = (await client.query(
        'SELECT COALESCE(MAX(aud_id), 0) + 1 AS nuevo_id FROM tbl_auditoria'
      )).rows[0].nuevo_id;

      await client.query(
        `INSERT INTO tbl_auditoria (
           aud_id, usu_id, aud_accion, aud_entidad, aud_registro_id,
           aud_detalles, aud_fecha_hora, aud_id_address
         ) VALUES ($1,$2,'INSERT','tbl_nota_aclaratoria',$3,'Nota aclaratoria creada', NOW(),'127.0.0.1')`,
        [audId, usuId || 1, String(nacId)]
      );
    } catch (audErr) {
      console.warn('⚠️ Auditoría falló (no crítico):', audErr.message);
    }

    await client.query('COMMIT');
    res.json({ success: true, nacId });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ ERROR POST /api/aclaratorias:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ── Pacientes atendidos por un médico específico ─────────────
// GET /api/medico/:medId/pacientes
// Devuelve solo los pacientes que ese médico ha anotado
app.get('/api/medico/:medId/pacientes', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT
         p.pac_documento,
         p.pac_nombre,
         p.pac_telefono,
         p.pac_genero,
         p.pac_tipo_sangre,
         p.pac_fecha_nacimiento,
         p.pac_email
       FROM tbl_paciente p
       JOIN tbl_historia_clinica hc ON hc.pac_documento = p.pac_documento
       JOIN tbl_anotacion        a  ON a.his_id          = hc.his_id
       WHERE a.med_id = $1
       ORDER BY p.pac_nombre ASC`,
      [Number(req.params.medId)]
    );

    res.json(result.rows.map(r => ({
      documento:       r.pac_documento,
      nombre:          r.pac_nombre,
      telefono:        String(r.pac_telefono || ''),
      genero:          r.pac_genero,
      tipoSangre:      r.pac_tipo_sangre,
      fechaNacimiento: r.pac_fecha_nacimiento
        ? new Date(r.pac_fecha_nacimiento).toISOString().split('T')[0]
        : '',
      email: r.pac_email || ''
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
app.listen(3001, () => console.log('✅ Backend CMQ corriendo en puerto 3001'));