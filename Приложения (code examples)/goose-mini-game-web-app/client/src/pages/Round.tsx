import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { getRound, tapGoose } from "../api"
import GuseButton from "../components/GuseButton"

type RoundData = {
  id: number
  startAt: string
  endAt: string
  myStats: { taps: number, points: number }
  winner: null | { userId: number, username: string, points: number }
}

export default function Round() {
  const {id} = useParams<{ id: string }>();
  const [data, setData] = useState<RoundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tapLoading, setTapLoading] = useState(false);

  useEffect(() => {
    setLoading(true)
    getRound(Number(id))
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id]);

  const isActive = data && new Date(data.startAt) <= new Date() && new Date(data.endAt) >= new Date();
  const isFinished = data && new Date(data.endAt) < new Date();
  const isPlanned = data && new Date(data.startAt) > new Date();

  async function handleTap() {
    setTapLoading(true)
    try {
      const res = await tapGoose(Number(id))
      setData(d => d ? {...d, myStats: res} : d)
    } catch (e) {
      setError("Ошибка при тапе")
    }
    setTapLoading(false)
  }

  if (loading) return <div className="p-8">Загрузка...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!data) return <div className="p-8">Не найдено</div>;

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded shadow p-6">
      <h2 className="text-xl font-bold mb-2">Раунд #{data.id}</h2>
      <div className="mb-2">
        Статус: {isFinished ? "Завершён" : isActive ? "Активен" : "Запланирован"}
      </div>
      <div className="mb-2">
        Ваши очки: <b>{data.myStats.points}</b>
        <br/>
        Ваши тапы: <b>{data.myStats.taps}</b>
      </div>
      {isActive &&
        <div className="my-4 flex flex-col items-center space-y-2">
          <GuseButton onTap={handleTap} loading={tapLoading}/>
        </div>
      }
      {isPlanned && <div className="text-yellow-600">Раунд ещё не начался!</div>}
      {isFinished && data.winner && (
        <div className="mt-4">
          <b>Победитель:</b> {data.winner.username} ({data.winner.points} очков)
        </div>
      )}
    </div>
  )
}
