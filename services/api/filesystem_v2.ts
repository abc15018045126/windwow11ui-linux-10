/**
 * @file This file re-exports the stable filesystem v2 functions.
 * It acts as a clean, logic-free interface to the core functionality.
 */

export {
    Filesystem_v2_getItemsInPath,
    Filesystem_v2_createFolder,
    Filesystem_v2_createFile,
    Filesystem_v2_deleteItem,
    Filesystem_v2_renameItem,
    Filesystem_v2_readAppFile,
    Filesystem_v2_getItemProperties,
    Filesystem_v2_copyItem,
    Filesystem_v2_createShortcut,
    Filesystem_v2_readShortcutFile,
} from '../../function/stable/filesystem/Filesystem_v2_main';
