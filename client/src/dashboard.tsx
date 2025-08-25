import { useNavigate } from "react-router-dom";

export default function Dashboard({ user }: { user: any }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    navigate("/");
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Bem-vindo, {user?.nome || user?.email}!</h1>
          <p className="text-gray-600">Tipo de usuário: {user?.userType || "Desconhecido"}</p>
          <p className="text-gray-600">Admin: {user?.permissions?.isAdmin ? "Sim" : "Não"}</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
