import { createAsyncThunk } from '@reduxjs/toolkit';
import { setDesktopItems } from '../slices/desktopSlice';

export const fetchDesktopItems = createAsyncThunk(
    'desktop/fetchItems',
    async (_, { dispatch }) => {
        const items = await window.electronAPI.filesystem.getItemsInPath('/Desktop');
        if (items) {
            dispatch(setDesktopItems(items));
        }
    }
);
