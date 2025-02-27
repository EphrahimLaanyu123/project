import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase";
import Tasks from "./Tasks";
import TaskDetail from "./TaskDetail"; // Import the modal

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

    async function fetchTasks() {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("room_id", roomId);
      if (error) {
        setErrorMessage("Failed to load tasks.");
      } else {
        setTasks(data);
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

    fetchRoomDetails();
    fetchTasks();
    fetchUser();

    const taskSubscription = supabase
      .channel("realtime:tasks")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tasks" }, (payload) => {
        setTasks((prevTasks) => [...prevTasks, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(taskSubscription);
    };
  }, [roomId]);

  useEffect(() => {
    if (user && room) {
      setIsCreator(user.id === room.created_by);
    }
  }, [user, room]);

  return (
    <div className="room-container">
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {room ? (
        <>
          <h2 className="room-title">{room.name}</h2>
          <h3 className="room-subtitle">Members</h3>
          <ul className="member-list">
            {members.map((member) => (
              <li key={member.user_id} className="member-item">
                {user && member.user_id === user.id
                  ? `You${member.isCreator ? " (Creator)" : ""}`
                  : `${member.username}${member.isCreator ? " (Creator)" : ""}`}
              </li>
            ))}
          </ul>

          {isCreator && (
            <form className="add-member-form">
              <input
                type="text"
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                placeholder="Enter username"
                required
              />
              <button type="submit">Add Member</button>
            </form>
          )}

          <button onClick={() => setShowTaskModal(true)} className="add-task-button">
            Add Task
          </button>

          {showTaskModal && <Tasks roomId={roomId} onClose={() => setShowTaskModal(false)} />}

          <h3 className="task-title">Tasks</h3>
          <ul className="task-list">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="task-item"
                onClick={() => setSelectedTask(task)}
              >
                {task.content} - <strong>{task.priority}</strong>
              </li>
            ))}
          </ul>

          {selectedTask && (
            <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />
          )}
        </>
      ) : (
        <p>Loading room details...</p>
      )}
    </div>
  );
}

export default RoomDetail;
