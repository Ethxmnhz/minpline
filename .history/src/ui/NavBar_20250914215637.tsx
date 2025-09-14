import React from 'react';
import { NavLink } from 'react-router-dom';

export const NavBar: React.FC = () => {
  return (
    <nav className="nav-bar">
      <NavLink to="/dashboard">🏠<span>Home</span></NavLink>
      <NavLink to="/meals">🍽<span>Meals</span></NavLink>
      <NavLink to="/workouts">💪<span>Workouts</span></NavLink>
      <NavLink to="/saved">💾<span>Saved</span></NavLink>
      <NavLink to="/settings">⚙️<span>Settings</span></NavLink>
    </nav>
  );
};
