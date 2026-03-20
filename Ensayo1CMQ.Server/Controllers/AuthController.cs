// ============================================================
//  Controllers/AuthController.cs
//  Login por rol — Sprint 1
// ============================================================
using Microsoft.AspNetCore.Mvc;
using Oracle.ManagedDataAccess.Client;
using Ensayo1CMQ.Server.Models;

namespace Ensayo1CMQ.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _config;
        public AuthController(IConfiguration config) { _config = config; }

        // POST: api/Auth/login
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Usuario) || string.IsNullOrWhiteSpace(req.Contrasena))
                return BadRequest(new LoginResponse { Exitoso = false, Mensaje = "Usuario y contraseña son requeridos." });

            string conn = _config.GetConnectionString("OracleDb");
            try
            {
                using var connection = new OracleConnection(conn);
                connection.Open();
                string sql = @"SELECT ID, USUARIO, ROL, NOMBRE_COMPLETO
                               FROM USUARIOS
                               WHERE UPPER(USUARIO) = UPPER(:usr)
                                 AND CONTRASENA = :pwd
                                 AND ACTIVO = 1";
                using var cmd = new OracleCommand(sql, connection);
                cmd.Parameters.Add(":usr", req.Usuario.Trim());
                cmd.Parameters.Add(":pwd", req.Contrasena);

                using var reader = cmd.ExecuteReader();
                if (reader.Read())
                {
                    return Ok(new LoginResponse
                    {
                        Exitoso = true,
                        UserId = reader.GetInt32(0),
                        Usuario = reader.GetString(1),
                        Rol = reader.GetString(2),
                        NombreCompleto = !reader.IsDBNull(3) ? reader.GetString(3) : reader.GetString(1)
                    });
                }
                return Unauthorized(new LoginResponse { Exitoso = false, Mensaje = "Usuario o contraseña incorrectos." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new LoginResponse { Exitoso = false, Mensaje = $"Error del servidor: {ex.Message}" });
            }
        }
    }
}
