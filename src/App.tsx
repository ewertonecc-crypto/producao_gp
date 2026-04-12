import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "@/components/auth/RequireAuth";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Portfolios from "@/pages/Portfolios";
import Programas from "@/pages/Programas";
import ProgramaEdicao from "@/pages/ProgramaEdicao";
import Projetos from "@/pages/Projetos";
import ProjetoEdicao from "@/pages/ProjetoEdicao";
import Atividades from "@/pages/Atividades";
import Recursos from "@/pages/Recursos";
import Riscos from "@/pages/Riscos";
import Marcos from "@/pages/Marcos";
import Usuarios from "@/pages/Usuarios";
import ClientesExternos from "@/pages/ClientesExternos";
import Configuracoes from "@/pages/Configuracoes";
import AuditLog from "@/pages/AuditLog";
import Agenda from "@/pages/Agenda";
import Gantt from "@/pages/Gantt";
import Kanban from "@/pages/Kanban";
import MapaEstrategico from "@/pages/MapaEstrategico";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="portfolios" element={<Portfolios />} />
        <Route path="programas" element={<Programas />} />
        <Route path="programas/:id" element={<ProgramaEdicao />} />
        <Route path="projetos/:id" element={<ProjetoEdicao />} />
        <Route path="projetos" element={<Projetos />} />
        <Route path="atividades" element={<Atividades />} />
        <Route path="recursos" element={<Recursos />} />
        <Route path="riscos" element={<Riscos />} />
        <Route path="marcos" element={<Marcos />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="clientes" element={<ClientesExternos />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="gantt" element={<Gantt />} />
        <Route path="kanban" element={<Kanban />} />
        <Route path="mapa" element={<MapaEstrategico />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
