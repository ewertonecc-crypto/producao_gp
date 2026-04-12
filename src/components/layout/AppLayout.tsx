import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { useAtividadesSync } from "@/hooks/useAtividadesSync";

export default function AppLayout() {
  const { nome, data: tenant, tenantId } = useTenant();
  useAtividadesSync(tenant?.id);
  const { user, signOut } = useAuth();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#050508]">
      <Topbar
        tenantNome={nome ?? undefined}
        tenantId={tenantId ?? undefined}
        userId={user?.id}
        userLabel={nome ?? user?.email ?? undefined}
        onSignOut={() => void signOut()}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#0F0F1A]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
