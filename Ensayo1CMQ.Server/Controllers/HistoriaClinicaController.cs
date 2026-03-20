using Microsoft.AspNetCore.Mvc;
using Oracle.ManagedDataAccess.Client;
using Ensayo1CMQ.Server.Models;

namespace Ensayo1CMQ.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HistoriaClinicaController : ControllerBase
    {
        private readonly IConfiguration _config;

        public HistoriaClinicaController(IConfiguration config)
        {
            _config = config;
        }

        [HttpGet]
        public IActionResult GetHistorias()
        {
            string conn = _config.GetConnectionString("OracleDb");
            List<HistoriaClinica> lista = new List<HistoriaClinica>();
            using (OracleConnection connection = new OracleConnection(conn))
            {
                connection.Open();
                string sql = "SELECT ID, PACIENTE_ID, FECHA_REGISTRO, DIAGNOSTICO, TRATAMIENTO FROM HISTORIA_CLINICA ORDER BY FECHA_REGISTRO DESC";
                using (OracleCommand cmd = new OracleCommand(sql, connection))
                {
                    using (OracleDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new HistoriaClinica
                            {
                                Id = reader.GetInt32(0),
                                Paciente_Id = reader.GetInt32(1),
                                Fecha_Registro = reader.GetDateTime(2),
                                Diagnostico = !reader.IsDBNull(3) ? reader.GetString(3) : "",
                                Tratamiento = !reader.IsDBNull(4) ? reader.GetString(4) : ""
                            });
                        }
                    }
                }
            }
            return Ok(lista);
        }

        [HttpPost]
        public IActionResult CrearHistoria([FromBody] HistoriaClinica hc)
        {
            string conn = _config.GetConnectionString("OracleDb");
            using (OracleConnection connection = new OracleConnection(conn))
            {
                connection.Open();
                string sql = "INSERT INTO HISTORIA_CLINICA (ID, PACIENTE_ID, FECHA_REGISTRO, DIAGNOSTICO, TRATAMIENTO) VALUES (:id, :paciente, :fecha, :diag, :trat)";
                using (OracleCommand cmd = new OracleCommand(sql, connection))
                {
                    cmd.Parameters.Add(":id", hc.Id);
                    cmd.Parameters.Add(":paciente", hc.Paciente_Id);
                    cmd.Parameters.Add(":fecha", hc.Fecha_Registro);
                    cmd.Parameters.Add(":diag", hc.Diagnostico);
                    cmd.Parameters.Add(":trat", hc.Tratamiento);
                    cmd.ExecuteNonQuery();
                }
            }
            return Ok(hc);
        }
    }
}