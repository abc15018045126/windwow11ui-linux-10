import React from 'react';
import * as Icons from '../../constants';
import { AppIconProps } from '../../types';

// This is a dynamic icon component that maps a string name to an actual SVG component.
// It's ported from the old codebase.

const iconMap: { [key: string]: React.FC<AppIconProps> } = {
  start: Icons.StartIcon,
  search: Icons.SearchIcon,
  settings: Icons.SettingsIcon,
  notebook: Icons.NotebookIcon,
  close: Icons.CloseIcon,
  minimize: Icons.MinimizeIcon,
  maximize: Icons.MaximizeIcon,
  restore: Icons.RestoreIcon,
  fileGeneric: Icons.FileGenericIcon,
  folder: Icons.FolderIcon,
  user: Icons.UserIcon,
  sftp: Icons.SftpIcon,
  fileExplorer: Icons.FileExplorerIcon,
  chrome: Icons.BrowserIcon,
  // Add other icons here as they are migrated
};

interface IconProps extends AppIconProps {
  iconName?: string;
}

export const isValidIcon = (iconName: string): boolean => {
  return iconName in iconMap;
};

const Icon: React.FC<IconProps> = ({ iconName, ...rest }) => {
  if (!iconName) {
    return <Icons.FileGenericIcon {...rest} />;
  }

  const IconComponent = iconMap[iconName];

  if (!IconComponent) {
    console.warn(`Icon "${iconName}" not found. Falling back to default.`);
    return <Icons.FileGenericIcon {...rest} />;
  }

  return <IconComponent {...rest} />;
};

export default Icon;
