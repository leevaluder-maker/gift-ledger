import { ref } from 'vue'

const STORAGE_KEY = 'minimal_ledger_user_records'
const RECYCLE_BIN_KEY = 'minimal_ledger_recycle_bin'

/**
 * @typedef {import('../types/index.js').LedgerRecord} LedgerRecord
 * @typedef {import('../types/index.js').PersonSummary} PersonSummary
 */

// 单例状态 - 在函数外部定义，确保所有组件共享同一状态
const records = ref(/** @type {LedgerRecord[]} */([]))
const recycleBin = ref(/** @type {Array<LedgerRecord & { deletedAt: string }>} */([]))

// 从localStorage加载用户数据
const loadRecords = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      records.value = JSON.parse(stored)
    } catch (e) {
      console.error('Failed to parse records:', e)
      records.value = []
    }
  } else {
    records.value = []
  }
}

// 从localStorage加载回收站数据
const loadRecycleBin = () => {
  const stored = localStorage.getItem(RECYCLE_BIN_KEY)
  if (stored) {
    try {
      recycleBin.value = JSON.parse(stored)
    } catch (e) {
      console.error('Failed to parse recycle bin:', e)
      recycleBin.value = []
    }
  } else {
    recycleBin.value = []
  }
}

// 保存用户数据到localStorage
const saveRecords = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
}

// 保存回收站数据到localStorage
const saveRecycleBin = () => {
  localStorage.setItem(RECYCLE_BIN_KEY, JSON.stringify(recycleBin.value))
}

// 初始化加载（只执行一次）
loadRecords()
loadRecycleBin()

export function useRecordStore() {
  /**
   * 获取所有记录
   * @returns {LedgerRecord[]}
   */
  const getAllRecords = () => {
    return records.value
  }

  /**
   * 根据ID获取记录
   * @param {string} id
   * @returns {LedgerRecord | undefined}
   */
  const getRecordById = (id) => {
    return records.value.find(record => record.id === id)
  }

  /**
   * 搜索记录
   * @param {string} keyword
   * @returns {LedgerRecord[]}
   */
  const searchRecords = (keyword) => {
    if (!keyword) return records.value
    const lowerKeyword = keyword.toLowerCase()
    return records.value.filter(record =>
      record.name.toLowerCase().includes(lowerKeyword) ||
      record.occasion.toLowerCase().includes(lowerKeyword)
    )
  }

  /**
   * 添加记录
   * @param {Omit<LedgerRecord, 'id'>} record
   * @returns {LedgerRecord}
   */
  const addRecord = (record) => {
    const newRecord = {
      ...record,
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    }
    records.value.unshift(newRecord)
    saveRecords()
    return newRecord
  }

  /**
   * 更新记录
   * @param {string} id
   * @param {Partial<LedgerRecord>} updates
   * @returns {boolean}
   */
  const updateRecord = (id, updates) => {
    const index = records.value.findIndex(record => record.id === id)
    if (index !== -1) {
      records.value[index] = { ...records.value[index], ...updates }
      saveRecords()
      return true
    }
    return false
  }

  /**
   * 删除记录（移入回收站）
   * @param {string} id
   * @returns {boolean}
   */
  const deleteRecord = (id) => {
    const index = records.value.findIndex(record => record.id === id)
    if (index !== -1) {
      const record = records.value[index]
      // 移入回收站
      recycleBin.value.unshift({
        ...record,
        deletedAt: new Date().toISOString()
      })
      saveRecycleBin()
      // 从主列表移除
      records.value.splice(index, 1)
      saveRecords()
      return true
    }
    return false
  }

  /**
   * 从回收站恢复记录
   * @param {string} id
   * @returns {boolean}
   */
  const restoreRecord = (id) => {
    const index = recycleBin.value.findIndex(record => record.id === id)
    if (index !== -1) {
      const record = recycleBin.value[index]
      // 移除删除时间标记
      const { deletedAt, ...originalRecord } = record
      // 恢复到主列表
      records.value.unshift(originalRecord)
      saveRecords()
      // 从回收站移除
      recycleBin.value.splice(index, 1)
      saveRecycleBin()
      return true
    }
    return false
  }

  /**
   * 永久删除记录（从回收站）
   * @param {string} id
   * @returns {boolean}
   */
  const permanentDeleteRecord = (id) => {
    const index = recycleBin.value.findIndex(record => record.id === id)
    if (index !== -1) {
      recycleBin.value.splice(index, 1)
      saveRecycleBin()
      return true
    }
    return false
  }

  /**
   * 清空回收站
   * @returns {void}
   */
  const clearRecycleBin = () => {
    recycleBin.value = []
    saveRecycleBin()
  }

  /**
   * 获取回收站记录
   * @returns {Array<LedgerRecord & { deletedAt: string }>}
   */
  const getRecycleBinRecords = () => {
    return recycleBin.value
  }

  /**
   * 切换记录状态（已还/未还）
   * @param {string} id
   * @returns {boolean}
   */
  const toggleStatus = (id) => {
    const record = getRecordById(id)
    if (record) {
      record.status = record.status === 'returned' ? 'pending' : 'returned'
      saveRecords()
      return true
    }
    return false
  }

  /**
   * 获取统计数据
   * @returns {{ totalReceived: number, pendingAmount: number, totalCount: number }}
   */
  const getStatistics = () => {
    const totalReceived = records.value
      .filter(r => r.type === 'received')
      .reduce((sum, r) => sum + r.amount, 0)
    const pendingAmount = records.value
      .filter(r => r.type === 'received' && r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0)
    return {
      totalReceived,
      pendingAmount,
      totalCount: records.value.length,
    }
  }

  /**
   * 获取往来人员汇总
   * @returns {PersonSummary[]}
   */
  const getPersonSummaries = () => {
    /** @type {Record<string, PersonSummary>} */
    const summaryMap = {}

    records.value.forEach(r => {
      if (!summaryMap[r.name]) {
        summaryMap[r.name] = { name: r.name, totalReceived: 0, pendingAmount: 0 }
      }
      if (r.type === 'received') {
        summaryMap[r.name].totalReceived += r.amount
        if (r.status === 'pending') {
          summaryMap[r.name].pendingAmount += r.amount
        }
      }
    })

    return Object.values(summaryMap)
  }

  /**
   * 导出数据为JSON文件
   */
  const exportData = () => {
    const dataStr = JSON.stringify(records.value, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `礼金账本_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * 导入数据
   * @param {File} file
   * @returns {Promise<boolean>}
   */
  const importData = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result || '[]')
          if (Array.isArray(data)) {
            records.value = data
            saveRecords()
            resolve(true)
          } else {
            resolve(false)
          }
        } catch (e) {
          console.error('Failed to parse import file:', e)
          resolve(false)
        }
      }
      reader.readAsText(file)
    })
  }

  return {
    records,
    recycleBin,
    getAllRecords,
    getRecordById,
    searchRecords,
    addRecord,
    updateRecord,
    deleteRecord,
    restoreRecord,
    permanentDeleteRecord,
    clearRecycleBin,
    getRecycleBinRecords,
    toggleStatus,
    getStatistics,
    getPersonSummaries,
    exportData,
    importData,
  }
}
