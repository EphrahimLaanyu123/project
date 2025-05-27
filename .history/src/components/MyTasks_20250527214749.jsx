import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

// Define global variables for Firebase configuration and app ID.
// These are provided by the Canvas environment.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const MyTask = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null); // State to store the authenticated user's ID
  const [isAuthReady, setIsAuthReady] = useState(false); // To track if auth state is resolved

  // Effect for Firebase Authentication setup and listener
  useEffect(() => {
    const setupAuth = async () => {
      try {
        // Sign in with custom token if available, otherwise sign in anonymously
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Firebase Auth Error:", e);
        setError(`Authentication failed: ${e.message}`);
      }
    };

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid); // Set the userId from the authenticated user
        setError(null);
      } else {
        setUser(null);
        setUserId(null);
        setError('User not logged in or session expired.');
      }
      setIsAuthReady(true); // Mark auth as ready once the initial check is done
      setLoading(false); // Stop loading after auth state is determined
    });

    setupAuth(); // Call the auth setup function

    // Cleanup the auth listener on component unmount
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs once on mount

  // Effect for fetching tasks from Firestore
  useEffect(() => {
    // Only fetch tasks if authentication is ready and a user is logged in
    if (!isAuthReady || !userId) {
      if (isAuthReady && !userId) {
        setTasks([]); // Clear tasks if no user is logged in
      }
      return;
    }

    setLoading(true);
    setError(null);

    // Define the Firestore collection path for user-specific tasks
    // This follows the private data security rule: /artifacts/{appId}/users/{userId}/{your_collection_name}
    const tasksCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/tasks`);

    // Create a query to get tasks for the current user, ordered by creation time
    // Note: orderBy can require Firestore indexes. For simplicity and to avoid index issues,
    // we'll remove it if it causes problems, and sort in memory.
    // For now, we'll try to order by 'createdAt' if it exists.
    const q = query(tasksCollectionRef); // Removed orderBy to avoid index issues, will sort in client

    // Set up a real-time listener for tasks
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort tasks by createdAt in memory if needed, as orderBy is removed from query
      fetchedTasks.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));

      setTasks(fetchedTasks);
      setLoading(false);
    }, (e) => {
      console.error("Firestore Fetch Error:", e);
      setError(`Failed to load tasks: ${e.message}`);
      setLoading(false);
    });

    // Cleanup the Firestore listener on component unmount or when userId changes
    return () => unsubscribe();
  }, [isAuthReady, userId]); // Re-run when auth state is ready or userId changes

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-100 text-red-700 p-4 rounded-lg">
        <p className="text-lg">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-white shadow-lg rounded-lg my-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">My Tasks</h2>
      {userId && (
        <p className="text-sm text-gray-500 mb-4">
          Current User ID: <span className="font-mono bg-gray-100 p-1 rounded">{userId}</span>
        </p>
      )}

      {tasks.length === 0 ? (
        <p className="text-gray-600">No tasks assigned to you.</p>
      ) : (
        <ul className="space-y-4">
          {tasks.map((task) => (
            <li key={task.id} className="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200">
              <strong className="text-xl text-gray-900 block mb-1">{task.content}</strong>
              <div className="text-gray-700 text-sm">
                <span className="font-semibold">Priority:</span> {task.priority || 'N/A'},
                <span className="ml-2 font-semibold">Status:</span> {task.status || 'N/A'}
              </div>
              {task.deadline && (
                <div className="text-gray-600 text-xs mt-1">
                  <span className="font-semibold">Deadline:</span> {new Date(task.deadline.toDate()).toLocaleDateString()}
                </div>
              )}
              {task.createdAt && (
                <div className="text-gray-600 text-xs mt-1">
                  <span className="font-semibold">Created At:</span> {new Date(task.createdAt.toDate()).toLocaleString()}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyTask;
