import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { Meals } from './Meals';
import { Workouts } from './Workouts';
import { SavedMeals } from './SavedMeals';
import { Settings } from './Settings';
import { NavBar } from '../ui/NavBar';
import { CloudSync } from '../services/cloudSync';
import { InstallPWAButton } from '../ui/InstallPWAButton';
import { useMidnightRollover } from '../util/useMidnightRollover';

export const App: React.FC = () => {
  useMidnightRollover();
  return (
    <BrowserRouter>
      <div className="app-shell">
        <div className="view">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/meals" element={<Meals />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/saved" element={<SavedMeals />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<div style={{padding:16}}>Not found</div>} />
          </Routes>
        </div>
        <NavBar />
        <InstallPWAButton />
        <CloudSync />
      </div>
    </BrowserRouter>
  );
};
