import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { supabase } from "../supabase";
import "./Auth.css";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // Initialize navigate

  // Check if the user is logged in
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        navigate("/rooms"); // Redirect if already logged in
      }
    };
    fetchUser();

    // Listen for authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        navigate("/rooms"); // Redirect if authenticated
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // Sign Up Function
  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(error.message);
    } else {
      alert("Check your email for a confirmation link!");
      navigate("/rooms"); // Redirect after sign-up success
    }
  };

  // Sign In Function
  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    } else {
      alert("Signed in successfully!");
      navigate("/rooms"); // Redirect after sign-in success
    }
  };

  // Sign Out Function
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/"); // Redirect to home after logout
  };

  return (
    <div className="auth-container">
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
