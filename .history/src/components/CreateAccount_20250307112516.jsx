import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

function CreateAccount() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const saveUsername = async () => {
    if (!username.trim()) {
      alert("Username cannot be empty.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        alert("No user found. Please log in.");
        navigate("/");
        return;
      }

      const { error: insertError } = await supabase
        .from("users")
        .insert([{ id: data.user.id, username }]);

      if (insertError) {
        alert(insertError.message);
      } else {
        alert("Username saved!");
        navigate("/room"); // ✅ Redirect to Dashboard after successful account creation
      }
    } catch (err) {
      console.error("Error saving username:", err);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
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
            disabled={loading}
            className={`rounded px-4 py-3 font-medium transition-colors w-full mt-2 ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {loading ? "Saving..." : "Save Username"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateAccount;
