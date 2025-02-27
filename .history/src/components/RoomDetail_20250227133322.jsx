import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { UserCircle, Plus, MessageCircle, CheckSquare, ArrowLeft, Clock, AlertTriangle } from "lucide-react";

function RoomDetail() {
  const { roomId } = useParams();
  const navigate = useNavigate();
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRoomDetails() {
      setIsLoading(true);
      setErrorMessage("");

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

    async function fetchTasks() {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("room_id", roomId);

      if (error) {
        setErrorMessage("Failed to load tasks.");
      } else {
        setTasks(data || []);
      }
    }

    async function fetchUser() {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        setErrorMessage("Failed to get user information.");
        return;
      }
      setUser(authData.user);
    }

    Promise.all([
      fetchRoomDetails(),
      fetchRoomMembers(),
      fetchTasks(),
      fetchUser()
    ]).finally(() => {
      setIsLoading(false);
    });
  }, [roomId]);

  useEffect(() => {
    if (user && room) {
      setIsCreator(user.id === room.created_by);
    }
  }, [user, room]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!newMember.trim()) {
      setErrorMessage("Username cannot be empty");
      return;
    }

    // Find user by username
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("username", newMember)
      .single();

    if (userError) {
      setErrorMessage("User not found");
      return;
    }

    // Check if user is already a member
    const { data: existingMember, error: memberError } = await supabase
      .from("room_members")
      .select("*")
      .eq("room_id", roomId)
      .eq("user_id", userData.id)
      .single();

    if (existingMember) {
      setErrorMessage("User is already a member of this room");
      return;
    }

    // Add user to room
    const { error: insertError } = await supabase
      .from("room_members")
      .insert([{ room_id: roomId, user_id: userData.id }]);

    if (insertError) {
      setErrorMessage("Failed to add member");
      return;
    }

    // Refresh member list
    fetchRoomMembers();
    setNewMember("");
  };

  const fetchRoomMembers = async () => {
    const { data: roomMembersData, error: roomMembersError } = await supabase
      .from("room_members")
      .select("user_id")
      .eq("room_id", roomId);

    if (roomMembersError) {
      setErrorMessage("Failed to load room members.");
      return;
    }

    let userIds = roomMembersData.map((member) => member.user_id);

    const { data: roomData } = await supabase
      .from("rooms")
      .select("created_by")
      .eq("id", roomId)
      .single();

    if (!userIds.includes(roomData.created_by)) {
      userIds.push(roomData.created_by);
    }

    const { data: usersData } = await supabase
      .from("users")
      .select("username, id")
      .in("id", userIds);

    const combinedData = userIds.map((userId) => {
      const user = usersData.find((u) => u.id === userId);
      return {
        user_id: user?.id,
        username: user?.username,
        isCreator: userId === roomData.created_by,
      };
    });

    setMembers(combinedData.sort((a, b) => b.isCreator - a.isCreator));
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/rooms')}
                className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {room ? room.name : 'Loading...'}
              </h1>
            </div>
            {user && (
              <div className="flex items-center space-x-2">
                <div className="bg-gray-200 rounded-full p-2">
                  <UserCircle className="h-6 w-6 text-gray-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Members Section */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Members</h2>
              <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {members.length}
              </span>
            </div>
            
            <ul className="divide-y divide-gray-200">
              {members.map((member) => (
                <li key={member.user_id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-gray-200 rounded-full p-2 mr-3">
                      <UserCircle className="h-5 w-5 text-gray-700" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {user && member.user_id === user.id
                        ? "You"
                        : member.username || "Unknown User"}
                    </span>
                  </div>
                  {member.isCreator && (
                    <span className="bg-black text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Creator
                    </span>
                  )}
                </li>
              ))}
            </ul>

            {/* Add Member Form - Only visible to the creator */}
            {isCreator && (
              <form onSubmit={handleAddMember} className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Add New Member</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMember}
                    onChange={(e) => setNewMember(e.target.value)}
                    placeholder="Enter username"
                    className="flex-1 shadow-sm focus:ring-black focus:border-black block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                  <button 
                    type="submit"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-black shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Tasks Section */}
          <div className="lg:col-span-2 bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Tasks</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-black shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </button>
                <button
                  onClick={() => setShowChatModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Chat
                </button>
              </div>
            </div>

            {tasks.length > 0 ? (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Task</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Priority</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {tasks.map((task) => (
                      <tr 
                        key={task.id} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedTask(task)}
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {task.content}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority || 'None'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className="inline-flex items-center">
                            {task.status === 'completed' ? (
                              <>
                                <CheckSquare className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-green-700">Completed</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                                <span className="text-yellow-700">In Progress</span>
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new task.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    New Task
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showTaskModal && <Tasks roomId={roomId} onClose={() => setShowTaskModal(false)} />}
      {showChatModal && <ChatRoom roomId={roomId} user={user} onClose={() => setShowChatModal(false)} />}
      {selectedTask && <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}

export default RoomDetail;