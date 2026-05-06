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