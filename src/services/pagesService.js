/**
 * 自定义页面数据访问服务
 * 对应 Supabase pages 表
 */
import supabase from '@/config/supabase'

const TABLE = 'pages'

/** 获取已发布的页面列表 */
export async function getPublishedPages() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/** 通过 slug 获取页面 */
export async function getPageBySlug(slug) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

/** 获取所有页面（管理后台用，含未发布） */
export async function getAllPages() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

/** 保存页面 */
export async function savePage(page) {
  const record = { ...page, updated_at: new Date().toISOString() }
  if (!record.id) record.created_at = new Date().toISOString()
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(record, { onConflict: 'id' })
    .select()
    .single()

  if (error) throw error
  return data
}

/** 删除页面 */
export async function deletePage(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

/** 切换发布状态 */
export async function togglePagePublish(id, isPublished) {
  const { error } = await supabase
    .from(TABLE)
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

/** 生成 URL slug */
export function generateSlug(title) {
  return title.toLowerCase().replace(/[^\w一-鿿]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled'
}
