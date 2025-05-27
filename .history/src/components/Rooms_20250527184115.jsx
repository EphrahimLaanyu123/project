/* Rooms.css - Modern and stylish UI for Nexus Rooms */

/* Base styles and variables */
:root {
  --primary-color: #6366f1;
  --primary-light: #818cf8;
  --primary-dark: #4f46e5;
  --secondary-color: #10b981;
  --secondary-light: #34d399;
  --secondary-dark: #059669;
  --accent-color: #f97316;
  --dark-bg: #111827;
  --card-bg: rgba(255, 255, 255, 0.9);
  --card-bg-hover: rgba(255, 255, 255, 1);
  --card-owner-gradient: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05));
  --card-member-gradient: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --border-radius-sm: 0.375rem;
  --border-radius-md: 0.5rem;
  --border-radius-lg: 0.75rem;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --transition-fast: 0.15s ease;
  --transition-normal: 0.3s ease;
  --text-light: #f9fafb;
  --text-dark: #111827;
  --text-muted: #6b7280;
  --error-color: #ef4444;
  --warning-color: #f59e0b;
  --success-color: #10b981;
}

/* Global styles */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.5;
  color: var(--text-dark);
  background-color: #f5f7fb;
  margin: 0;
  padding: 0;
}

/* Container */
.rooms-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: radial-gradient(ellipse at top, #f0f4ff, transparent),
              radial-gradient(ellipse at bottom, #f5f7fb, #e9edf8);
}

/* Header styles */
.rooms-header {
  background: linear-gradient(to right, var(--dark-bg), #1e293b);
  color: var(--text-light);
  padding: var(--space-4) var(--space-6);
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 0;
  z-index: 10;
}

.rooms-header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rooms-header-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(to right, var(--primary-light), var(--secondary-light));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  transition: transform var(--transition-normal);
}

.rooms-header-title:hover {
  transform: translateY(-1px);
}

.rooms-header-user-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.rooms-user-profile {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--border-radius-md);
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  transition: background-color var(--transition-fast);
}

.rooms-user-profile:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.rooms-icon-user-circle {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--text-light);
}

.rooms-username {
  font-weight: 500;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rooms-sign-out-button {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--text-light);
  border: none;
  border-radius: var(--border-radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.rooms-sign-out-button:hover {
  background-color: rgba(239, 68, 68, 0.2);
  transform: translateY(-1px);
}

.rooms-icon-logout {
  width: 1rem;
  height: 1rem;
}

/* Main content */
.rooms-main-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
  width: 100%;
  box-sizing: border-box;
}

/* Error message */
.rooms-error-message {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  margin-bottom: var(--space-6);
  background-color: rgba(239, 68, 68, 0.1);
  border-left: 4px solid var(--error-color);
  border-radius: var(--border-radius-sm);
  animation: slideIn 0.3s ease-out;
}

.rooms-error-message-icon {
  flex-shrink: 0;
  color: var(--error-color);
  width: 1.25rem;
  height: 1.25rem;
}

.rooms-error-message-text {
  flex: 1;
}

.rooms-error-message-title {
  margin: 0;
  color: var(--error-color);
  font-weight: 500;
}

/* Add room section */
.rooms-add-room-section {
  background: linear-gradient(to right, rgba(99, 102, 241, 0.05), rgba(16, 185, 129, 0.05));
  padding: var(--space-6);
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--space-8);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.rooms-add-room-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: 0;
  margin-bottom: var(--space-4);
  font-size: 1.25rem;
  color: var(--primary-dark);
}

.rooms-icon-plus-large {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--primary-color);
}

.rooms-add-room-form {
  display: flex;
  gap: var(--space-3);
}

.rooms-input-field {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: 1px solid rgba(203, 213, 225, 0.5);
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  background-color: rgba(255, 255, 255, 0.8);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.rooms-input-field:focus {
  outline: none;
  border-color: var(--primary-color);
  background-color: white;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.rooms-create-room-button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.rooms-create-room-button:hover {
  background-color: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.rooms-icon-plus-small {
  width: 1rem;
  height: 1rem;
}

/* Rooms grid */
.rooms-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
}

@media (min-width: 768px) {
  .rooms-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Rooms section */
.rooms-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.rooms-section-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0 0 var(--space-4) 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.rooms-section-title--my-rooms {
  color: var(--primary-dark);
}

.rooms-section-title--joined-rooms {
  color: var(--secondary-dark);
}

.rooms-icon-section {
  width: 1.25rem;
  height: 1.25rem;
}

/* Rooms list */
.rooms-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--space-4);
}

/* Room cards */
.rooms-card {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-4);
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(6px);
  display: flex;
  flex-direction: column;
  min-height: 150px;
}

.rooms-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  z-index: 1;
}

.rooms-card--owner {
  background: var(--card-owner-gradient), var(--card-bg);
}

.rooms-card--owner::before {
  background: linear-gradient(to right, var(--primary-light), var(--primary-dark));
}

.rooms-card--member {
  background: var(--card-member-gradient), var(--card-bg);
}

.rooms-card--member::before {
  background: linear-gradient(to right, var(--secondary-light), var(--secondary-dark));
}

.rooms-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  background-color: var(--card-bg-hover);
}

.rooms-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-3);
}

.rooms-card-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.rooms-icon-card {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.rooms-icon-card--owner {
  color: var(--primary-color);
}

.rooms-icon-card--member {
  color: var(--secondary-color);
}

.rooms-card-badge {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--border-radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;