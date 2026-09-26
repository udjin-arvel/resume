import { useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../store"
import { fetchRounds, createNewRound } from "../slices/roundsSlice"

export default function Rounds() {
  const dispatch = useAppDispatch();
  const {rounds, loading, error} = useAppSelector(s => s.rounds);
  const user = useAppSelector(s => s.user.user);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchRounds())
  }, [dispatch]);

  const handleCreate = async () => {
    const res = await dispatch(createNewRound())
    if ('payload' in res && res.payload && res.payload.id) {
      navigate(`/rounds/${res.payload.id}`)
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Раунды</h2>
        {user?.role === 'admin' && (
          <button className="bg-green-600 text-white px-4 py-2 rounded"
                  onClick={handleCreate}>
            Создать раунд
          </button>
        )}
      </div>
      {loading && <div>Загрузка...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <ul className="divide-y bg-white rounded shadow">
        {rounds.map(round => (
          <li key={round.id} className="p-4 flex justify-between">
            <Link to={`/rounds/${round.id}`} className="text-blue-700 underline">
              Раунд #{round.id}
            </Link>
            <span>
              {new Date(round.startAt) > new Date()
                ? "Запланирован"
                : new Date(round.endAt) > new Date()
                  ? "Активен"
                  : "Завершён"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
