import { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { supabase } from "../supabase";

const locales = { "en-US": require("date-fns/locale/en-US") };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const CalendarComponent = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from("calendars").select("*");
      if (error) {
        console.error("Error fetching events:", error);
      } else {
        const formattedEvents = data.map(event => ({
          id: event.id,
          title: event.title,
          start: new Date(event.event_date),
          end: new Date(event.event_date),
          desc: event.description || "",
        }));
        setEvents(formattedEvents);
      }
      setIsLoading(false);
    };

    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Event Calendar</h1>
      {isLoading ? (
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-800"></div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            className="border rounded-md shadow-md"
          />
        </div>
      )}
    </div>
  );
};

export default CalendarComponent;
