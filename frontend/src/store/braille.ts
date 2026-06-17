import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { BRAILLE_MAP, textToBraille, brailleToText, dotsToUnicode } from '../utils/braille'
import type { LearnMode } from '../types'

export const useBrailleStore = defineStore('braille', () => {
  const inputText = ref('')
  const brailleOutput = ref<number[][]>([])
  const learnMode = ref<LearnMode>('charToBraille')
  const quizChar = ref('')
  const selectedDots = ref<number[]>([])
  const score = ref({ correct: 0, total: 0 })
  const history = ref<{ input: string; correct: boolean }[]>([])

  // IME Simulator state
  const imeDots = ref<number[]>([])
  const imeText = ref('')
  const imeBrailleCells = ref<number[][]>([])
  const imeStartTime = ref<number | null>(null)
  const imeCharCount = ref(0)
  const imeElapsedTime = ref(0)
  let imeTimer: ReturnType<typeof setInterval> | null = null

  const brailleUnicode = computed(() =>
    brailleOutput.value.map(d => dotsToUnicode(d)).join('')
  )

  const imeSpeed = computed(() => {
    if (imeElapsedTime.value === 0 || imeCharCount.value === 0) return 0
    const minutes = imeElapsedTime.value / 60
    return Math.round(imeCharCount.value / minutes)
  })

  const imeBraillePreview = computed(() => dotsToUnicode(imeDots.value))

  function translate() {
    brailleOutput.value = textToBraille(inputText.value)
  }

  function reverseTranslate() {
    // Simple: take selectedDots and find matching char
    return brailleToText(selectedDots.value)
  }

  function generateQuiz() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    quizChar.value = chars[Math.floor(Math.random() * chars.length)]
    selectedDots.value = []
  }

  function toggleDot(dot: number) {
    const idx = selectedDots.value.indexOf(dot)
    if (idx >= 0) selectedDots.value.splice(idx, 1)
    else selectedDots.value.push(dot)
  }

  function checkQuizAnswer() {
    const correct = JSON.stringify([...selectedDots.value].sort()) === JSON.stringify([...(BRAILLE_MAP[quizChar.value] || [])].sort())
    score.value.total++
    if (correct) score.value.correct++
    history.value.unshift({ input: quizChar.value, correct })
    if (navigator.vibrate) navigator.vibrate(correct ? 100 : [100, 50, 100])
    generateQuiz()
  }

  function resetScore() {
    score.value = { correct: 0, total: 0 }
    history.value = []
  }

  function exportPDF(): string {
    const lines = inputText.value.toUpperCase().split('')
    let out = '盲文翻译输出\n\n'
    for (const ch of lines) {
      const dots = BRAILLE_MAP[ch] || []
      out += `${ch} → [${dots.join(',')}] ${dotsToUnicode(dots)}\n`
    }
    return out
  }

  // IME methods
  function imeStartTimer() {
    if (imeTimer) return
    imeStartTime.value = Date.now()
    imeTimer = setInterval(() => {
      if (imeStartTime.value) {
        imeElapsedTime.value = Math.floor((Date.now() - imeStartTime.value) / 1000)
      }
    }, 200)
  }

  function imeStopTimer() {
    if (imeTimer) {
      clearInterval(imeTimer)
      imeTimer = null
    }
  }

  function imeToggleDot(dot: number) {
    if (!imeStartTime.value) imeStartTimer()
    const idx = imeDots.value.indexOf(dot)
    if (idx >= 0) imeDots.value.splice(idx, 1)
    else imeDots.value.push(dot)
  }

  function imeConfirm() {
    if (!imeStartTime.value) imeStartTimer()
    const char = brailleToText(imeDots.value)
    if (char !== '?') {
      imeText.value += char.toLowerCase()
      imeBrailleCells.value.push([...imeDots.value])
      imeCharCount.value++
    }
    imeDots.value = []
  }

  function imeSpace() {
    if (!imeStartTime.value) imeStartTimer()
    imeText.value += ' '
    imeBrailleCells.value.push([])
    imeCharCount.value++
    imeDots.value = []
  }

  function imeBackspace() {
    if (imeDots.value.length > 0) {
      imeDots.value = []
    } else if (imeText.value.length > 0) {
      imeText.value = imeText.value.slice(0, -1)
      imeBrailleCells.value.pop()
      if (imeCharCount.value > 0) imeCharCount.value--
    }
  }

  function imeReset() {
    imeStopTimer()
    imeDots.value = []
    imeText.value = ''
    imeBrailleCells.value = []
    imeStartTime.value = null
    imeCharCount.value = 0
    imeElapsedTime.value = 0
  }

  function formatImeTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return {
    inputText, brailleOutput, learnMode, quizChar, selectedDots, score, history,
    brailleUnicode, translate, reverseTranslate, generateQuiz, toggleDot,
    checkQuizAnswer, resetScore, exportPDF,
    imeDots, imeText, imeBrailleCells, imeCharCount, imeElapsedTime,
    imeSpeed, imeBraillePreview,
    imeToggleDot, imeConfirm, imeSpace, imeBackspace, imeReset, formatImeTime
  }
})
