import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';
import Desktop from './components/layout/Desktop';
import Taskbar from './components/layout/Taskbar';
import StartMenu from './components/features/StartMenu';

function App() {
  const isStartMenuOpen = useSelector((state: RootState) => state.ui.isStartMenuOpen);

  return (
    <div className="h-screen w-screen bg-black">
      <Desktop />
      {isStartMenuOpen && <StartMenu />}
      <Taskbar />
    </div>
  );
}

export default App;
