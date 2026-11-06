import { PasswordForm } from './PasswordForm';

/**
 * Home Page Component
 * Serves as the main landing view and embeds the PasswordForm for anti-bot validation.
 */
export function Home() {
  return (
    <section className="p-6 max-w-4xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4">Security Portal</h1>
      {/* Password verification form widget */}
      <PasswordForm />
    </section>
  );
}
export default Home;