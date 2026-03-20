using Microsoft.AspNetCore.Mvc;
using Oracle.ManagedDataAccess.Client;
using Ensayo1CMQ.Server.Models;

namespace Ensayo1CMQ.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MedicosController : ControllerBase
    {
        private readonly IConfiguration _config;

        public MedicosController(IConfiguration config)
        {
            _config = config;
        }

        [HttpGet]
        public IActionResult GetMedicos()
        {
            string conn = _config.GetConnectionString("OracleDb");
            List<Medico> lista = new List<Medico>();

            using (OracleConnection connection = new OracleConnection(conn))
            {
                connection.Open();
                string sql = "SELECT ID, NOMBRE, ESPECIALIDAD FROM MEDICO";
                using (OracleCommand cmd = new OracleCommand(sql, connection))
                {
                    using (OracleDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new Medico
                            {
                                Id = reader.GetInt32(0),
                                Nombre = reader.GetString(1),
                                Especialidad = reader.GetString(2)
                            });
                        }
                    }
                }
            }
            return Ok(lista);
        }

        [HttpPost]
        public IActionResult CrearMedico([FromBody] Medico medico)
        {
            string conn = _config.GetConnectionString("OracleDb");
            using (OracleConnection connection = new OracleConnection(conn))
            {
                connection.Open();
                string sql = "INSERT INTO MEDICO (ID, NOMBRE, ESPECIALIDAD) VALUES (:id, :nom, :esp)";
                using (OracleCommand cmd = new OracleCommand(sql, connection))
                {
                    cmd.Parameters.Add(":id", medico.Id);
                    cmd.Parameters.Add(":nom", medico.Nombre);
                    cmd.Parameters.Add(":esp", medico.Especialidad);
                    cmd.ExecuteNonQuery();
                }
            }
            return Ok(medico);
        }
    }
}