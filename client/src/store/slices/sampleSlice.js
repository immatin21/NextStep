import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name : "sample",
    initialState : {
        sampleData : null
    },
    reducers : {
        setSampleData : (state,action) => {
            state.sampleData = action.payload
        }
    }
})

export const {setSampleData} = userSlice.actions
export default userSlice.reducer
