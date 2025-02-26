import { useState, useEffect } from "react";
import { supabase } from "../supabase";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);

  // Check if the user is logged in
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();

    // Listen for authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign Up Function
  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email for a confirmation link!");
  };

  // Sign In Function
  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else alert("Signed in successfully!");
  };

  // Sign Out Function
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div>
      <h2>Authentication</h2>
      {user ? (
        <div>
          <p>Welcome, {user.email}</p>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <div>
          <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
          <button onClick={signUp}>Sign Up</button>
          <button onClick={signIn}>Sign In</button>
        </div>
      )}
    </div>
  );
}

export default Auth;
