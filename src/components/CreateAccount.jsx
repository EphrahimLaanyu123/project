import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import "./CreateAccount.css";

function CreateAccount() {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const saveUsername = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      alert("No user found. Please log in.");
      navigate("/");
      return;
    }

    const { error } = await supabase
      .from("users")
      .insert([{ id: user.user.id, username }]);

    if (error) {
      alert(error.message);
    } else {
      alert("Username saved!");
      navigate("/rooms"); // Redirect to rooms after saving username
    }
  };

  return (
    <div className="create-account-container">
      <h2>Create Your Account</h2>
      <input
        type="text"
        placeholder="Enter a username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button onClick={saveUsername}>Save</button>
    </div>
  );
}

export default CreateAccount;
