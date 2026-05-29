// ============================================================
// HOSPITAL CMQ — Backend API
// Base de datos: Supabase (PostgreSQL)
// Framework:     Express.js + pg (node-postgres)
// Despliegue:    Render
// ============================================================
const express = require('express');
const { Pool } = require('pg');
const cors    = require('cors');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// ============================================================
// CONEXIÓN A SUPABASE
// ============================================================
const pool = new Pool({
  connectionString: 'postgresql://postgres.zwxzkbzuuriigrxhewnu:Cmq2026*cxz@aws-1-us-east-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

pool.on('connect', client => {
  client.query("SET timezone = 'America/Bogota'")
});

// ============================================================
// TEST
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

    let medId = null;
    if (u.usu_rol === 'MEDICO') {
      const med = await pool.query(
        'SELECT med_id FROM tbl_medico WHERE med_id = $1',
        [u.usu_id]
      );
      if (med.rows.length > 0) medId = med.rows[0].med_id;
    }

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
app.get('/api/pacientes', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tbl_paciente ORDER BY pac_nombre ASC'
    );
    const rows = result.rows.map(r => [
      r.pac_documento, r.pac_nombre, r.pac_telefono,
      r.pac_fecha_nacimiento, r.pac_genero, r.pac_tipo_sangre,
      r.pac_email, r.pac_direccion, r.pac_ciudad,
      r.pac_emergencia_nombre, r.pac_emergencia_telefono, r.pac_registro
    ]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
        String(id).trim(), nombre, telefono, fechaNacimiento, genero, tipoSangre,
        email || '', direccion, ciudad,
        contactoEmergenciaNombre || '', contactoEmergenciaTel || ''
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('❌ ERROR POST /api/pacientes:', err.message);
    res.status(500).json({ error: err.message });
  }
});

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
        nombre, telefono, email || '', direccion, ciudad,
        contactoEmergenciaNombre || '', contactoEmergenciaTel || '',
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
// ⚠️  /api/citas/hoy/:medId debe ir ANTES de /api/citas
// ============================================================
app.get('/api/citas/hoy/:medId', async (req, res) => {
  try {
    const result = await pool.query(


      `SELECT c.cit_id, c.pac_documento, p.pac_nombre,
        c.cit_fecha_hora, c.cit_motivo_consulta, c.cit_estado, c.cit_nivel_paciente
 FROM tbl_cita c




       JOIN tbl_paciente p ON c.pac_documento = p.pac_documento
       WHERE c.med_id = $1
         AND DATE(c.cit_fecha_hora AT TIME ZONE 'America/Bogota') 
             = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Bogota')::date
       ORDER BY c.cit_fecha_hora ASC`,
      [Number(req.params.medId)]
    );
   res.json(result.rows.map(r => ({
  citId:        r.cit_id,
  pacDoc:       r.pac_documento,
  pacNombre:    r.pac_nombre,
  fechaHora:    r.cit_fecha_hora,
  motivo:       r.cit_motivo_consulta,
  estado:       r.cit_estado,
  nivelPaciente: r.cit_nivel_paciente
})));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/citas', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.cit_id, c.pac_documento, p.pac_nombre,
              c.med_id, m.med_nombre,
              c.cit_fecha_hora, c.cit_motivo_consulta,
              c.cit_estado, c.cit_nivel_paciente
       FROM tbl_cita c
       JOIN tbl_paciente p ON c.pac_documento = p.pac_documento
       JOIN tbl_medico   m ON c.med_id        = m.med_id
       ORDER BY c.cit_fecha_hora DESC`
    );
    const rows = result.rows.map(r => [
      r.cit_id, r.pac_documento, r.pac_nombre,
      r.med_id, r.med_nombre,
      r.cit_fecha_hora, r.cit_motivo_consulta,
      r.cit_estado, r.cit_nivel_paciente
    ]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/citas', async (req, res) => {
  const { pacDocumento, medId, usuId, fechaHora, motivo, nivelPaciente } = req.body;
  try {
    const idResult = await pool.query(
      'SELECT COALESCE(MAX(cit_id), 0) + 1 AS nuevo_id FROM tbl_cita'
    );
    const citId = idResult.rows[0].nuevo_id;

    await pool.query(
      `INSERT INTO tbl_cita (
         cit_id, pac_documento, med_id, usu_id,
         cit_fecha_hora, cit_motivo_consulta,
         cit_estado, cit_observaciones, cit_fecha_creacion, cit_nivel_paciente
       ) VALUES ($1,$2,$3,$4,$5,$6,'PROGRAMADA',' ', NOW(),$7)`,
      [
        citId, pacDocumento, medId, usuId || 1,
        fechaHora, motivo || 'Sin motivo', nivelPaciente || 'ESTABLE'
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('❌ ERROR POST /api/citas:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/citas/:id', async (req, res) => {
  const { medId, fechaHora, estado } = req.body;
  try {
    await pool.query(
      `UPDATE tbl_cita SET
         med_id         = $1,
         cit_fecha_hora = $2,
         cit_estado     = $3
       WHERE cit_id = $4`,
      [medId, fechaHora, estado, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// USUARIOS
// ============================================================
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tbl_usuario');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// HISTORIA CLÍNICA
// ============================================================
app.get('/api/historias', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT his_id, pac_documento FROM tbl_historia_clinica'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.get('/api/historias/:pacDocumento', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         hc.his_id, hc.pac_documento,
         a.ano_id, a.ano_tipo_consulta, a.ano_fecha_consulta,
         a.ano_diagnostico, a.ano_tratamiento, a.ano_observaciones,
         a.ano_proxima_cita, a.ano_fecha_creacion,
         m.med_nombre, m.med_especialidad,
         EXISTS (
           SELECT 1 FROM tbl_nota_aclaratoria na WHERE na.ano_id = a.ano_id
         ) AS tiene_aclaratoria,
         t.tri_nivel, t.tri_sintomas, t.tri_fecha,
         t.tri_id,
         s.siv_presion_arterial, s.siv_frecuencia_cardiaca,
         s.siv_temperatura, s.siv_saturacion_o2,
         c_match.cit_nivel_paciente
       FROM tbl_historia_clinica hc
       JOIN tbl_anotacion a ON a.his_id = hc.his_id
       JOIN tbl_medico    m ON m.med_id = a.med_id
       LEFT JOIN LATERAL (
         SELECT c.cit_id, c.cit_nivel_paciente
         FROM tbl_cita c
         WHERE c.pac_documento = hc.pac_documento
           AND ABS(EXTRACT(EPOCH FROM (c.cit_fecha_hora - a.ano_fecha_consulta))) < 300
         ORDER BY ABS(EXTRACT(EPOCH FROM (c.cit_fecha_hora - a.ano_fecha_consulta))) ASC
         LIMIT 1
       ) c_match ON true
       LEFT JOIN tbl_triage t ON t.cit_id = c_match.cit_id
       LEFT JOIN tbl_signos_vitales s ON s.cit_id = c_match.cit_id
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
      tieneAclaratoria:   r.tiene_aclaratoria,
      triage: r.tri_id ? {
        nivel:         r.tri_nivel,
        sintomas:      r.tri_sintomas,
        fechaHora:     r.tri_fecha,
        nivelPaciente: r.cit_nivel_paciente,
        signosVitales: {
          presionArterial:    r.siv_presion_arterial,
          frecuenciaCardiaca: r.siv_frecuencia_cardiaca,
          temperatura:        r.siv_temperatura,
          saturacion:         r.siv_saturacion_o2
        }
      } : null
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});






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

app.post('/api/anotaciones', async (req, res) => {
  const {
    pacDocumento, medId, usuId,
    tipoConsulta, diagnostico, tratamiento, observaciones, proximaCita
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let hisId;
    const hisResult = await client.query(
      'SELECT his_id FROM tbl_historia_clinica WHERE pac_documento = $1',
      [pacDocumento]
    );

    if (hisResult.rows.length > 0) {
      hisId = hisResult.rows[0].his_id;
    } else {
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

app.get('/api/medico/:medId/pacientes', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT
         p.pac_documento, p.pac_nombre, p.pac_telefono,
         p.pac_genero, p.pac_tipo_sangre,
         p.pac_fecha_nacimiento, p.pac_email
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
// ENFERMERÍA - TRIAGE Y SIGNOS VITALES
// ============================================================













app.get('/api/enfermero/paciente/:documento', async (req, res) => {
  try {
    const { documento } = req.params

    // Primero buscar cita programada hoy
    const citaResult = await pool.query(


      `SELECT c.cit_id, c.pac_documento, p.pac_nombre,
        c.cit_fecha_hora, c.cit_motivo_consulta, c.cit_estado, c.cit_nivel_paciente
 FROM tbl_cita c




       JOIN tbl_paciente p ON p.pac_documento = c.pac_documento
       WHERE c.pac_documento = $1
         AND DATE(c.cit_fecha_hora AT TIME ZONE 'America/Bogota')
             = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Bogota')::date
         AND c.cit_estado = 'PROGRAMADA'
       ORDER BY c.cit_fecha_hora ASC
       LIMIT 1`,
      [documento]
    )

    if (citaResult.rows.length > 0) {
      const r = citaResult.rows[0]
      return res.json({
        encontrado: true,
        citId: r.cit_id,
        documento: r.pac_documento,
        nombre: r.pac_nombre,
        fechaHora: r.cit_fecha_hora,
        motivo: r.cit_motivo_consulta,
        estado: r.cit_estado
      })
    }

    // Si no tiene cita hoy, buscar solo en pacientes
    const pacResult = await pool.query(
      `SELECT pac_documento, pac_nombre FROM tbl_paciente WHERE pac_documento = $1`,
      [documento]
    )

    if (pacResult.rows.length > 0) {
      const p = pacResult.rows[0]
      // Crear cita de urgencia automática
      const medResult = await pool.query(
        'SELECT med_id FROM tbl_medico WHERE med_activo = 1 ORDER BY med_id ASC LIMIT 1'
      )
      const medId = medResult.rows[0]?.med_id || 1

      const citId = (await pool.query(
        'SELECT COALESCE(MAX(cit_id), 0) + 1 AS nuevo_id FROM tbl_cita'
      )).rows[0].nuevo_id

      await pool.query(
        `INSERT INTO tbl_cita (
           cit_id, pac_documento, med_id, usu_id,
           cit_fecha_hora, cit_motivo_consulta,
           cit_estado, cit_observaciones, cit_fecha_creacion, cit_nivel_paciente
         ) VALUES ($1,$2,$3,1, (CURRENT_TIMESTAMP AT TIME ZONE 'America/Bogota'),'URGENCIA','PROGRAMADA','', NOW(),'CRITICO')`,
        [citId, documento, medId]
      )

      return res.json({
        encontrado: true,
        citId,
        documento: p.pac_documento,
        nombre: p.pac_nombre,
        motivo: 'URGENCIA',
        estado: 'PROGRAMADA'
      })
    }

    res.json({ encontrado: false })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})






















// Registrar triage + signos vitales
app.post('/api/triage', async (req, res) => {
  const {
    citId,
    presionArterial, frecuenciaCardiaca, temperatura, saturacion,
    sintomas, nivel, usuId
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar que la cita existe
    const citResult = await client.query(
      'SELECT cit_id FROM tbl_cita WHERE cit_id = $1',
      [citId]
    );
    if (citResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Cita no encontrada' });
    }

    // Verificar que no tenga triage ya registrado
    const triExiste = await client.query(
      'SELECT tri_id FROM tbl_triage WHERE cit_id = $1',
      [citId]
    );
    if (triExiste.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, error: 'Esta cita ya tiene triage registrado' });
    }

    // Insertar signos vitales
    const sivResult = await client.query(
      `INSERT INTO tbl_signos_vitales (
         cit_id, siv_presion_arterial, siv_frecuencia_cardiaca,
         siv_temperatura, siv_saturacion_o2
       ) VALUES ($1,$2,$3,$4,$5) RETURNING siv_id`,
      [
        citId,
        presionArterial    || null,
        frecuenciaCardiaca ? Number(frecuenciaCardiaca) : null,
        temperatura        ? Number(temperatura)        : null,
        saturacion         ? Number(saturacion)         : null
      ]
    );

    // Insertar triage
    const triResult = await client.query(
      `INSERT INTO tbl_triage (cit_id, tri_nivel, tri_sintomas)
       VALUES ($1,$2,$3) RETURNING tri_id`,
      [citId, nivel, sintomas]
    );

    // Actualizar estado cita a EN_TRIAGE
  // Mapear nivel triage a nivel paciente
const nivelMap = { 'I': 'CRITICO', 'II': 'CRITICO', 'III': 'ESTABLE', 'IV': 'LEVE', 'V': 'LEVE' }
const nivelPaciente = nivelMap[nivel] || 'ESTABLE'

await client.query(
  `UPDATE tbl_cita SET cit_estado = 'EN_TRIAGE', cit_nivel_paciente = $1 WHERE cit_id = $2`,
  [nivelPaciente, citId]
)

    // Auditoría
    try {
      const audId = (await client.query(
        'SELECT COALESCE(MAX(aud_id), 0) + 1 AS nuevo_id FROM tbl_auditoria'
      )).rows[0].nuevo_id;
      await client.query(
        `INSERT INTO tbl_auditoria (
           aud_id, usu_id, aud_accion, aud_entidad, aud_registro_id,
           aud_detalles, aud_fecha_hora, aud_id_address
         ) VALUES ($1,$2,'INSERT','tbl_triage',$3,'Triage registrado', NOW(),'127.0.0.1')`,
        [audId, usuId || 1, String(triResult.rows[0].tri_id)]
      );
    } catch (audErr) {
      console.warn('⚠️ Auditoría falló:', audErr.message);
    }

    await client.query('COMMIT');
    res.json({
      success: true,
      triId: triResult.rows[0].tri_id,
      sivId: sivResult.rows[0].siv_id
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ ERROR POST /api/triage:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});













// Triages del día registrados por el enfermero logueado
app.get('/api/triage/hoy/:usuId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.tri_id, c.cit_id, p.pac_documento, p.pac_nombre,
              t.tri_nivel, t.tri_sintomas,
              s.siv_presion_arterial, s.siv_frecuencia_cardiaca,
              s.siv_temperatura, s.siv_saturacion_o2,
              t.tri_fecha
       FROM tbl_triage t
       JOIN tbl_cita c               ON c.cit_id       = t.cit_id
       JOIN tbl_paciente p           ON p.pac_documento = c.pac_documento
       LEFT JOIN tbl_signos_vitales s ON s.cit_id       = t.cit_id
       WHERE c.usu_id = $1
         AND DATE(t.tri_fecha AT TIME ZONE 'America/Bogota')
             = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Bogota')::date
       ORDER BY t.tri_fecha DESC`,
      [Number(req.params.usuId)]
    );
    res.json(result.rows.map(r => ({
      triId:     r.tri_id,
      citId:     r.cit_id,
      documento: r.pac_documento,
      nombre:    r.pac_nombre,
      nivel:     r.tri_nivel,
      sintomas:  r.tri_sintomas,
      fechaHora: r.tri_fecha
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});













// ============================================================
// ENFERMERÍA - REGISTRO URGENCIA (paciente nuevo + cita automática)
// ============================================================
app.post('/api/enfermero/urgencia', async (req, res) => {
  const { documento, nombre, genero, tipoSangre, usuId } = req.body

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Verificar si el paciente ya existe
    const pacExiste = await client.query(
      'SELECT pac_documento FROM tbl_paciente WHERE pac_documento = $1',
      [documento]
    )

    // 2. Si no existe, crearlo con defaults
    if (pacExiste.rows.length === 0) {
      await client.query(
        `INSERT INTO tbl_paciente (
           pac_documento, pac_nombre, pac_telefono, pac_fecha_nacimiento,
           pac_genero, pac_tipo_sangre, pac_email, pac_direccion,
           pac_ciudad, pac_emergencia_nombre, pac_emergencia_telefono, pac_registro
         ) VALUES ($1,$2,0,'1900-01-01',$3,$4,'','DESCONOCIDO','DESCONOCIDO','DESCONOCIDO','0', NOW())`,
        [
          documento,
          nombre,
          genero     || 'D',
          tipoSangre || 'DESCONOCIDO'
        ]
      )
    }

    // 3. Tomar el primer médico activo disponible
    const medResult = await client.query(
      'SELECT med_id FROM tbl_medico WHERE med_activo = 1 ORDER BY med_id ASC LIMIT 1'
    )
    if (medResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, error: 'No hay médicos activos disponibles' })
    }
    const medId = medResult.rows[0].med_id

    // 4. Crear cita de urgencia
    const citId = (await client.query(
      'SELECT COALESCE(MAX(cit_id), 0) + 1 AS nuevo_id FROM tbl_cita'
    )).rows[0].nuevo_id

    await client.query(
      `INSERT INTO tbl_cita (
         cit_id, pac_documento, med_id, usu_id,
         cit_fecha_hora, cit_motivo_consulta,
         cit_estado, cit_observaciones, cit_fecha_creacion, cit_nivel_paciente
       ) VALUES ($1,$2,$3,$4, NOW(),'URGENCIA','PROGRAMADA','', NOW(),'CRITICO')`,
      [citId, documento, medId, usuId || 1]
    )

    await client.query('COMMIT')
    res.json({
      success:  true,
      citId,
      medId,
      nombre:   pacExiste.rows.length > 0 ? pacExiste.rows[0].pac_nombre : nombre,
      documento
    })

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ ERROR POST /api/enfermero/urgencia:', err.message)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})



//nuevo 



app.get('/api/triage/cita/:citId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.tri_nivel, t.tri_sintomas, t.tri_fecha,
              s.siv_presion_arterial, s.siv_frecuencia_cardiaca,
              s.siv_temperatura, s.siv_saturacion_o2
       FROM tbl_triage t
       LEFT JOIN tbl_signos_vitales s ON s.cit_id = t.cit_id
       WHERE t.cit_id = $1`,
      [Number(req.params.citId)]
    );
    if (result.rows.length === 0) return res.json(null);
    const r = result.rows[0];
    res.json({
      nivel: r.tri_nivel, sintomas: r.tri_sintomas, fechaHora: r.tri_fecha,
      signosVitales: {
        presionArterial: r.siv_presion_arterial,
        frecuenciaCardiaca: r.siv_frecuencia_cardiaca,
        temperatura: r.siv_temperatura,
        saturacion: r.siv_saturacion_o2
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


//no se si se necesita

app.get('/api/pacientes/:doc', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM tbl_paciente WHERE pac_documento = $1',
      [req.params.doc]
    );
    if (!r.rows[0]) return res.json(null);
    const p = r.rows[0];
    res.json({
      nombre: p.pac_nombre, genero: p.pac_genero, tipoSangre: p.pac_tipo_sangre,
      ciudad: p.pac_ciudad, telefono: String(p.pac_telefono),
      fechaNacimiento: p.pac_fecha_nacimiento,
      emergenciaNombre: p.pac_emergencia_nombre, emergenciaTel: p.pac_emergencia_telefono
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});



app.get('/api/triage/paciente/:doc', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.tri_nivel, t.tri_sintomas, t.tri_fecha,
              s.siv_presion_arterial, s.siv_frecuencia_cardiaca,
              s.siv_temperatura, s.siv_saturacion_o2,
              c.cit_nivel_paciente
       FROM tbl_triage t
       JOIN tbl_cita c ON c.cit_id = t.cit_id
       LEFT JOIN tbl_signos_vitales s ON s.cit_id = t.cit_id
       WHERE c.pac_documento = $1
       ORDER BY t.tri_fecha DESC
       LIMIT 1`,
      [req.params.doc]
    )
    if (!result.rows[0]) return res.json(null)
    const r = result.rows[0]
    res.json({
      nivel: r.tri_nivel, sintomas: r.tri_sintomas, fechaHora: r.tri_fecha,
      nivelPaciente: r.cit_nivel_paciente,
      signosVitales: {
        presionArterial: r.siv_presion_arterial,
        frecuenciaCardiaca: r.siv_frecuencia_cardiaca,
        temperatura: r.siv_temperatura,
        saturacion: r.siv_saturacion_o2
      }
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})
//nuevo emergencia

app.get('/api/urgencias/hoy', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         c.cit_id, c.pac_documento, p.pac_nombre, p.pac_telefono,
         c.cit_estado, c.cit_nivel_paciente, c.cit_fecha_hora,
         m.med_nombre,
         u.usu_nombre AS enfermero_nombre,
         t.tri_nivel, t.tri_sintomas, t.tri_fecha,
         s.siv_presion_arterial, s.siv_frecuencia_cardiaca,
         s.siv_temperatura, s.siv_saturacion_o2
       FROM tbl_cita c
       LEFT JOIN tbl_paciente p       ON p.pac_documento = c.pac_documento
       LEFT JOIN tbl_medico m         ON m.med_id        = c.med_id
       LEFT JOIN tbl_usuario u        ON u.usu_id        = c.usu_id
       LEFT JOIN tbl_triage t         ON t.cit_id        = c.cit_id
       LEFT JOIN tbl_signos_vitales s ON s.cit_id        = c.cit_id
       WHERE c.cit_motivo_consulta = 'URGENCIA'
         AND DATE(c.cit_fecha_hora AT TIME ZONE 'America/Bogota')
             = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Bogota')::date
       ORDER BY c.cit_fecha_hora DESC`
    )
    console.log('URGENCIAS:', result.rows.map(r => ({ doc: r.pac_documento, tel: r.pac_telefono, nombre: r.pac_nombre })))
    res.json(result.rows.map(r => ({
      citId:              r.cit_id,
      documento:          r.pac_documento,
      nombre:             r.pac_nombre || 'Sin registrar',
      estado:             r.cit_estado,
      nivelPaciente:      r.cit_nivel_paciente,
      fechaHora:          r.cit_fecha_hora,
      medico:             r.med_nombre || '—',
      enfermero:          r.enfermero_nombre || '—',
      triNivel:           r.tri_nivel,
      triSintomas:        r.tri_sintomas,
      triFecha:           r.tri_fecha,
      presionArterial:    r.siv_presion_arterial,
      frecuenciaCardiaca: r.siv_frecuencia_cardiaca,
      temperatura:        r.siv_temperatura,
      saturacion:         r.siv_saturacion_o2,
      esPNI: String(r.pac_telefono) === '0' || !r.pac_telefono
    })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// ============================================================
// ✅ Puerto dinámico — requerido por Render
// ============================================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Backend CMQ corriendo en puerto ${PORT}`));