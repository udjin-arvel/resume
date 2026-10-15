import { useState, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "../store"
import { login } from "../slices/userSlice"
import ErrorMessage from "../components/ErrorMessage"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();
  const error = useAppSelector(s => s.user.error);
  const loading = useAppSelector(s => s.user.loading);
  const user = useAppSelector(s => s.user.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/rounds')
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    await dispatch(login({username, password}))
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <form className="bg-white p-8 rounded shadow max-w-xs w-full" onSubmit={onSubmit}>
        <h1 className="text-xl mb-4 text-center font-bold">The Last of Guss</h1>
        <input type="text" className="border w-full mb-2 px-2 py-1 rounded"
               placeholder="Имя" value={username} onChange={e => setUsername(e.target.value)}/>
        <input type="password" className="border w-full mb-2 px-2 py-1 rounded"
               placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)}/>
        <button type="submit"
                className="bg-blue-600 text-white w-full py-2 rounded disabled:opacity-50 mb-2"
                disabled={loading}>
          Войти
        </button>
        <ErrorMessage message={error}/>
      </form>
    </div>
  )
}
