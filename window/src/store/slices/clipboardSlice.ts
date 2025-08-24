import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FilesystemItem {
    name: string;
    path: string;
    type: 'file' | 'folder';
}

interface ClipboardState {
    copiedItem: FilesystemItem | null;
}

const initialState: ClipboardState = {
    copiedItem: null,
};

const clipboardSlice = createSlice({
    name: 'clipboard',
    initialState,
    reducers: {
        copyItem(state, action: PayloadAction<FilesystemItem>) {
            state.copiedItem = action.payload;
        },
        clearClipboard(state) {
            state.copiedItem = null;
        },
    },
});

export const { copyItem, clearClipboard } = clipboardSlice.actions;
export default clipboardSlice.reducer;
