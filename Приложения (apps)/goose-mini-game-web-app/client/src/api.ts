import axios from "axios"

const api = axios.create({
  withCredentials: true,
})

export async function login(username: string, password: string) {
  const res = await api.post('/api/login', {username, password});
  return res.data.user;
}

export async function logout() {
  await api.post('/api/login/logout');
}

export async function getMe() {
  const res = await api.get('/api/login/me');
  return res.data.user;
}

export async function getRounds() {
  const res = await api.get('/api/rounds');
  return res.data;
}

export async function createRound() {
  const res = await api.post('/api/rounds');
  return res.data;
}

export async function getRound(id: number) {
  const res = await api.get(`/api/rounds/${id}`);
  return res.data;
}

export async function tapGoose(roundId: number) {
  const res = await api.post(`/api/rounds/${roundId}/tap`);
  return res.data;
}
