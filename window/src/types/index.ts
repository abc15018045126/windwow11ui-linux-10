import { ReactNode } from 'react';

// This file contains type definitions for the application's components and data structures.
// It is being built incrementally as components are migrated to the new architecture.

export interface AppIconProps {
  className?: string;
  isSmall?: boolean;
}

// A generic definition for a component that can be rendered as an "app" in a window.
export type AppComponentProps = {
  // These are placeholder props for now.
  // They will be fleshed out as the window manager is built.
  setTitle: (title: string) => void;
  initialData?: any;
};

export type AppComponentType = React.FC<AppComponentProps>;

// The definition for an application that can be launched by the system.
export interface AppDefinition {
  id: string;
  name: string;
  icon: string; // Corresponds to an icon key
  component: AppComponentType;
  defaultSize?: { width: number; height: number };
  fileExtensions?: string[];
  allowMultipleInstances?: boolean;
  isExternal?: boolean;
  externalPath?: string;
}

// Represents an application that is currently open on the desktop.
export interface OpenApp extends AppDefinition {
    instanceId: string;
    zIndex: number;
    position: { x: number; y: number };
    size: { width: number; height: number };
    isMinimized: boolean;
    isMaximized: boolean;
    title: string;
    previousPosition?: { x: number; y: number };
    previousSize?: { width: number; height: number };
}
