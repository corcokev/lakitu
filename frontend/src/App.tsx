import { useEffect, useState } from "react";
import Items from "./components/Items";
import LoginButton from "./components/LoginButton";
import LogoutButton from "./components/LogoutButton";
import { initAuth, getUserSub } from "./auth";

initAuth();

export default function App() {
  const [user, setUser] = useState<string | null>(null);
  useEffect(() => {
    getUserSub().then(setUser);
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Lakitu</h1>
      <div style={{ marginBottom: 16 }}>
        {user ? (
          <>
            <span>Logged in as: {user}</span> <LogoutButton />
          </>
        ) : (
          <LoginButton />
        )}
      </div>
      {user ? <Items /> : <p>Please log in to manage your items.</p>}
    </main>
  );
}
