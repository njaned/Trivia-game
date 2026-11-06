import { PasswordForm } from "./components/PasswordForm";

function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6">Password Form</h1>
      <PasswordForm />
    </div>
  );
}

export default App;