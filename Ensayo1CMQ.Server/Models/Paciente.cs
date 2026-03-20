// ============================================================
//  Models/Paciente.cs
// ============================================================
namespace Ensayo1CMQ.Server.Models
{
    public class Paciente
    {
        public int Id { get; set; }

        // Identificación
        public string NumeroIdentificacion { get; set; } = "";
        public string TipoIdentificacion { get; set; } = "CC";   // CC | TI | CE | Pasaporte | RC

        // Datos personales
        public string Nombre { get; set; } = "";
        public string Apellido { get; set; } = "";
        public DateTime? FechaNacimiento { get; set; }
        public int? Edad { get; set; }
        public string? Genero { get; set; }
        public string? TipoSangre { get; set; }

        // Contacto
        public string? Telefono { get; set; }
        public string? Email { get; set; }
        public string? Direccion { get; set; }
        public string? Ciudad { get; set; }

        // Emergencia
        public string? ContactoEmergencia { get; set; }
        public string? TelefonoEmergencia { get; set; }

        // Sistema
        public DateTime? FechaRegistro { get; set; }
        public int Activo { get; set; } = 1;

        // Propiedad calculada: nombre completo
        public string NombreCompleto => $"{Nombre} {Apellido}".Trim();
    }
}