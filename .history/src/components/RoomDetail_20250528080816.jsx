import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase";
import Tasks from "./Tasks";
import TaskDetail from "./TaskDetail";
import ChatRoom from "./ChatRoom";

function RoomDetail() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newMember, setNewMember] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [user, setUser] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  // New state to control the visibility of the members dropdown
  const [showMembersDropdown, setShowMembersDropdown] = useState(false);

  useEffect(() => {
    // Function to fetch room details
    async function fetchRoomDetails() {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();
      if (error) setErrorMessage("Failed to load room details.");
      else setRoom(data);
    }

    // Function to fetch room members and their details
    async function fetchRoomMembers() {
      // Fetch user_ids from room_members table for the current room
      const { data: roomMembersData, error: roomMembersError } = await supabase
        .from("room_members")
        .select("user_id")
        .eq("room_id", roomId);

      if (roomMembersError) {
        setErrorMessage("Failed to load room members.");
        return;
      }

      let userIds = roomMembersData.map((member) => member.user_id);

      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("created_by")
        .eq("id", roomId)
        .single();

      if (roomError) {
        setErrorMessage("Failed to load room details.");
        return;
      }

      if (!userIds.includes(roomData.created_by)) {
        userIds.push(roomData.created_by);
      }

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("username, id")
        .in("id", userIds);

      if (usersError) {
        setErrorMessage("Failed to load user details.");
        return;
      }

      const combinedData = userIds.map((userId) => {
        const user = usersData.find((u) => u.id === userId);
        return {
          user_id: user?.id,
          username: user?.username,
          isCreator: userId === roomData.created_by,
        };
      });

      // Sort members to put the creator at the top
      setMembers(combinedData.sort((a, b) => b.isCreator - a.isCreator));
    }

    // Function to fetch current authenticated user
    async function fetchUser() {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        setErrorMessage("Failed to get user information.");
        return;
      }
      setUser(authData.user);
    }

    // Function to fetch tasks for the current room
    async function fetchTasks() {
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("room_id", roomId);

      if (tasksError) {
        setErrorMessage("Failed to load tasks.");
        return;
      }

      setTasks(tasksData);
    }

    fetchRoomDetails();
    fetchRoomMembers();
    fetchUser();
    fetchTasks();

    const memberSubscription = supabase
      .channel("realtime:room_members")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_members" },
        (payload) => {
          console.log("New member added:", payload.new);
          fetchRoomMembers();
        }
      )
      .subscribe();

    const taskSubscription = supabase
      .channel("realtime:tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          console.log("Task change:", payload);
          fetchTasks(); // Re-fetch tasks to update the list
        }
      )
      .subscribe();

    // Cleanup function for subscriptions
    return () => {
      supabase.removeChannel(memberSubscription);
      supabase.removeChannel(taskSubscription);
    };
  }, [roomId]); // Re-run effect if roomId changes

  // Effect to determine if the current user is the room creator
  useEffect(() => {
    if (user && room) {
      setIsCreator(user.id === room.created_by);
    }
  }, [user, room]); // Re-run if user or room changes

  // Handler for adding a new member to the room
  async function handleAddMember(event) {
    event.preventDefault();

    if (!newMember) return; // Prevent adding empty usernames

    // Find the user by username
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("username", newMember)
      .single();

    if (userError || !userData) {
      console.error("User not found:", userError);
      setErrorMessage("User not found.");
      return;
    }

    const userId = userData.id;

    // Check if the user is already a member of the room
    const { data: existingMember, error: memberError } = await supabase
      .from("room_members")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .single();

    if (existingMember) {
      console.warn("User is already a member of this room.");
      setErrorMessage("User is already a member of this room.");
      return;
    }

    // If the error is not 'PGRST116' (no rows found), then it's a real error
    if (memberError && memberError.code !== "PGRST116") {
      console.error("Error checking existing member:", memberError);
      setErrorMessage("Error checking existing member.");
      return;
    }

    // Insert the new member into the room_members table
    const { error } = await supabase
      .from("room_members")
      .insert([{ room_id: roomId, user_id: userId }]);

    if (error) {
      console.error("Error adding member:", error);
      setErrorMessage("Failed to add member.");
    } else {
      console.log("Member added successfully.");
      setNewMember(""); // Clear the input field
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      {room ? ( // Render content only if room data is available
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Room Header Section */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">{room.name}</h2>
              {/* Button to open Chat Room modal */}
              <button
                onClick={() => setShowChatModal(true)}
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-2.5 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                Chat Room 💬
              </button>
            </div>
          </div>

          {/* Grid for Members and Tasks sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Members Section - Now with a dropdown toggle */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden relative">
              <div className="border-b border-gray-100 bg-gradient-to-r from-amber-50 to-amber-100 p-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Team Members</h3>
                {/* Button to toggle members dropdown visibility */}
                <button
                  onClick={() => setShowMembersDropdown(!showMembersDropdown)}
                  className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 text-sm flex items-center gap-2"
                >
                  {showMembersDropdown ? "Hide Members" : "Show Members"}
                  {/* Dropdown arrow icon, rotates based on state */}
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showMembersDropdown ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </button>
              </div>

              {/* Conditionally rendered content for the members dropdown */}
              {showMembersDropdown && (
                <div className="p-6 space-y-4">
                  <div className="grid gap-3">
                    {members.length > 0 ? ( // Display members if available
                      members.map((member) => (
                        <div
                          key={member.user_id}
                          className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg shadow-sm border-l-4 border-amber-400 transform transition-all duration-200 hover:scale-[1.02]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{member.username}</span>
                            {member.isCreator && ( // Mark the creator
                              <span className="bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-medium">
                                Creator
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      // Message if no members are found
                      <p className="text-gray-500 italic text-center">No members found.</p>
                    )}
                  </div>

                  {isCreator && ( // Only show "Add Member" form if current user is creator
                    <form onSubmit={handleAddMember} className="mt-6">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newMember}
                          onChange={(e) => setNewMember(e.target.value)}
                          placeholder="Enter username to add"
                          className="flex-1 border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-300 transition-all duration-200"
                        />
                        <button
                          type="submit"
                          className="bg-amber-500 text-white px-6 py-2.5 rounded-lg hover:bg-amber-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          Add Member
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Tasks Section */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Tasks</h3>
                {/* Button to open Add New Task modal */}
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 text-sm"
                >
                  Add New Task
                </button>
              </div>
              <div className="p-6">
                {tasks.length > 0 ? ( // Display tasks if available
                  <div className="grid gap-4">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)} // Open TaskDetail modal on click
                        className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg shadow-sm border-l-4 border-emerald-400 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-[1.02]"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-gray-900">{task.content}</span>
                          {/* Task priority badge */}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              task.priority === 'high' ? 'bg-red-100 text-red-700' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              task.priority === 'urgent' ? 'bg-purple-100 text-purple-700' :
                              'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Message if no tasks are created yet
                  <div className="text-center py-8">
                    <p className="text-gray-500 italic">No tasks created yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modals for Tasks and Chat */}
          {showTaskModal && <Tasks roomId={roomId} onClose={() => setShowTaskModal(false)} />}
          {selectedTask && <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />}
          {showChatModal && <ChatRoom roomId={roomId} user={user} onClose={() => setShowChatModal(false)} />}
        </div>
      ) : (
        // Loading spinner while room data is being fetched
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}

export default RoomDetail;
