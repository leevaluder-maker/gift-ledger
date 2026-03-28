const API_CONFIG_KEY = 'minimal_ledger_api_config'

export const AI_PROVIDERS = [
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    placeholder: 'sk-ant-api03-...',
    keyUrl: 'https://console.anthropic.com',
    keyHint: '进入 "API Keys" 页面创建新密钥'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    placeholder: 'sk-...',
    keyUrl: 'https://platform.deepseek.com',
    keyHint: '进入 "API Keys" 页面创建新密钥'
  },
  {
    id: 'kimi',
    name: 'Kimi (Moonshot)',
    placeholder: 'sk-...',
    keyUrl: 'https://platform.moonshot.cn',
    keyHint: '进入 "API Key 管理" 页面创建新密钥'
  },
  {
    id: 'aliyun',
    name: '阿里云百炼',
    placeholder: 'sk-...',
    keyUrl: 'https://bailian.console.aliyun.com',
    keyHint: '进入 "API Key 管理" 创建新密钥'
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    placeholder: 'sk-...',
    keyUrl: 'https://cloud.siliconflow.cn',
    keyHint: '进入 "API 密钥" 页面创建新密钥'
  }
]

export function useSettingsStore() {
  // 获取 API 配置
  const getApiConfig = () => {
    const stored = localStorage.getItem(API_CONFIG_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse API config:', e)
      }
    }
    return { provider: 'anthropic', key: '' }
  }

  // 保存 API 配置
  const setApiConfig = (provider, key) => {
    localStorage.setItem(API_CONFIG_KEY, JSON.stringify({ provider, key }))
  }

  // 清除 API 配置
  const clearApiConfig = () => {
    localStorage.removeItem(API_CONFIG_KEY)
  }

  // 测试 API Key 是否有效
  const testApiKey = async (provider, key) => {
    try {
      switch (provider) {
        case 'anthropic':
          return await testAnthropic(key)
        case 'deepseek':
          return await testDeepSeek(key)
        case 'kimi':
          return await testKimi(key)
        case 'aliyun':
          return await testAliyun(key)
        case 'siliconflow':
          return await testSiliconFlow(key)
        default:
          return { valid: false, message: '未知的AI服务提供商' }
      }
    } catch (e) {
      return { valid: false, message: '网络错误：' + e.message }
    }
  }

  // 测试 Anthropic
  const testAnthropic = async (key) => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "OK"' }]
      })
    })

    if (response.ok) {
      return { valid: true, message: 'API Key 有效' }
    } else {
      const error = await response.json()
      return { valid: false, message: error.error?.message || 'API Key 无效' }
    }
  }

  // 测试 DeepSeek
  const testDeepSeek = async (key) => {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Say "OK"' }],
        max_tokens: 5
      })
    })

    if (response.ok) {
      return { valid: true, message: 'API Key 有效' }
    } else {
      const error = await response.json()
      return { valid: false, message: error.error?.message || 'API Key 无效' }
    }
  }

  // 测试 Kimi
  const testKimi = async (key) => {
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [{ role: 'user', content: 'Say "OK"' }],
        max_tokens: 5
      })
    })

    if (response.ok) {
      return { valid: true, message: 'API Key 有效' }
    } else {
      const error = await response.json()
      return { valid: false, message: error.error?.message || 'API Key 无效' }
    }
  }

  // 测试阿里云
  const testAliyun = async (key) => {
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: { messages: [{ role: 'user', content: 'Say OK' }] }
      })
    })

    if (response.ok) {
      return { valid: true, message: 'API Key 有效' }
    } else {
      const error = await response.json()
      return { valid: false, message: error.message || 'API Key 无效' }
    }
  }

  // 测试硅基流动
  const testSiliconFlow = async (key) => {
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V2.5',
        messages: [{ role: 'user', content: 'Say "OK"' }],
        max_tokens: 5
      })
    })

    if (response.ok) {
      return { valid: true, message: 'API Key 有效' }
    } else {
      const error = await response.json()
      return { valid: false, message: error.error?.message || 'API Key 无效' }
    }
  }

  return {
    AI_PROVIDERS,
    getApiConfig,
    setApiConfig,
    clearApiConfig,
    testApiKey
  }
}
