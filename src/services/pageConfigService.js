/**
 * 页面配置数据访问服务
 * 对应 Supabase page_config 表
 */
import supabase from '@/config/supabase'

const TABLE = 'page_config'

/**
 * 获取指定区块的所有已启用配置（转为 key-value map）
 * @param {string} section - 区块标识 ('background' | 'cursor' | 'home' | 'banner' | 'music' | 'about' | 'footer' | 'global')
 * @returns {Promise<Record<string, any>>}
 */
export async function getSectionConfig(section) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('key, value, label, description')
    .eq('section', section)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error

  return data.reduce((acc, row) => {
    acc[row.key] = row.value
    return acc
  }, {})
}

/**
 * 获取所有页面配置（管理后台用）
 * @returns {Promise<Array>}
 */
export async function getAllConfigs() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('section', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

/**
 * 批量更新/插入配置（编辑器保存时调用）
 * 利用 UNIQUE(section, key) 约束实现 upsert
 * @param {Array<{section: string, key: string, value: any, label?: string}>} configs
 * @returns {Promise<Array>}
 */
export async function batchUpsertConfigs(configs) {
  const records = configs.map(c => ({
    section: c.section,
    key: c.key,
    value: c.value,
    label: c.label || null,
    updated_at: new Date().toISOString(),
  }))

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(records, { onConflict: 'section, key' })
    .select()

  if (error) throw error
  return data
}

/**
 * 删除某个配置项
 * @param {string} section
 * @param {string} key
 */
export async function deleteConfig(section, key) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('section', section)
    .eq('key', key)

  if (error) throw error
}

/**
 * 加载多个区块的配置（公开主页一次性批量加载）
 * @param {string[]} sections
 * @returns {Promise<Record<string, Record<string, any>>>}
 */
export async function loadSectionsConfig(sections) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('section, key, value')
    .in('section', sections)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error

  const result = {}
  for (const row of data) {
    if (!result[row.section]) result[row.section] = {}
    result[row.section][row.key] = row.value
  }
  return result
}

/**
 * 订阅配置表实时变更
 * @param {Function} callback
 * @returns {object} subscription 对象（可调用 .unsubscribe() 取消）
 */
export function subscribeToChanges(callback) {
  return supabase
    .channel('page_config_changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: TABLE },
      (payload) => callback(payload)
    )
    .subscribe()
}
