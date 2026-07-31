import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { getAppointments, createAppointment } from "../services/appointmentService";
import type { AppointmentDTO } from "../services/appointmentService";
import { X } from "lucide-react";

export default function AgendaPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAppt, setNewAppt] = useState({ patientName: "", phone: "", date: "", status: "SCHEDULED" });

  const loadAppointments = () => {
    setLoading(true);
    getAppointments()
      .then(setAppointments)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAppointment(newAppt);
      setIsModalOpen(false);
      setNewAppt({ patientName: "", phone: "", date: "", status: "SCHEDULED" });
      loadAppointments();
    } catch (err) {
      console.error(err);
      alert("Erro ao criar agendamento");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const events = appointments.map((appt) => ({
    id: appt.id,
    title: `${appt.patientName} (${appt.status})`,
    start: appt.date,
    allDay: false,
    backgroundColor: appt.status === "COMPLETED" ? "#10b981" : appt.status === "CANCELED" ? "#ef4444" : "#3b82f6",
    borderColor: "transparent"
  }));

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card shrink-0">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <CalendarIcon className="size-6 text-primary" /> Agenda de Consultas
            </h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            Novo Agendamento
          </button>
        </div>
      </div>

      {/* Calendar Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-card rounded-xl shadow-sm border border-border p-4 h-full min-h-[600px] fc-theme-standard">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay"
            }}
            events={events}
            height="100%"
            slotMinTime="07:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={false}
            locale="pt-br"
            buttonText={{
              today: "Hoje",
              month: "Mês",
              week: "Semana",
              day: "Dia"
            }}
          />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-border/50 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center bg-muted/30">
              <h2 className="text-lg font-semibold">Novo Agendamento</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nome do Paciente</label>
                <input 
                  type="text" required
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={newAppt.patientName} onChange={e => setNewAppt({...newAppt, patientName: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Telefone</label>
                <input 
                  type="text" required
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={newAppt.phone} onChange={e => setNewAppt({...newAppt, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Data e Hora</label>
                <input 
                  type="datetime-local" required
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={newAppt.date} onChange={e => setNewAppt({...newAppt, date: e.target.value})}
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted text-muted-foreground">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 shadow-sm">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
