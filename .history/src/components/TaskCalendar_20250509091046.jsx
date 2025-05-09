import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
// import { cn } from "@/lib/utils"  // Removed problematic import
// import { Calendar } from "@/components/ui/calendar" // Removed problematic import
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover" // Removed problematic import
import { format } from 'date-fns';

const TaskCalendar = () => {
    const [assignedTasks, setAssignedTasks] = useState([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTasks = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { data: authData, error: authError } = await supabase.auth.getUser();
                if (authError || !authData?.user) {
                    setError("Failed to authenticate user.");
                    setIsLoading(false);
                    return;
                }
                const userId = authData.user.id;

                // Fetch tasks assigned to the user with deadline
                const { data: taskData, error: taskError } = await supabase
                    .from("task_members")
                    .select("task_id, tasks(id, content, deadline)") // Join with the tasks table and get deadline
                    .eq("user_id", userId)
                    .not("tasks.deadline", "is", null); // Only fetch tasks with deadlines

                if (taskError) {
                    console.error("Error fetching assigned tasks:", taskError);
                    setError("Failed to fetch your assigned tasks.");
                } else if (taskData) {
                    // Extract and format the task data
                    const tasks = taskData.map(item => ({
                        ...item.tasks,
                        deadline: item.tasks.deadline ? new Date(item.tasks.deadline) : null,
                    }));
                    setAssignedTasks(tasks);
                }
            } catch (err) {
                setError("An unexpected error occurred.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchTasks();
    }, []);

    const getTasksForDate = (date) => {
      return assignedTasks.filter(task => {
        return task.deadline &&
               date.getFullYear() === task.deadline.getFullYear() &&
               date.getMonth() === task.deadline.getMonth() &&
               date.getDate() === task.deadline.getDate();
      });
    };

    const formattedDate = selectedDate ? format(selectedDate, "PPP") : "";


    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
            {/* Calendar */}
            <div className="md:w-1/3 p-4 flex items-start justify-center">
                {/* Popover Implementation without using  "@/components/ui" */}
                <div  className="w-full max-w-[300px]">
                    <div
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                        onClick={()=> {}}
                    >
                         {formattedDate ? (
                                <span className="text-left font-medium">
                                    {formattedDate}
                                </span>
                            ) : (
                                <span className="text-left text-gray-500">
                                    Pick a date
                                </span>
                            )}
                         <CalendarIcon className="ml-auto h-5 w-5 text-gray-400" />
                    </div>
                    {/* Simple Calendar Implementation without using  "@/components/ui" */}
                    <div  className="mt-2 rounded-md border border-gray-200 shadow-lg">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            initialFocus
                            className="rounded-md border border-gray-200 shadow-lg"
                        />
                    </div>
                </div>
            </div>

            {/* Task List for Selected Date */}
            <div className="md:w-2/3 p-4">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    Tasks for {formattedDate}
                </h2>
                {isLoading ? (
                    <div className="text-gray-500">Loading tasks...</div>
                ) : error ? (
                    <div className="text-red-500">{error}</div>
                ) : getTasksForDate(selectedDate || new Date()).length > 0 ? (
                    <ul className="space-y-4">
                        {getTasksForDate(selectedDate || new Date()).map((task) => (
                            <li
                                key={task.id}
                                className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
                            >
                                <h3 className="text-lg font-semibold text-gray-900">{task.content}</h3>
                                <p className="text-gray-500 text-sm">
                                    Deadline: {task.deadline ? format(task.deadline, "PPPppp") : "No Deadline"}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-gray-500 italic">No tasks for this date.</div>
                )}
            </div>
        </div>
    );
};

export default TaskCalendar;

