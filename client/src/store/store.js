import { configureStore } from "@reduxjs/toolkit";
import sampleReducer from "../store/slices/sampleSlice.js";

const store = configureStore({
  reducer : {
    sample : sampleReducer,
  }
});

export default store;
