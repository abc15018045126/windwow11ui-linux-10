import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FilesystemItem } from '../../types';

interface DesktopState {
    items: FilesystemItem[];
}

const initialState: DesktopState = {
    items: [],
};

const desktopSlice = createSlice({
    name: 'desktop',
    initialState,
    reducers: {
        setDesktopItems(state, action: PayloadAction<FilesystemItem[]>) {
            state.items = action.payload;
        },
    },
});

export const { setDesktopItems } = desktopSlice.actions;
export default desktopSlice.reducer;
