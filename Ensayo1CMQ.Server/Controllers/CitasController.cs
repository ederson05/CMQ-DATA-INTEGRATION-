using Microsoft.AspNetCore.Mvc;
using Oracle.ManagedDataAccess.Client;
using Ensayo1CMQ.Server.Models;

namespace Ensayo1CMQ.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CitasController : ControllerBase
    {
        private readonly IConfiguration _config;
        public CitasController(IConfiguration config)
        {
            _config = config;
        }

        // GET: api/Citas
        [HttpGet]
        public IActionResult GetCitas()
        {
            string conn = _config.GetConnectionString("OracleDb");
            List<Cita> lista = new List<Cita>();
            try
            {
                using (OracleConnection connection = new OracleConnection(conn))
                {
                    connection.Open();

                    // CORRECCIÓN: se incluye MEDICO_ID (faltaba en la versión original)
                    // Orden columnas: 0=ID, 1=PACIENTE_ID, 2=MEDICO_ID, 3=FECHA, 4=MOTIVO
                    string sql = @"SELECT ID, PACIENTE_ID, MEDICO_ID, FECHA, MOTIVO
                                   FROM CITA
                                   ORDER BY FECHA DESC";

                    using (OracleCommand cmd = new OracleCommand(sql, connection))
                    using (OracleDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new Cita
                            {
                                Id = reader.GetInt32(0),
                                Paciente_Id = reader.GetInt32(1),
                                Medico_Id = reader.GetInt32(2),
                                Fecha = reader.GetDateTime(3),
                                Motivo = !reader.IsDBNull(4) ? reader.GetString(4) : ""
                            });
                        }
                    }
                }
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al obtener citas: {ex.Message}");
            }
        }

        // POST: api/Citas
        [HttpPost]
        public IActionResult CrearCita([FromBody] Cita cita)
        {
            string conn = _config.GetConnectionString("OracleDb");
            try
            {
                using (OracleConnection connection = new OracleConnection(conn))
                {
                    connection.Open();

                    // CORRECCIÓN: se incluye MEDICO_ID en el INSERT
                    string sql = @"INSERT INTO CITA (ID, PACIENTE_ID, MEDICO_ID, FECHA, MOTIVO)
                                   VALUES (:id, :paciente, :medico, :fecha, :motivo)";

                    using (OracleCommand cmd = new OracleCommand(sql, connection))
                    {
                        cmd.Parameters.Add(":id", cita.Id);
                        cmd.Parameters.Add(":paciente", cita.Paciente_Id);
                        cmd.Parameters.Add(":medico", cita.Medico_Id);
                        cmd.Parameters.Add(":fecha", cita.Fecha);
                        cmd.Parameters.Add(":motivo", cita.Motivo);
                        cmd.ExecuteNonQuery();
                    }
                }
                return Ok(cita);
            }
            catch (OracleException ex)
            {
                if (ex.Number == 1) return BadRequest("El ID de la cita ya existe.");
                if (ex.Number == 2291) return BadRequest("El paciente o médico indicado no existe.");
                return StatusCode(500, $"Error de Oracle: {ex.Message}");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error inesperado: {ex.Message}");
            }
        }
    }
}