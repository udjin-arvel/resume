export default function GuseButton({onTap, loading}: { onTap: () => void, loading: boolean }) {
  return (
    <button
      onClick={onTap}
      className="w-32 h-32 shadow-lg hover:scale-105 active:scale-95 select-none transition"
      disabled={loading}
      aria-label="Тапнуть по гусю"
    >
      <img src="https://png.pngtree.com/png-clipart/20220531/original/pngtree-goose-png-image_7777618.png" alt="Гусь"/>
    </button>
  )
}
