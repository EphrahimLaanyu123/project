import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Link, useOutletContext } from 'react-router-dom'; // Import useOutletContext if you need data from parent
import './Rooms.css'; // Create a CSS file for your Rooms component if needed

const Rooms = () => {
    const [rooms, setRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [roomsError, setRoomsError] = useState("");

    // You can access context from the parent Dashboard if needed
    // const { user } = useOutletContext(); // Example of accessing user from Dashboard context

    useEffect(() => {
        async function fetchRooms() {
            setLoadingRooms(true);
            setRoomsError("");
            const { data, error } = await supabase
                .from('rooms') // Assuming you have a 'rooms' table
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching rooms:", error);
                setRoomsError("Failed to load rooms. Please try again.");
            } else {
                setRooms(data);
            }
            setLoadingRooms(false);
        }

        fetchRooms();

        // Optional: Realtime subscription for rooms if you want live updates
        const roomSubscription = supabase
            .channel('public:rooms')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, payload => {
                console.log('Change received!', payload);
                // Re-fetch rooms or update state based on payload
                fetchRooms();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(roomSubscription);
        };

    }, []); // Empty dependency array means this runs once on mount

    if (loadingRooms) {
        return (
            <div className="loading-spinner-container">
                <div className="loading-spinner">
                    <div className="loading-spinner-inner-border"></div>
                    <div className="loading-spinner-outer-border"></div>
                </div>
            </div>
        );
    }

    if (roomsError) {
        return (
            <div className="error-message-alert">
                <p className="error-message-title">Error:</p>
                <p>{roomsError}</p>
            </div>
        );
    }

    return (
        <div className="rooms-container">
            <h2 className="rooms-title">All Rooms</h2>
            {rooms.length > 0 ? (
                <div className="rooms-grid">
                    {rooms.map((room) => (
                        <Link to={`/rooms/${room.id}`} key={room.id} className="room-card">
                            <h3 className="room-card-name">{room.name}</h3>
                            <p className="room-card-description">{room.description || "No description provided."}</p>
                            {/* You might add more room details here */}
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="no-rooms-alert" role="alert">
                    <p className="no-rooms-title">No rooms available!</p>
                    <p className="no-rooms-text">Looks like there are no rooms yet. Be the first to create one!</p>
                </div>
            )}
        </div>
    );
};

export default Rooms;