import { useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom"
import Login from "./pages/Login"
import Rounds from "./pages/Rounds"
import Round from "./pages/Round"
import { useAppDispatch, useAppSelector } from "./store"
import { fetchMe, logout } from "./slices/userSlice"

function RequireAuth({children}: { children: JSX.Element }) {
  const user = useAppSelector(s => s.user.user);
  if (!user) return <Navigate to="/login"/>;
  return children;
}

function LogoutButton() {
  const dispatch = useAppDispatch();

  return (
    <button
      className="ml-2 px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
      onClick={() => dispatch(logout())}
    >
      Выйти
    </button>
  )
}

function BackButton() {
  const history = useNavigate();
  const location = useLocation();

  const goBack = () => {
    history(-1);
  };

  return (
    <button
      className={`ml-2 px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 ${location.pathname === '/rounds' && 'hidden'}`}
      onClick={goBack}
    >
      Назад
    </button>
  );
}

export default function App() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.user.user);

  useEffect(() => {
    dispatch(fetchMe())
  }, [dispatch]);

  return (
    <BrowserRouter>
      <div className="w-full bg-gray-100 p-2 flex justify-between">
        {user && (
          <>
            <span>
              <BackButton/>
            </span>
            <span>
              {user.username} <LogoutButton/>
            </span>
          </>
        )}
      </div>
      <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="/rounds" element={
          <RequireAuth><Rounds/></RequireAuth>
        }/>
        <Route path="/rounds/:id" element={
          <RequireAuth><Round/></RequireAuth>
        }/>
        <Route path="*" element={<Navigate to="/rounds"/>}/>
      </Routes>
    </BrowserRouter>
  )
}
