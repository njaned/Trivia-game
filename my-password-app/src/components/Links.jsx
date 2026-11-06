/**
 * Links Page Component
 * Dynamically maps resource links into styled list items.
 */
export function Links() {
  const resources = [
    { id: 1, label: 'React Docs', url: 'https://react.dev' },
    { id: 2, label: 'Vite Guide', url: 'https://vite.dev' }
  ];

  return (
    <section className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Resources</h1>
      <ul className="space-y-2">
        {resources.map((item) => (
          <li key={item.id} className="p-4 bg-slate-800 rounded border border-slate-700 flex justify-between">
            <span>{item.label}</span>
            <a href={item.url} target="_blank" rel="noreferrer" className="text-amber-400 font-bold">Visit</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
export default Links;