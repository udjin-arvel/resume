import { ref } from "vue"

export function useCodeTimer(initialSeconds: number = 600) {
  const timer = ref(0)
  let timerInterval: ReturnType<typeof setInterval> | null = null

  function startTimer() {
    timer.value = initialSeconds
    stopTimer()
    timerInterval = setInterval(() => {
      if (timer.value > 0) {
        timer.value--
      }
      else {
        stopTimer()
      }
    }, 1000)
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function resetTimer() {
    stopTimer()
    timer.value = 0
  }

  return {
    timer,
    startTimer,
    stopTimer,
    resetTimer,
  }
}
