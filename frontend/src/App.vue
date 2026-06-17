<template>
  <div class="min-h-screen p-4 flex flex-col gap-4 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold text-purple-400">盲文翻译与触觉学习器</h1>

    <div class="flex flex-wrap gap-2">
      <button v-for="t in tabs" :key="t.id" @click="activeTab = t.id"
        class="px-4 py-2 rounded text-sm"
        :class="activeTab === t.id ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'">
        {{ t.label }}
      </button>
    </div>

    <!-- Translate -->
    <div v-if="activeTab === 'translate'" class="grid grid-cols-2 gap-4">
      <div class="bg-gray-900 rounded-xl p-4">
        <h3 class="text-purple-300 font-bold mb-2">文本输入</h3>
        <textarea v-model="store.inputText" @input="store.translate()"
          class="w-full h-32 bg-gray-800 rounded p-3 text-white resize-none" placeholder="输入英文文本..." />
      </div>
      <div class="bg-gray-900 rounded-xl p-4">
        <h3 class="text-purple-300 font-bold mb-2">盲文输出</h3>
        <div class="text-4xl tracking-wider text-purple-300 h-16">{{ store.brailleUnicode }}</div>
        <div class="flex flex-wrap gap-2 mt-3">
          <BrailleCell v-for="(dots, i) in store.brailleOutput" :key="i" :dots="dots" :size="40" />
        </div>
      </div>
    </div>

    <!-- Learn -->
    <div v-if="activeTab === 'learn'" class="grid grid-cols-2 gap-4">
      <div class="bg-gray-900 rounded-xl p-4 flex flex-col items-center gap-4">
        <h3 class="text-purple-300 font-bold">猜盲文</h3>
        <div v-if="!store.quizChar">
          <button @click="store.generateQuiz()" class="bg-purple-500 px-6 py-3 rounded-lg text-lg hover:bg-purple-400">
            开始训练
          </button>
        </div>
        <div v-else class="flex flex-col items-center gap-3">
          <div class="text-7xl font-bold text-purple-400">{{ store.quizChar }}</div>
          <div class="text-sm text-gray-400">点击下方 6 点阵选择对应盲文</div>
          <div class="grid grid-cols-2 gap-2 p-4 bg-gray-800 rounded-xl">
            <button v-for="d in 6" :key="d" @click="store.toggleDot(d)"
              class="w-14 h-14 rounded-full border-2 transition-all"
              :class="store.selectedDots.includes(d) ? 'bg-purple-500 border-purple-400 scale-110' : 'bg-gray-700 border-gray-600 hover:border-purple-400'">
              <span class="text-xs">{{ d }}</span>
            </button>
          </div>
          <button @click="store.checkQuizAnswer()" class="bg-purple-500 px-6 py-2 rounded hover:bg-purple-400">确认</button>
        </div>
      </div>
      <div class="bg-gray-900 rounded-xl p-4">
        <div class="flex justify-between mb-2">
          <h3 class="text-purple-300 font-bold">统计</h3>
          <button @click="store.resetScore()" class="text-red-400 text-xs hover:underline">重置</button>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center mb-3">
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-green-400">{{ store.score.correct }}</div>
            <div class="text-xs text-gray-400">正确</div>
          </div>
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-red-400">{{ store.score.total - store.score.correct }}</div>
            <div class="text-xs text-gray-400">错误</div>
          </div>
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-purple-400">{{ store.score.total ? Math.round(store.score.correct / store.score.total * 100) : 0 }}%</div>
            <div class="text-xs text-gray-400">正确率</div>
          </div>
        </div>
        <div class="space-y-1 max-h-48 overflow-y-auto">
          <div v-for="(h, i) in store.history.slice(0, 20)" :key="i"
            class="flex justify-between bg-gray-800 rounded p-2 text-sm"
            :class="h.correct ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'">
            <span>{{ h.input }}</span><span>{{ h.correct ? '✓' : '✗' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Reference -->
    <div v-if="activeTab === 'ref'" class="bg-gray-900 rounded-xl p-4">
      <h3 class="text-purple-300 font-bold mb-3">盲文速查表</h3>
      <div class="grid grid-cols-6 md:grid-cols-9 gap-3">
        <div v-for="(dots, char) in brailleMap" :key="char" class="flex flex-col items-center">
          <div class="text-xl font-bold text-purple-400">{{ char }}</div>
          <BrailleCell :dots="dots" :size="30" />
          <div class="text-xs text-gray-500">{{ dots.join(',') }}</div>
        </div>
      </div>
    </div>

    <!-- IME Simulator -->
    <div v-if="activeTab === 'ime'" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="bg-gray-900 rounded-xl p-4 flex flex-col gap-4">
        <h3 class="text-purple-300 font-bold">点位录入</h3>
        <div class="flex justify-between items-start gap-4">
          <div class="flex flex-col items-center gap-2 bg-gray-800 rounded-xl p-6">
            <div class="text-sm text-gray-400">当前点位（按数字键 1-6）</div>
            <div class="grid grid-cols-2 gap-3">
              <button v-for="d in 6" :key="d" @click="store.imeToggleDot(d)"
                class="w-16 h-16 rounded-full border-2 transition-all text-lg font-bold"
                :class="store.imeDots.includes(d) ? 'bg-purple-500 border-purple-400 scale-110' : 'bg-gray-700 border-gray-600 hover:border-purple-400'">
                {{ d }}
              </button>
            </div>
            <div class="flex items-center gap-3 mt-2">
              <div class="text-sm text-gray-400">预览:</div>
              <div class="text-4xl text-purple-300 min-w-[60px] text-center">{{ store.imeBraillePreview }}</div>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <button @click="store.imeConfirm()"
              class="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-lg font-bold transition-all">
              ✓ 确认 (Enter)
            </button>
            <button @click="store.imeSpace()"
              class="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-bold transition-all">
              ⎵ 空格 (Space)
            </button>
            <button @click="store.imeBackspace()"
              class="bg-orange-600 hover:bg-orange-500 px-6 py-3 rounded-lg font-bold transition-all">
              ← 删除 (Backspace)
            </button>
            <button @click="store.imeReset()"
              class="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-lg font-bold transition-all">
              ⟳ 重置
            </button>
          </div>
        </div>
        <div class="text-xs text-gray-500 mt-2 bg-gray-800 p-3 rounded">
          <p class="font-bold text-gray-400 mb-1">键盘快捷键：</p>
          <p>1-6: 切换点位 | Enter: 确认字符 | Space: 空格 | Backspace: 删除</p>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <div class="bg-gray-900 rounded-xl p-4">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-purple-300 font-bold">输出文本</h3>
            <div class="text-xs text-gray-500">实时转换</div>
          </div>
          <div class="bg-gray-800 rounded p-4 min-h-[100px] text-2xl text-white break-all">
            {{ store.imeText || '...' }}
            <span class="animate-pulse text-purple-400">|</span>
          </div>
          <div class="mt-3">
            <div class="text-sm text-gray-400 mb-2">盲文显示：</div>
            <div class="flex flex-wrap gap-2 bg-gray-800 rounded p-3 min-h-[60px]">
              <template v-if="store.imeBrailleCells.length === 0">
                <span class="text-gray-600 text-sm">录入后显示...</span>
              </template>
              <BrailleCell v-for="(dots, i) in store.imeBrailleCells" :key="i" :dots="dots" :size="28" />
              <div v-if="store.imeDots.length > 0" class="border-2 border-dashed border-purple-500 rounded p-1 opacity-60">
                <BrailleCell :dots="store.imeDots" :size="28" />
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-900 rounded-xl p-4">
          <h3 class="text-purple-300 font-bold mb-3">速度统计</h3>
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-gray-800 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-green-400">{{ store.imeSpeed }}</div>
              <div class="text-xs text-gray-400 mt-1">字符/分钟 (CPM)</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-blue-400">{{ store.imeCharCount }}</div>
              <div class="text-xs text-gray-400 mt-1">已输入字符</div>
            </div>
            <div class="bg-gray-800 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-purple-400">{{ store.formatImeTime(store.imeElapsedTime) }}</div>
              <div class="text-xs text-gray-400 mt-1">录入时间</div>
            </div>
          </div>
          <div class="mt-4 bg-gray-800 rounded p-3">
            <div class="flex justify-between text-xs text-gray-400 mb-1">
              <span>录入进度</span>
              <span>{{ store.imeCharCount > 0 ? '进行中' : '等待开始' }}</span>
            </div>
            <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-purple-500 to-green-500 transition-all duration-300"
                :style="{ width: Math.min(store.imeCharCount * 2, 100) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <button v-if="activeTab === 'translate'" @click="doExport" class="bg-green-700 px-4 py-2 rounded self-start hover:bg-green-600 text-sm">
      导出翻译文本
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useBrailleStore } from './store/braille'
import { BRAILLE_MAP } from './utils/braille'
import BrailleCell from './components/BrailleCell.vue'

const store = useBrailleStore()
const brailleMap = BRAILLE_MAP
const tabs = [
  { id: 'translate', label: '翻译模式' },
  { id: 'learn', label: '训练模式' },
  { id: 'ime', label: '输入法模拟器' },
  { id: 'ref', label: '速查表' },
]
const activeTab = ref('translate')

function doExport() {
  const text = store.exportPDF()
  const blob = new Blob([text], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'braille-output.txt'
  a.click()
}

function handleKeydown(e: KeyboardEvent) {
  if (activeTab.value !== 'ime') return
  if (e.key >= '1' && e.key <= '6') {
    e.preventDefault()
    store.imeToggleDot(parseInt(e.key))
  } else if (e.key === 'Enter') {
    e.preventDefault()
    store.imeConfirm()
  } else if (e.key === ' ') {
    e.preventDefault()
    store.imeSpace()
  } else if (e.key === 'Backspace') {
    e.preventDefault()
    store.imeBackspace()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  store.imeStopTimer()
})

watch(activeTab, (newTab) => {
  if (newTab !== 'ime') store.imeStopTimer()
})
</script>
