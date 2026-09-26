export default function ErrorMessage({message}: { message: string | null }) {
  if (!message) return null;
  return <div className="text-red-600 text-sm mb-2">{message}</div>;
}
