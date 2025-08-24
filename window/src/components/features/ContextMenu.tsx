import React, { useState, useEffect, useRef } from 'react';

export type ContextMenuItem =
  | { type: 'item'; label: string; onClick: () => void; disabled?: boolean; items?: ContextMenuItem[] }
  | { type: 'separator' };

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  isSubMenu?: boolean;
}

const MenuItem: React.FC<{ item: ContextMenuItem; onClose: () => void }> = ({ item, onClose }) => {
    const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
    const menuItemRef = useRef<HTMLButtonElement>(null);
    const timerRef = useRef<number | null>(null);

    const handleMouseEnter = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (item.type === 'item' && item.items) {
            setIsSubMenuOpen(true);
        }
    };

    const handleMouseLeave = () => {
        timerRef.current = window.setTimeout(() => {
            setIsSubMenuOpen(false);
        }, 200); // A small delay to allow moving to the submenu
    };

    if (item.type === 'separator') {
        return <div className="h-px bg-zinc-700 my-1.5" />;
    }

    const hasSubMenu = item.items && item.items.length > 0;
    const subMenuX = menuItemRef.current ? menuItemRef.current.offsetWidth - 5 : 0;
    const subMenuY = menuItemRef.current ? -8 : 0; // Adjust to align with parent

    return (
        <button
            ref={menuItemRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => {
                if (!hasSubMenu) {
                    item.onClick();
                    onClose();
                }
            }}
            disabled={item.disabled}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm flex items-center justify-between relative"
        >
            <span>{item.label}</span>
            {hasSubMenu && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
            )}
            {hasSubMenu && isSubMenuOpen && (
                <div className="absolute top-0" style={{ left: subMenuX, top: subMenuY }}>
                    <ContextMenu items={item.items!} onClose={onClose} x={0} y={0} isSubMenu />
                </div>
            )}
        </button>
    );
};

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose, isSubMenu = false }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (isSubMenu) return; // Root menu handles the global click
      const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              onClose();
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, isSubMenu]);

  // Adjust position to stay within viewport
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const menuWidth = 180; // Estimated width
  const menuHeight = items.reduce((acc, item) => acc + (item.type === 'separator' ? 8 : 32), 0);

  let finalX = x;
  let finalY = y;

  if (!isSubMenu) {
    finalX = x + menuWidth > screenWidth ? screenWidth - menuWidth - 5 : x;
    finalY = y + menuHeight > screenHeight ? screenHeight - menuHeight - 5 : y;
  }

  return (
    <div
      ref={menuRef}
      style={{ top: finalY, left: finalX }}
      className="fixed bg-black/80 backdrop-blur-xl border border-zinc-700 rounded-md shadow-lg py-1.5 w-48 text-sm text-zinc-100 z-[60]"
      onClick={e => e.stopPropagation()}
      onContextMenu={e => e.preventDefault()}
    >
      {items.map((item, index) => (
        <MenuItem key={index} item={item} onClose={onClose} />
      ))}
    </div>
  );
};

export default ContextMenu;
