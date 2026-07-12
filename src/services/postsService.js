/**
 * 博客文章数据访问服务
 * 对应 Supabase posts 表
 */
import supabase from '@/config/supabase'

const TABLE = 'posts'

/**
 * 获取已发布的文章列表（公开页用，支持分页+筛选）
 * @param {object} options
 * @param {number} options.page - 页码（从1开始）
 * @param {number} options.pageSize - 每页数量
 * @param {string} options.category - 按分类筛选
 * @param {string} options.tag - 按标签筛选
 * @param {string} options.search - 按标题搜索
 * @returns {Promise<{posts: Array, count: number}>}
 */
export async function getPublishedPosts(options = {}) {
  const { page = 1, pageSize = 10, category, tag, search } = options

  let query = supabase
    .from(TABLE)
    .select('*', { count: 'exact' })
    .eq('is_published', true)
    .order('is_top', { ascending: false })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (category) query = query.eq('category', category)
  if (tag) query = query.contains('tags', [tag])
  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error, count } = await query
  if (error) throw error
  return { posts: data || [], count: count || 0 }
}

/**
 * 通过 slug 获取单篇文章详情
 * @param {string} slug
 * @returns {Promise<object|null>}
 */
export async function getPostBySlug(slug) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // 未找到
    throw error
  }
  return data
}

/**
 * 获取所有文章（管理后台用，含草稿）
 * @returns {Promise<Array>}
 */
export async function getAllPosts() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * 保存文章（新建或更新）
 * @param {object} post
 * @returns {Promise<object>}
 */
export async function savePost(post) {
  const record = {
    ...post,
    updated_at: new Date().toISOString(),
  }

  if (!record.id) {
    record.created_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(record, { onConflict: 'id' })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * 删除文章
 * @param {string} id
 */
export async function deletePost(id) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * 切换文章发布状态
 * @param {string} id
 * @param {boolean} isPublished
 */
export async function togglePublish(id, isPublished) {
  const { error } = await supabase
    .from(TABLE)
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

/**
 * 生成 URL 友好的 slug
 * @param {string} title
 * @returns {string}
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'untitled'
}
