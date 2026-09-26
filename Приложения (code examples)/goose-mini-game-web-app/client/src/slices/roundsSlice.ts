import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { getRounds, createRound } from "../api"

export const fetchRounds = createAsyncThunk('rounds/fetch', async () => {
  return await getRounds();
})

export const createNewRound = createAsyncThunk('rounds/create', async () => {
  return await createRound();
})

type RoundsState = {
  rounds: any[],
  loading: boolean,
  error: string | null,
}

const initialState: RoundsState = {
  rounds: [],
  loading: false,
  error: null,
}

const roundsSlice = createSlice({
  name: "rounds",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchRounds.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    builder.addCase(fetchRounds.fulfilled, (state, action) => {
      state.loading = false;
      state.rounds = action.payload;
    })
    builder.addCase(fetchRounds.rejected, (state, action) => {
      state.loading = false;
      state.error = "Ошибка получения раундов";
    })
    builder.addCase(createNewRound.fulfilled, (state, action) => {
      state.rounds = [action.payload, ...state.rounds];
    })
  }
})

export default roundsSlice.reducer
