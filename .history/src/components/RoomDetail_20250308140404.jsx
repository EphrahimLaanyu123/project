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

  useEffect(() => {
    async function fetchRoomDetails() {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();
      if (error) setErrorMessage("Failed to load room details.");
      else setRoom(data);
    }

    async function fetchRoomMembers() {
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

      setMembers(combinedData.sort((a, b) => b.isCreator - a.isCreator));
    }

    async function fetchUser() {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        setErrorMessage("Failed to get user information.");
        return;
      }
      setUser(authData.user);
    }

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
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(memberSubscription);
      supabase.removeChannel(taskSubscription);
    };
  }, [roomId]);

  useEffect(() => {
    if (user && room) {
      setIsCreator(user.id === room.created_by);
    }
  }, [user, room]);

  async function handleAddMember(event) {
    event.preventDefault();

    if (!newMember) return;

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

    if (memberError && memberError.code !== "PGRST116") {
      console.error("Error checking existing member:", memberError);
      setErrorMessage("Error checking existing member.");
      return;
    }

    const { error } = await supabase
      .from("room_members")
      .insert([{ room_id: roomId, user_id: userId }]);

    if (error) {
      console.error("Error adding member:", error);
      setErrorMessage("Failed to add member.");
    } else {
      console.log("Member added successfully.");
      setNewMember("");
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      {room ? (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {room.name}
              </h2>
              <button
                onClick={() => setShowChatModal(true)}
                className="bg-gradient-to-r from-gray-900 to-gray-700 text-white px-6 py-2.5 rounded-lg hover:from-gray-800 hover:to-gray-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                Chat Room 💬
              </button>
            </div>

            {/* Members Section */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Team Members</h3>
              <div className="grid gap-3">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100"
                  >
                    <span className="font-medium text-gray-700">{member.username}</span>
                    {member.isCreator && (
                      <span className="bg-gray-900 text-white text-xs px-3 py-1 rounded-full">
                        Creator
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {isCreator && (
                <form onSubmit={handleAddMember} className="mt-6">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMember}
                      onChange={(e) => setNewMember(e.target.value)}
                      placeholder="Enter username to add"
                      className="flex-1 border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all duration-200"
                    />
                    <button
                      type="submit"
                      className="bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      Add Member
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Tasks Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Tasks</h3>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Add New Task
                </button>
              </div>

              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                          {task.content}
                        </span>
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
                <div className="text-center py-8">
                  <p className="text-gray-500 italic">No tasks created yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Modals */}
          {showTaskModal && <Tasks roomId={roomId} onClose={() => setShowTaskModal(false)} />}
          {selectedTask && <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />}
          {showChatModal && <ChatRoom roomId={roomId} user={user} onClose={() => setShowChatModal(false)} />}
        </div>
      ) : (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}

export default RoomDetail;