import { useState } from "react";
import { supabase } from "../supabase";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });
  
    if (error) {
      alert(error.message);
    } else {
  
      // Get user ID after successful signup
      const user = data.user;
      if (user) {
        const { error: insertError } = await supabase
          .from("users")
          .insert([{ id: user.id, email, username: email.split("@")[0] }]);
  
        if (insertError) console.error("Error inserting user:", insertError.message);
      }
    }
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
