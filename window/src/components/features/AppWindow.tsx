import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { OpenApp } from '../../types';
import { closeApp, focusApp, updateAppPosition, updateAppSize, toggleMaximize } from '../../store/slices/windowSlice';
import Icon from './Icon';

interface AppWindowProps {
  app: OpenApp;
  isActive: boolean;
}

const AppWindow: React.FC<AppWindowProps> = ({ app, isActive }) => {
  const dispatch = useDispatch();
  const windowRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [initialWinPos, setInitialWinPos] = useState({ x: 0, y: 0 });

  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, winX: 0, winY: 0 });

  const handleFocus = () => {
    if (!isActive) {
      dispatch(focusApp(app.instanceId));
    }
  };

  const handleClose = () => dispatch(closeApp(app.instanceId));
  const handleMinimize = () => console.log('Minimize not implemented');
  const handleMaximize = () => dispatch(toggleMaximize(app.instanceId));

  const handleMouseDownHeader = (e: React.MouseEvent<HTMLDivElement>) => {
    if (app.isMaximized || isResizing || (e.target as HTMLElement).closest('button')) return;
    handleFocus();
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setInitialWinPos(app.position);
  };

  const handleMouseDownResize = (e: React.MouseEvent<HTMLDivElement>, direction: string) => {
    if (app.isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    handleFocus();
    setIsResizing(direction);
    setResizeStart({ x: e.clientX, y: e.clientY, width: app.size.width, height: app.size.height, winX: app.position.x, winY: app.position.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && !app.isMaximized) {
        const dx = e.clientX - dragStartPos.x;
        const dy = e.clientY - dragStartPos.y;
        dispatch(updateAppPosition({ instanceId: app.instanceId, position: { x: initialWinPos.x + dx, y: initialWinPos.y + dy } }));
    }
    if (isResizing && !app.isMaximized) {
        const dx = e.clientX - resizeStart.x;
        const dy = e.clientY - resizeStart.y;
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = resizeStart.winX;
        let newY = resizeStart.winY;
        const MIN_WIDTH = 250;
        const MIN_HEIGHT = 150;

        if (isResizing.includes('right')) newWidth = Math.max(MIN_WIDTH, resizeStart.width + dx);
        if (isResizing.includes('left')) {
            const calculatedWidth = resizeStart.width - dx;
            if (calculatedWidth >= MIN_WIDTH) {
                newWidth = calculatedWidth;
                newX = resizeStart.winX + dx;
            }
        }
        if (isResizing.includes('bottom')) newHeight = Math.max(MIN_HEIGHT, resizeStart.height + dy);
        if (isResizing.includes('top')) {
            const calculatedHeight = resizeStart.height - dy;
            if (calculatedHeight >= MIN_HEIGHT) {
                newHeight = calculatedHeight;
                newY = resizeStart.winY + dy;
            }
        }
        dispatch(updateAppSize({ instanceId: app.instanceId, size: { width: newWidth, height: newHeight } }));
        if (newX !== app.position.x || newY !== app.position.y) {
            dispatch(updateAppPosition({ instanceId: app.instanceId, position: { x: newX, y: newY } }));
        }
    }
  }, [isDragging, isResizing, dragStartPos, initialWinPos, resizeStart, dispatch, app.instanceId, app.isMaximized, app.position.x, app.position.y]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const AppComponent = app.component;

  const windowClasses = `
    fixed flex flex-col shadow-2xl overflow-hidden
    border bg-gray-700
    ${app.isMinimized ? 'opacity-0 pointer-events-none' : ''}
    ${isActive ? 'border-blue-500' : 'border-gray-600'}
    ${app.isMaximized ? 'rounded-none' : 'rounded-lg'}
  `;

  const size = app.isMaximized ? { width: '100%', height: 'calc(100% - 48px)' } : app.size;

  return (
    <div
      ref={windowRef}
      className={windowClasses}
      style={{ left: `${app.position.x}px`, top: `${app.position.y}px`, width: `${size.width}${typeof size.width === 'number' ? 'px' : ''}`, height: `${size.height}${typeof size.height === 'number' ? 'px' : ''}`, zIndex: app.zIndex }}
      onMouseDown={handleFocus}
    >
      {!app.isMaximized && (
        <>
            <div className="absolute -left-1 top-0 bottom-0 w-2 cursor-ew-resize z-10" onMouseDown={e => handleMouseDownResize(e, 'left')} />
            <div className="absolute -right-1 top-0 bottom-0 w-2 cursor-ew-resize z-10" onMouseDown={e => handleMouseDownResize(e, 'right')} />
            <div className="absolute -top-1 left-0 right-0 h-2 cursor-ns-resize z-10" onMouseDown={e => handleMouseDownResize(e, 'top')} />
            <div className="absolute -bottom-1 left-0 right-0 h-2 cursor-ns-resize z-10" onMouseDown={e => handleMouseDownResize(e, 'bottom')} />
            <div className="absolute -left-1 -top-1 w-3 h-3 cursor-nwse-resize z-10" onMouseDown={e => handleMouseDownResize(e, 'top-left')} />
            <div className="absolute -right-1 -top-1 w-3 h-3 cursor-nesw-resize z-10" onMouseDown={e => handleMouseDownResize(e, 'top-right')} />
            <div className="absolute -left-1 -bottom-1 w-3 h-3 cursor-nesw-resize z-10" onMouseDown={e => handleMouseDownResize(e, 'bottom-left')} />
            <div className="absolute -right-1 -bottom-1 w-3 h-3 cursor-nwse-resize z-10" onMouseDown={e => handleMouseDownResize(e, 'bottom-right')} />
        </>
      )}
      <div className="flex items-center justify-between h-8 px-3 bg-gray-800 select-none cursor-grab" onMouseDown={handleMouseDownHeader} onDoubleClick={handleMaximize}>
        <div className="flex items-center space-x-2">
          <Icon iconName={app.icon} className="w-4 h-4" isSmall />
          <span className="text-xs font-medium truncate text-white">{app.title}</span>
        </div>
        <div className="flex items-center space-x-1">
          <button onClick={handleMinimize} className="p-1.5 hover:bg-white/20 rounded-sm" title="Minimize"><Icon iconName="minimize" className="w-4 h-4 text-white" /></button>
          <button onClick={handleMaximize} className="p-1.5 hover:bg-white/20 rounded-sm" title={app.isMaximized ? 'Restore' : 'Maximize'}><Icon iconName={app.isMaximized ? 'restore' : 'maximize'} className="w-4 h-4 text-white" /></button>
          <button onClick={handleClose} className="p-1.5 hover:bg-red-500/80 rounded-sm" title="Close"><Icon iconName="close" className="w-4 h-4 text-white" /></button>
        </div>
      </div>
      <div className="flex-grow overflow-auto bg-gray-200">
        <AppComponent setTitle={(title) => {}} initialData={app.initialData || {}} />
      </div>
    </div>
  );
};

export default AppWindow;
