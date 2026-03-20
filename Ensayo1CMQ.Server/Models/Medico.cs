// ============================================================
//  Models/Medico.cs
//  =============================================
namespace Ensayo1CMQ.Server.Models
{
    public class Medico
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = "";
        public string? Especialidad { get; set; }
        public string? Telefono { get; set; }
        public string? Email { get; set; }
    }
}