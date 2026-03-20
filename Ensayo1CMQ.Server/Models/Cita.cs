// ============================================================
//  Models/Cita.cs
// ============================================================
namespace Ensayo1CMQ.Server.Models
{
    public class Cita
    {
        public int Id { get; set; }
        public int Paciente_Id { get; set; }
        public int Medico_Id { get; set; }
        public DateTime Fecha { get; set; }
        public string? Motivo { get; set; }
        public string Estado { get; set; } = "PROGRAMADA";
    }
}