import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Check if the user is logged in
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        navigate("/dashboard");
      }
    };
    fetchUser();

    // Listen for authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // Sign Up Function
  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(error.message);
    } else {
      alert("Check your email for a confirmation link!");
      navigate("/create-account");
    }
  };

  // Sign In Function
  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    } else {
      alert("Signed in successfully!");
      navigate("/rooms");
    }
  };

  // Sign Out Function
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-semibold mb-6 text-black">Authentication</h2>
        {user ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg">Welcome,</p>
            <p className="font-semibold mb-4">{user.email}</p>
            <button 
              className="bg-black text-white rounded px-4 py-3 font-medium hover:bg-gray-800 transition-colors w-full"
              onClick={signOut}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <input 
              type="email" 
              className="px-3 py-3 border border-gray-300 rounded focus:outline-none focus:border-black transition-colors"
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
            />
            <input 
              type="password" 
              className="px-3 py-3 border border-gray-300 rounded focus:outline-none focus:border-black transition-colors"
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
            />
            <div className="flex gap-4 mt-2">
              <button 
                className="bg-black text-white rounded px-4 py-3 font-medium hover:bg-gray-800 transition-colors flex-1"
                onClick={signIn}
              >
                Sign In
              </button>
              <button 
                className="bg-white text-black border border-black rounded px-4 py-3 font-medium hover:bg-gray-100 transition-colors flex-1"
                onClick={signUp}
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Auth;