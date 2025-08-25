export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-gray-600">Página não encontrada ou acesso negado.</p>
        <a href="/" className="text-blue-600 hover:underline mt-4 inline-block">Voltar para o início</a>
      </div>
    </div>
  );
}
