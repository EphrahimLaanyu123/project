// src/components/MainContent.jsx
import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import './Dashboard.css'; // You'll create this CSS file

const MainContent = ({ user, assignedTasks, taskCounts, handleTaskClick }) => {
    return (
        <main className="main-content">
            <div className="max-width-container">
                <div className="welcome-section">
                    <h2 className="welcome-title">
                        Welcome, <span className="welcome-username">{user?.username || "User"}</span>!
                    </h2>
                    <p className="welcome-text">Here's a quick overview of your projects and tasks.</p>
                </div>

                <h2 className="tasks-section-title">Task Summary</h2>
                <div className="task-summary-grid">
                    <div className="summary-card total-tasks">
                        <p className="summary-card-label">Total Tasks</p>
                        <span className="summary-card-count">{taskCounts.total}</span>
                    </div>
                    <div className="summary-card completed-tasks">
                        <p className="summary-card-label">Completed</p>
                        <span className="summary-card-count">{taskCounts.completed}</span>
                    </div>
                    <div className="summary-card todo-tasks">
                        <p className="summary-card-label">To Do</p>
                        <span className="summary-card-count">{taskCounts.toDo}</span>
                    </div>
                    <div className="summary-card in-progress-tasks">
                        <p className="summary-card-label">In Progress</p>
                        <span className="summary-card-count">{taskCounts.inProgress}</span>
                    </div>
                    <div className="summary-card blocked-tasks">
                        <p className="summary-card-label">Blocked</p>
                        <span className="summary-card-count">{taskCounts.blocked}</span>
                    </div>
                </div>

                <h2 className="tasks-section-title">Your Assigned Tasks</h2>
                {assignedTasks.length > 0 ? (
                    <div className="tasks-grid">
                        {assignedTasks.map((task) => (
                            <div
                                key={task.id}
                                className="task-card"
                                onClick={() => handleTaskClick(task.room_id)}
                            >
                                <h3 className="task-card-title">{task.content}</h3>
                                <div className="task-card-detail">
                                    <p className="task-card-label">Status:</p>
                                    <span
                                        className={`task-status-badge ${task.toDo === "Completed"
                                            ? "status-completed"
                                            : task.toDo === "In Progress"
                                                ? "status-in-progress"
                                                : task.toDo === "Blocked"
                                                    ? "status-blocked"
                                                    : "status-default"
                                            }`}
                                    >
                                        {task.toDo}
                                    </span>
                                </div>
                                <div className="task-card-detail">
                                    <p className="task-card-label">Priority:</p>
                                    <span
                                        className={`task-priority-badge ${task.priority === "urgent"
                                            ? "priority-urgent"
                                            : task.priority === "high"
                                                ? "priority-high"
                                                : task.priority === "medium"
                                                    ? "priority-medium"
                                                    : "priority-low"
                                            }`}
                                    >
                                        {task.priority}
                                    </span>
                                </div>
                                {task.toDo === "Completed" && (
                                    <div className="task-completed-indicator">
                                        <CheckCircle2 className="task-completed-icon" />
                                        Task Completed
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-tasks-alert" role="alert">
                        <p className="no-tasks-title">No tasks assigned to you!</p>
                        <p className="no-tasks-text">It looks like you currently don't have any tasks. Keep up the great work!</p>
                    </div>
                )}
                <Outlet />
            </div>
        </main>
    );
};

export default MainContent;