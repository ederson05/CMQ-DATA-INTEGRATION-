

// ============================================================
//  Controllers/PacientesController.cs  — versión completa
//  Implementa todos los criterios de aceptación del Sprint 1
// ============================================================
using Microsoft.AspNetCore.Mvc;
using Oracle.ManagedDataAccess.Client;
using Ensayo1CMQ.Server.Models;

namespace Ensayo1CMQ.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PacientesController : ControllerBase
    {
        private readonly IConfiguration _config;
        public PacientesController(IConfiguration config) { _config = config; }

        // ------------------------------------------------------------------
        //  GET api/Pacientes  — Lista completa
        // ------------------------------------------------------------------
        [HttpGet]
        public IActionResult GetPacientes()
        {
            string conn = _config.GetConnectionString("OracleDb");
            var lista = new List<Paciente>();
            try
            {
                using var connection = new OracleConnection(conn);
                connection.Open();
                string sql = @"
                    SELECT ID, NUMERO_IDENTIFICACION, TIPO_IDENTIFICACION,
                           NOMBRE, APELLIDO, FECHA_NACIMIENTO, EDAD, GENERO, TIPO_SANGRE,
                           TELEFONO, EMAIL, DIRECCION, CIUDAD,
                           CONTACTO_EMERGENCIA, TELEFONO_EMERGENCIA,
                           FECHA_REGISTRO, ACTIVO
                    FROM PACIENTES
                    WHERE ACTIVO = 1
                    ORDER BY ID DESC";
                using var cmd = new OracleCommand(sql, connection);
                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                    lista.Add(MapPaciente(reader));

                return Ok(lista);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error leyendo pacientes: {ex.Message}");
            }
        }

        // ------------------------------------------------------------------
        //  GET api/Pacientes/buscar/{numeroId}  — Buscar por Nro. Identificación
        //  HU #3: Consultar perfil completo de un paciente
        // ------------------------------------------------------------------
        [HttpGet("buscar/{numeroIdentificacion}")]
        public IActionResult BuscarPorIdentificacion(string numeroIdentificacion)
        {
            // CA: número de identificación vacío
            if (string.IsNullOrWhiteSpace(numeroIdentificacion))
                return BadRequest(new { mensaje = "El número de identificación es un campo obligatorio para realizar la consulta." });

            // CA: caracteres no permitidos (solo dígitos, letras, guiones)
            if (!System.Text.RegularExpressions.Regex.IsMatch(numeroIdentificacion, @"^[a-zA-Z0-9\-]{3,20}$"))
                return BadRequest(new { mensaje = "El número de identificación ingresado no es válido. Use solo números, letras o guiones (3–20 caracteres)." });

            string conn = _config.GetConnectionString("OracleDb");
            try
            {
                using var connection = new OracleConnection(conn);
                connection.Open();
                string sql = @"
                    SELECT ID, NUMERO_IDENTIFICACION, TIPO_IDENTIFICACION,
                           NOMBRE, APELLIDO, FECHA_NACIMIENTO, EDAD, GENERO, TIPO_SANGRE,
                           TELEFONO, EMAIL, DIRECCION, CIUDAD,
                           CONTACTO_EMERGENCIA, TELEFONO_EMERGENCIA,
                           FECHA_REGISTRO, ACTIVO
                    FROM PACIENTES
                    WHERE NUMERO_IDENTIFICACION = :numId AND ACTIVO = 1";
                using var cmd = new OracleCommand(sql, connection);
                cmd.Parameters.Add(":numId", numeroIdentificacion.Trim());
                using var reader = cmd.ExecuteReader();

                if (reader.Read())
                    return Ok(MapPaciente(reader));

                // CA: paciente no encontrado
                return NotFound(new { mensaje = $"No se encontró ningún paciente con identificación '{numeroIdentificacion}'." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error buscando paciente: {ex.Message}");
            }
        }

        // ------------------------------------------------------------------
        //  POST api/Pacientes  — Crear nuevo paciente
        //  HU #1: Registrar paciente
        // ------------------------------------------------------------------
        [HttpPost]
        public IActionResult CrearPaciente([FromBody] Paciente paciente)
        {
            // CA: campos obligatorios faltantes
            var camposFaltantes = new List<string>();
            if (string.IsNullOrWhiteSpace(paciente.NumeroIdentificacion)) camposFaltantes.Add("Número de identificación");
            if (string.IsNullOrWhiteSpace(paciente.Nombre)) camposFaltantes.Add("Nombre");
            if (string.IsNullOrWhiteSpace(paciente.Apellido)) camposFaltantes.Add("Apellido");
            if (string.IsNullOrWhiteSpace(paciente.Telefono)) camposFaltantes.Add("Teléfono");

            if (camposFaltantes.Any())
                return BadRequest(new { mensaje = $"Faltan campos obligatorios: {string.Join(", ", camposFaltantes)}." });

            // CA: tipo de dato inválido — edad
            if (paciente.Edad.HasValue && (paciente.Edad < 0 || paciente.Edad > 130))
                return BadRequest(new { mensaje = "El tipo de dato ingresado para Edad no es correcto. Debe ser un número entre 0 y 130." });

            // CA: formato de email inválido
            if (!string.IsNullOrWhiteSpace(paciente.Email) &&
                !System.Text.RegularExpressions.Regex.IsMatch(paciente.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                return BadRequest(new { mensaje = "El formato del correo electrónico no es válido." });

            string conn = _config.GetConnectionString("OracleDb");
            try
            {
                using var connection = new OracleConnection(conn);
                connection.Open();

                // CA: verificar duplicado por número de identificación
                string checkSql = "SELECT COUNT(*) FROM PACIENTES WHERE NUMERO_IDENTIFICACION = :numId";
                using var checkCmd = new OracleCommand(checkSql, connection);
                checkCmd.Parameters.Add(":numId", paciente.NumeroIdentificacion.Trim());
                int existe = Convert.ToInt32(checkCmd.ExecuteScalar());
                if (existe > 0)
                    return Conflict(new { mensaje = $"El paciente con identificación '{paciente.NumeroIdentificacion}' ya está registrado en el sistema." });

                string sql = @"
                    INSERT INTO PACIENTES (
                        ID, NUMERO_IDENTIFICACION, TIPO_IDENTIFICACION,
                        NOMBRE, APELLIDO, FECHA_NACIMIENTO, EDAD, GENERO, TIPO_SANGRE,
                        TELEFONO, EMAIL, DIRECCION, CIUDAD,
                        CONTACTO_EMERGENCIA, TELEFONO_EMERGENCIA,
                        FECHA_REGISTRO, ACTIVO
                    ) VALUES (
                        :id, :numId, :tipoId,
                        :nom, :ape, :fnac, :edad, :gen, :sangre,
                        :tel, :email, :dir, :ciudad,
                        :ce, :tce,
                        SYSDATE, 1
                    )";
                using var cmd = new OracleCommand(sql, connection);
                cmd.Parameters.Add(":id", paciente.Id);
                cmd.Parameters.Add(":numId", paciente.NumeroIdentificacion.Trim());
                cmd.Parameters.Add(":tipoId", paciente.TipoIdentificacion ?? "CC");
                cmd.Parameters.Add(":nom", paciente.Nombre.Trim());
                cmd.Parameters.Add(":ape", paciente.Apellido.Trim());
                cmd.Parameters.Add(":fnac", (object?)paciente.FechaNacimiento ?? DBNull.Value);
                cmd.Parameters.Add(":edad", (object?)paciente.Edad ?? DBNull.Value);
                cmd.Parameters.Add(":gen", (object?)paciente.Genero ?? DBNull.Value);
                cmd.Parameters.Add(":sangre", (object?)paciente.TipoSangre ?? DBNull.Value);
                cmd.Parameters.Add(":tel", (object?)paciente.Telefono ?? DBNull.Value);
                cmd.Parameters.Add(":email", (object?)paciente.Email ?? DBNull.Value);
                cmd.Parameters.Add(":dir", (object?)paciente.Direccion ?? DBNull.Value);
                cmd.Parameters.Add(":ciudad", (object?)paciente.Ciudad ?? DBNull.Value);
                cmd.Parameters.Add(":ce", (object?)paciente.ContactoEmergencia ?? DBNull.Value);
                cmd.Parameters.Add(":tce", (object?)paciente.TelefonoEmergencia ?? DBNull.Value);
                cmd.ExecuteNonQuery();

                return Ok(new { mensaje = $"Paciente '{paciente.Nombre} {paciente.Apellido}' registrado exitosamente.", paciente });
            }
            catch (OracleException ex)
            {
                if (ex.Number == 1)
                    return Conflict(new { mensaje = "El ID o número de identificación del paciente ya existe en el sistema." });
                return StatusCode(500, new { mensaje = $"Error de base de datos: {ex.Message}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error inesperado: {ex.Message}" });
            }
        }

        // ------------------------------------------------------------------
        //  PUT api/Pacientes/{id}  — Actualizar paciente
        //  HU #2: Actualizar datos personales
        // ------------------------------------------------------------------
        [HttpPut("{id}")]
        public IActionResult ActualizarPaciente(int id, [FromBody] Paciente paciente)
        {
            // CA: campos obligatorios faltantes
            var camposFaltantes = new List<string>();
            if (string.IsNullOrWhiteSpace(paciente.Nombre)) camposFaltantes.Add("Nombre");
            if (string.IsNullOrWhiteSpace(paciente.Apellido)) camposFaltantes.Add("Apellido");
            if (string.IsNullOrWhiteSpace(paciente.Telefono)) camposFaltantes.Add("Teléfono");

            if (camposFaltantes.Any())
                return BadRequest(new { mensaje = $"Faltan campos obligatorios: {string.Join(", ", camposFaltantes)}." });

            // CA: tipo de dato inválido
            if (paciente.Edad.HasValue && (paciente.Edad < 0 || paciente.Edad > 130))
                return BadRequest(new { mensaje = "El tipo de dato ingresado para Edad no es correcto." });

            if (!string.IsNullOrWhiteSpace(paciente.Email) &&
                !System.Text.RegularExpressions.Regex.IsMatch(paciente.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                return BadRequest(new { mensaje = "El formato del correo electrónico no es válido." });

            string conn = _config.GetConnectionString("OracleDb");
            try
            {
                using var connection = new OracleConnection(conn);
                connection.Open();

                // Verificar que el paciente existe
                string checkSql = "SELECT COUNT(*) FROM PACIENTES WHERE ID = :id AND ACTIVO = 1";
                using var checkCmd = new OracleCommand(checkSql, connection);
                checkCmd.Parameters.Add(":id", id);
                int existe = Convert.ToInt32(checkCmd.ExecuteScalar());
                if (existe == 0)
                    return NotFound(new { mensaje = "La información del paciente no se pudo actualizar: el paciente no fue encontrado en el sistema." });

                string sql = @"
                    UPDATE PACIENTES SET
                        NOMBRE = :nom, APELLIDO = :ape,
                        FECHA_NACIMIENTO = :fnac, EDAD = :edad,
                        GENERO = :gen, TIPO_SANGRE = :sangre,
                        TELEFONO = :tel, EMAIL = :email,
                        DIRECCION = :dir, CIUDAD = :ciudad,
                        CONTACTO_EMERGENCIA = :ce, TELEFONO_EMERGENCIA = :tce
                    WHERE ID = :id";
                using var cmd = new OracleCommand(sql, connection);
                cmd.Parameters.Add(":nom", paciente.Nombre.Trim());
                cmd.Parameters.Add(":ape", paciente.Apellido.Trim());
                cmd.Parameters.Add(":fnac", (object?)paciente.FechaNacimiento ?? DBNull.Value);
                cmd.Parameters.Add(":edad", (object?)paciente.Edad ?? DBNull.Value);
                cmd.Parameters.Add(":gen", (object?)paciente.Genero ?? DBNull.Value);
                cmd.Parameters.Add(":sangre", (object?)paciente.TipoSangre ?? DBNull.Value);
                cmd.Parameters.Add(":tel", (object?)paciente.Telefono ?? DBNull.Value);
                cmd.Parameters.Add(":email", (object?)paciente.Email ?? DBNull.Value);
                cmd.Parameters.Add(":dir", (object?)paciente.Direccion ?? DBNull.Value);
                cmd.Parameters.Add(":ciudad", (object?)paciente.Ciudad ?? DBNull.Value);
                cmd.Parameters.Add(":ce", (object?)paciente.ContactoEmergencia ?? DBNull.Value);
                cmd.Parameters.Add(":tce", (object?)paciente.TelefonoEmergencia ?? DBNull.Value);
                cmd.Parameters.Add(":id", id);

                int filas = cmd.ExecuteNonQuery();
                if (filas == 0)
                    return NotFound(new { mensaje = "La información del paciente no se pudo actualizar. Verifique que los datos sean correctos." });

                return Ok(new { mensaje = $"Datos del paciente actualizados correctamente.", paciente });
            }
            catch (OracleException ex)
            {
                return StatusCode(500, new { mensaje = $"La información del paciente no se pudo actualizar: {ex.Message}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = $"Error inesperado: {ex.Message}" });
            }
        }

        // ------------------------------------------------------------------
        //  Mapper privado
        // ------------------------------------------------------------------
        private static Paciente MapPaciente(OracleDataReader r) => new Paciente
        {
            Id = r.GetInt32(0),
            NumeroIdentificacion = !r.IsDBNull(1) ? r.GetString(1) : "",
            TipoIdentificacion = !r.IsDBNull(2) ? r.GetString(2) : "CC",
            Nombre = !r.IsDBNull(3) ? r.GetString(3) : "",
            Apellido = !r.IsDBNull(4) ? r.GetString(4) : "",
            FechaNacimiento = !r.IsDBNull(5) ? r.GetDateTime(5) : null,
            Edad = !r.IsDBNull(6) ? r.GetInt32(6) : null,
            Genero = !r.IsDBNull(7) ? r.GetString(7) : null,
            TipoSangre = !r.IsDBNull(8) ? r.GetString(8) : null,
            Telefono = !r.IsDBNull(9) ? r.GetString(9) : null,
            Email = !r.IsDBNull(10) ? r.GetString(10) : null,
            Direccion = !r.IsDBNull(11) ? r.GetString(11) : null,
            Ciudad = !r.IsDBNull(12) ? r.GetString(12) : null,
            ContactoEmergencia = !r.IsDBNull(13) ? r.GetString(13) : null,
            TelefonoEmergencia = !r.IsDBNull(14) ? r.GetString(14) : null,
            FechaRegistro = !r.IsDBNull(15) ? r.GetDateTime(15) : null,
            Activo = !r.IsDBNull(16) ? r.GetInt32(16) : 1
        };
    }
}
