export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
      <h1 className="text-3xl font-semibold">Accès refusé</h1>
      <p className="mt-3 text-zinc-600">
        Votre rôle ne vous permet pas d’ouvrir cette page.
      </p>
    </main>
  );
}
