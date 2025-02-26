import { useState } from "react";
import { supabase } from "../supabase";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email for a confirmation link!");
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else alert("Signed in successfully!");
  };

  return (
    <div>
      <h2>Auth</h2>
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <button onClick={signUp}>Sign Up</button>
      <button onClick={signIn}>Sign In</button>
    </div>
  );
}

export default Auth;
