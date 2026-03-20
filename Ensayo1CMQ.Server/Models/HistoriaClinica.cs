// ============================================================
//  Models/HistoriaClinica.cs
// ============================================================
namespace Ensayo1CMQ.Server.Models
{
    public class HistoriaClinica
    {
        public int Id { get; set; }
        public int Paciente_Id { get; set; }
        public int? Medico_Id { get; set; }
        public DateTime Fecha_Registro { get; set; }
        public string? Diagnostico { get; set; }
        public string? Tratamiento { get; set; }
        public string? Observaciones { get; set; }
    }
}