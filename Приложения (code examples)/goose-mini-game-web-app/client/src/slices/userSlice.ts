import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { login as apiLogin, getMe, logout as apiLogout } from "../api"

export const login = createAsyncThunk(
  'user/login',
  async ({username, password}: { username: string, password: string }, {rejectWithValue}) => {
    try {
      return await apiLogin(username, password);
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || "Ошибка входа");
    }
  }
)

export const fetchMe = createAsyncThunk(
  'user/fetchMe',
  async (_, {rejectWithValue}) => {
    try {
      return await getMe();
    } catch {
      return null;
    }
  }
)

export const logout = createAsyncThunk('user/logout', async () => {
  await apiLogout();
  return null;
})

type UserState = {
  user: null | { id: number, username: string, role: string },
  loading: boolean,
  error: string | null,
}

const initialState: UserState = {
  user: null, loading: false, error: null
}

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    builder.addCase(login.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
    })
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    })
    builder.addCase(fetchMe.fulfilled, (state, action) => {
      state.user = action.payload;
    })
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
    })
  }
})

export default userSlice.reducer
