/**
 * 资源管理数据访问服务
 * 对应 Supabase assets 表 + Storage
 */
import supabase from '@/config/supabase'

const TABLE = 'assets'
const BUCKET = 'public-assets'

/**
 * 上传文件到 Supabase Storage 并在 assets 表创建记录
 * @param {File} file - 浏览器 File 对象
 * @param {string} category - 'image' | 'video' | 'audio' | 'other'
 * @param {string[]} tags - 标签
 * @param {Function} onProgress - 上传进度回调 (percent: number)
 * @returns {Promise<object>} 创建的 asset 记录
 */
export async function uploadAsset(file, category = 'image', tags = [], onProgress) {
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._一-鿿-]/g, '_')
  const storagePath = `${category}s/${timestamp}_${safeName}`

  // 1. 上传文件到 Storage
  const { error: uploadError } = await supabase
    .storage
    .from(BUCKET)
    .upload(storagePath, file, {
      cacheControl: '31536000', // 1年缓存
      upsert: false,
    })

  if (uploadError) throw uploadError

  // 2. 获取公开 URL
  const { data: urlData } = supabase
    .storage
    .from(BUCKET)
    .getPublicUrl(storagePath)

  const publicUrl = urlData.publicUrl

  // 3. 在 assets 表创建元数据记录
  const { data, error: dbError } = await supabase
    .from(TABLE)
    .insert({
      name: file.name,
      storage_path: storagePath,
      public_url: publicUrl,
      mime_type: file.type,
      category,
      size_bytes: file.size,
      tags,
    })
    .select()
    .single()

  if (dbError) {
    // 数据库写入失败时尝试清理已上传的文件
    await supabase.storage.from(BUCKET).remove([storagePath])
    throw dbError
  }

  return data
}

/**
 * 获取资源列表（分页+筛选+搜索）
 * @param {object} options
 * @returns {Promise<{assets: Array, total: number}>}
 */
export async function getAssets(options = {}) {
  const {
    page = 1,
    pageSize = 20,
    category,
    search,
    sortBy = 'created_at',
    sortDir = 'desc',
  } = options

  let query = supabase
    .from(TABLE)
    .select('*', { count: 'exact' })
    .order(sortBy, { ascending: sortDir === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (category && category !== 'all') query = query.eq('category', category)
  if (search) query = query.or(`name.ilike.%${search}%,tags.cs.{${search}}`)

  const { data, error, count } = await query
  if (error) throw error
  return { assets: data || [], total: count || 0 }
}

/**
 * 删除单个资源（数据库记录 + Storage 文件）
 * @param {string} id - asset 记录 ID
 */
export async function deleteAsset(id) {
  // 1. 获取记录拿到 storage_path
  const { data: asset, error: fetchError } = await supabase
    .from(TABLE)
    .select('storage_path')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  // 2. 并行删除 Storage 文件和数据库记录
  const [storageResult, dbResult] = await Promise.allSettled([
    supabase.storage.from(BUCKET).remove([asset.storage_path]),
    supabase.from(TABLE).delete().eq('id', id),
  ])

  if (storageResult.status === 'rejected') throw storageResult.reason
  if (dbResult.status === 'rejected') throw dbResult.reason
}

/**
 * 批量删除资源
 * @param {string[]} ids
 */
export async function batchDeleteAssets(ids) {
  if (!ids.length) return

  // 获取所有 storage_path
  const { data: assets, error } = await supabase
    .from(TABLE)
    .select('storage_path')
    .in('id', ids)

  if (error) throw error

  const paths = assets.map(a => a.storage_path)

  // 并行删除
  const [storageResult, dbResult] = await Promise.allSettled([
    supabase.storage.from(BUCKET).remove(paths),
    supabase.from(TABLE).delete().in('id', ids),
  ])

  if (storageResult.status === 'rejected') throw storageResult.reason
  if (dbResult.status === 'rejected') throw dbResult.reason
}

/**
 * 更新资源标签
 * @param {string} id
 * @param {string[]} tags
 */
export async function updateAssetTags(id, tags) {
  const { error } = await supabase
    .from(TABLE)
    .update({ tags })
    .eq('id', id)

  if (error) throw error
}
