# Password Input Security Lab

A React application built with Vite and Tailwind CSS designed to capture mouse and keyboard events for anti-bot security telemetry.

## 📁 Component Organization & Connections

- **`App.jsx`**: Main application container rendering global layout wrapper and active routes. Connected to `Header`, `Home`, `About`, `Links`, and `Footer`.
- **`Home.jsx`**: Main landing view. Connected to `PasswordForm`.
- **`About.jsx`**: Explains anti-bot project telemetry architecture.
- **`Links.jsx`**: Renders dynamic directory resource items.
- **`PasswordForm.jsx`**: Captures password input typing (`onChange`), mouse hover entrance (`onMouseEnter`), and mouse hover exit (`onMouseLeave`).

## 🚀 How to Run the Project

1. Install dependencies:
   ```bash
   npm install
   ```
