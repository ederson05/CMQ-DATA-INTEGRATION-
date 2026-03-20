// ============================================================
//  Models/Usuario.cs
// ============================================================
namespace Ensayo1CMQ.Server.Models
{
    public class Usuario
    {
        public int Id { get; set; }
        public string UsuarioNombre { get; set; } = "";
        public string Contrasena { get; set; } = "";
        public string Rol { get; set; } = "";
        public string? NombreCompleto { get; set; }
        public int Activo { get; set; } = 1;
    }

    public class LoginRequest
    {
        public string Usuario { get; set; } = "";
        public string Contrasena { get; set; } = "";
    }

    public class LoginResponse
    {
        public bool Exitoso { get; set; }
        public string? Mensaje { get; set; }
        public string? Rol { get; set; }
        public string? NombreCompleto { get; set; }
        public string? Usuario { get; set; }
        public int? UserId { get; set; }
    }
}