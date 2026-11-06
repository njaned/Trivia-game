export const PasswordForm = () => {
  // 1. Typing handler for cadence tracking (triggers console output)
  const handleTyping = (e) => {
    console.log("Typing in password input:", e.target.value);
  };

  // 2. Mouse enter handler (triggers console output)
  const handleMouseEnter = () => {
    console.log("Mouse hovered over submit button");
  };

  // 3. Mouse leave handler (triggers console output)
  const handleMouseLeave = () => {
    console.log("Mouse removed from submit button");
  };

  return (
    <form 
      onSubmit={(e) => e.preventDefault()}
      className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 max-w-sm flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-slate-300">
          Password
        </label>
        <input 
          type="password" 
          id="password" 
          onChange={handleTyping}
          placeholder="Enter password..."
          className="w-full px-4 py-2 bg-slate-900 text-slate-100 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <button 
        type="submit"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg transition-colors"
      >
        Submit Password
      </button>
    </form>
  );
};


