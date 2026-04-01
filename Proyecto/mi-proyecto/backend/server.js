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

// Test
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

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(
      `SELECT * FROM TBL_USUARIO WHERE USU_EMAIL = :email AND USU_CONTRASENA = :password AND USU_ACTIVO = 1`,
      { email, password }
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({ success: true, usuario: { id: user[0], email: user[1], nombre: user[3], rol: user[4] } });
    } else {
      res.status(401).json({ success: false, mensaje: 'Credenciales incorrectas' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// ══════ PACIENTES ══════
app.get('/api/pacientes', async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute('SELECT * FROM TBL_PACIENTE');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

app.post('/api/pacientes', async (req, res) => {
  const { id, nombre, telefono, fechaNacimiento, genero, tipoSangre, email, direccion, ciudad, contactoEmergenciaNombre, contactoEmergenciaTel } = req.body;
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    await conn.execute(
      `INSERT INTO TBL_PACIENTE (PAC_DOCUMENTO, PAC_NOMBRE, PAC_TELEFONO, PAC_FECHA_NACIMIENTO, PAC_GENERO, PAC_TIPO_SANGRE, PAC_EMAIL, PAC_DIRECCION, PAC_CIUDAD, PAC_EMERGENCIA_NOMBRE, PAC_EMERGENCIA_TELEFONO, PAC_REGISTRO)
       VALUES (:id, :nombre, :telefono, TO_DATE(:fechaNacimiento,'YYYY-MM-DD'), :genero, :tipoSangre, :email, :direccion, :ciudad, :contactoEmergenciaNombre, :contactoEmergenciaTel, SYSDATE)`,
      { id, nombre, telefono, fechaNacimiento, genero, tipoSangre, email, direccion, ciudad, contactoEmergenciaNombre, contactoEmergenciaTel },
      { autoCommit: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

app.put('/api/pacientes/:id', async (req, res) => {
  const { nombre, telefono, email, direccion, ciudad, contactoEmergenciaNombre, contactoEmergenciaTel } = req.body;
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    await conn.execute(
      `UPDATE TBL_PACIENTE SET PAC_NOMBRE=:nombre, PAC_TELEFONO=:telefono, PAC_EMAIL=:email, PAC_DIRECCION=:direccion, PAC_CIUDAD=:ciudad, PAC_EMERGENCIA_NOMBRE=:contactoEmergenciaNombre, PAC_EMERGENCIA_TELEFONO=:contactoEmergenciaTel WHERE PAC_DOCUMENTO=:id`,
      { nombre, telefono, email, direccion, ciudad, contactoEmergenciaNombre, contactoEmergenciaTel, id: req.params.id },
      { autoCommit: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// ══════ MÉDICOS ══════
app.get('/api/medicos', async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute('SELECT MED_ID, MED_NOMBRE, MED_ESPECIALIDAD FROM TBL_MEDICO WHERE MED_ACTIVO = 1');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// ══════ CITAS ══════
app.get('/api/citas', async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(
      `SELECT c.CIT_ID, c.PAC_DOCUMENTO, p.PAC_NOMBRE, m.MED_ID, m.MED_NOMBRE, 
              c.CIT_FECHA_HORA, c.CIT_MOTIVO_CONSULTA, c.CIT_ESTADO, c.CIT_NIVEL_PACIENTE
       FROM TBL_CITA c
       JOIN TBL_PACIENTE p ON c.PAC_DOCUMENTO = p.PAC_DOCUMENTO
       JOIN TBL_MEDICO m ON c.MED_ID = m.MED_ID
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
    const citId = await conn.execute('SELECT NVL(MAX(CIT_ID),0)+1 FROM TBL_CITA');
    const newId = citId.rows[0][0];
    await conn.execute(
      `INSERT INTO TBL_CITA (CIT_ID, PAC_DOCUMENTO, MED_ID, USU_ID, CIT_FECHA_HORA, CIT_MOTIVO_CONSULTA, CIT_ESTADO, CIT_FECHA_CREACION, CIT_NIVEL_PACIENTE)
       VALUES (:newId, :pacDocumento, :medId, :usuId, TO_TIMESTAMP(:fechaHora, 'YYYY-MM-DD"T"HH24:MI'), :motivo, 'PROGRAMADA', SYSDATE, :nivelPaciente)`,
      { newId, pacDocumento, medId, usuId: usuId || 1, fechaHora, motivo: motivo || 'Sin motivo', nivelPaciente: nivelPaciente || 'ESTABLE' },
      { autoCommit: true }
    );
    res.json({ success: true });
  } catch (err) {
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
      `UPDATE TBL_CITA SET MED_ID = :medId, CIT_FECHA_HORA = TO_TIMESTAMP(:fechaHora, 'YYYY-MM-DD"T"HH24:MI'), CIT_ESTADO = :estado, CIT_NIVEL_PACIENTE = :nivelPaciente
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

// ══════ USUARIOS ══════
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

app.listen(3001, () => console.log('Backend corriendo en puerto 3001'));