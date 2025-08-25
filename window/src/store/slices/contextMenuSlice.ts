import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ContextMenuItem } from '../../components/features/ContextMenu';

interface ContextMenuState {
    isOpen: boolean;
    x: number;
    y: number;
    items: ContextMenuItem[];
}

const initialState: ContextMenuState = {
    isOpen: false,
    x: 0,
    y: 0,
    items: [],
};

interface OpenContextMenuPayload {
    x: number;
    y: number;
    items: ContextMenuItem[];
}

const contextMenuSlice = createSlice({
    name: 'contextMenu',
    initialState,
    reducers: {
        openContextMenu(state, action: PayloadAction<OpenContextMenuPayload>) {
            state.isOpen = true;
            state.x = action.payload.x;
            state.y = action.payload.y;
            state.items = action.payload.items;
        },
        closeContextMenu(state) {
            state.isOpen = false;
        },
    },
});

export const { openContextMenu, closeContextMenu } = contextMenuSlice.actions;
export default contextMenuSlice.reducer;
