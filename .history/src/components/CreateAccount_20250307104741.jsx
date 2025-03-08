import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

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
      navigate("/dashboard"); // Redirect to rooms after saving username
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-semibold mb-6 text-black">Create Your Account</h2>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="px-3 py-3 border border-gray-300 rounded focus:outline-none focus:border-black transition-colors"
          />
          <button 
            onClick={saveUsername}
            className="bg-black text-white rounded px-4 py-3 font-medium hover:bg-gray-800 transition-colors w-full mt-2"
          >
            Save Username
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateAccount;