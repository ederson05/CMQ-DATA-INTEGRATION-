const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: '*'
}));
app.use(express.json());

const pool = new Pool({
  connectionString: 'postgresql://postgres.zwxzkbzuuriigrxhewnu:Cmq2026*cxz@aws-1-us-east-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

// Test
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ mensaje: 'Conectado a Supabase!', hora: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT * FROM TBL_USUARIO WHERE USU_EMAIL = $1 AND USU_CONTRASENA = $2 AND USU_ACTIVO = 1`,
      [email, password]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({ success: true, usuario: { id: user.usu_id, email: user.usu_email, nombre: user.usu_nombre, rol: user.usu_rol } });
    } else {
      res.status(401).json({ success: false, mensaje: 'Credenciales incorrectas' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════ PACIENTES ══════
app.get('/api/pacientes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM TBL_PACIENTE');
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
  const { id, nombre, telefono, fechaNacimiento, genero, tipoSangre, email, direccion, ciudad, contactoEmergenciaNombre, contactoEmergenciaTel } = req.body;
  try {
    await pool.query(
      `INSERT INTO TBL_PACIENTE (PAC_DOCUMENTO, PAC_NOMBRE, PAC_TELEFONO, PAC_FECHA_NACIMIENTO, PAC_GENERO, PAC_TIPO_SANGRE, PAC_EMAIL, PAC_DIRECCION, PAC_CIUDAD, PAC_EMERGENCIA_NOMBRE, PAC_EMERGENCIA_TELEFONO, PAC_REGISTRO)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())`,
      [id, nombre, telefono, fechaNacimiento, genero, tipoSangre, email, direccion, ciudad, contactoEmergenciaNombre, contactoEmergenciaTel]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/pacientes/:id', async (req, res) => {
  const { nombre, telefono, email, direccion, ciudad, contactoEmergenciaNombre, contactoEmergenciaTel } = req.body;
  try {
    await pool.query(
      `UPDATE TBL_PACIENTE SET PAC_NOMBRE=$1, PAC_TELEFONO=$2, PAC_EMAIL=$3, PAC_DIRECCION=$4, PAC_CIUDAD=$5, PAC_EMERGENCIA_NOMBRE=$6, PAC_EMERGENCIA_TELEFONO=$7 WHERE PAC_DOCUMENTO=$8`,
      [nombre, telefono, email, direccion, ciudad, contactoEmergenciaNombre, contactoEmergenciaTel, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════ MÉDICOS ══════
app.get('/api/medicos', async (req, res) => {
  try {
    const result = await pool.query('SELECT MED_ID, MED_NOMBRE, MED_ESPECIALIDAD FROM TBL_MEDICO WHERE MED_ACTIVO = 1');
    const rows = result.rows.map(r => [r.med_id, r.med_nombre, r.med_especialidad]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════ CITAS ══════
app.get('/api/citas', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.CIT_ID, c.PAC_DOCUMENTO, p.PAC_NOMBRE, m.MED_ID, m.MED_NOMBRE,
              c.CIT_FECHA_HORA, c.CIT_MOTIVO_CONSULTA, c.CIT_ESTADO, c.CIT_NIVEL_PACIENTE
       FROM TBL_CITA c
       JOIN TBL_PACIENTE p ON c.PAC_DOCUMENTO = p.PAC_DOCUMENTO
       JOIN TBL_MEDICO m ON c.MED_ID = m.MED_ID
       ORDER BY c.CIT_FECHA_HORA DESC`
    );
    const rows = result.rows.map(r => [
      r.cit_id, r.pac_documento, r.pac_nombre, r.med_id, r.med_nombre,
      r.cit_fecha_hora, r.cit_motivo_consulta, r.cit_estado, r.cit_nivel_paciente
    ]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/citas', async (req, res) => {
  const { pacDocumento, medId, usuId, fechaHora, motivo, nivelPaciente } = req.body;
  try {
    await pool.query(
      `INSERT INTO TBL_CITA (PAC_DOCUMENTO, MED_ID, USU_ID, CIT_FECHA_HORA, CIT_MOTIVO_CONSULTA, CIT_ESTADO, CIT_FECHA_CREACION, CIT_NIVEL_PACIENTE)
       VALUES ($1,$2,$3,$4,$5,'PROGRAMADA',NOW(),$6)`,
      [pacDocumento, medId, usuId || 1, fechaHora, motivo || 'Sin motivo', nivelPaciente || 'ESTABLE']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/citas/:id', async (req, res) => {
  const { medId, fechaHora, estado, nivelPaciente } = req.body;
  try {
    await pool.query(
      `UPDATE TBL_CITA SET MED_ID=$1, CIT_FECHA_HORA=$2, CIT_ESTADO=$3, CIT_NIVEL_PACIENTE=$4 WHERE CIT_ID=$5`,
      [medId, fechaHora, estado, nivelPaciente, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════ USUARIOS ══════
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM TBL_USUARIO');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log('Backend corriendo en puerto 3001'));