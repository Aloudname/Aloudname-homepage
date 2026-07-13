/**
 * GitHub 公开 API 服务（无需认证，60次/小时/IP）
 * 用于抓取个人资料、仓库、语言统计、最近活动
 */
const API = 'https://api.github.com'

async function fetchGH(path) {
  const res = await fetch(API + path, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${res.statusText}`)
  return res.json()
}

/** 获取用户资料 */
export async function getUser(username) {
  return fetchGH(`/users/${username}`)
}

/** 获取仓库列表 */
export async function getRepos(username) {
  return fetchGH(`/users/${username}/repos?sort=updated&per_page=100&type=owner`)
}

/** 获取最近事件 */
export async function getEvents(username) {
  return fetchGH(`/users/${username}/events?per_page=30`)
}

/**
 * 计算语言分布（从仓库列表）
 * @returns {{ name: string, count: number, color: string, percent: number }[]}
 */
export function calcLanguages(repos) {
  const map = {}
  let total = 0
  for (const r of repos) {
    if (r.language) {
      map[r.language] = (map[r.language] || 0) + 1
      total++
    }
  }
  const colors = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Vue: '#41b883',
    Python: '#3572A5', Java: '#b07219', Go: '#00ADD8',
    Rust: '#dea584', CSS: '#563d7c', HTML: '#e34c26',
    Ruby: '#701516', Shell: '#89e051', C: '#555555',
    'C++': '#f34b7d', 'C#': '#178600', PHP: '#4F5D95',
    Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB',
  }
  return Object.entries(map)
    .map(([name, count]) => ({
      name, count,
      color: colors[name] || '#858585',
      percent: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
}

/** 提取精选项目（过滤 fork，按 stars 排序，取前 6） */
export function getTopProjects(repos, count = 6) {
  return repos
    .filter(r => !r.fork && !r.archived)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, count)
}

/** 计算总 star 数 */
export function calcTotalStars(repos) {
  return repos.reduce((s, r) => s + r.stargazers_count, 0)
}

/**
 * 将 GitHub Events 处理为人可读的时间线
 */
export function parseEvents(events) {
  const icons = {
    PushEvent: '🔨', CreateEvent: '✨', WatchEvent: '⭐',
    ForkEvent: '🍴', IssuesEvent: '💬', PullRequestEvent: '🔀',
    DeleteEvent: '🗑️', ReleaseEvent: '📦', PublicEvent: '🌐',
    MemberEvent: '👤', IssueCommentEvent: '💬',
  }
  const verbs = {
    PushEvent: 'pushed to', CreateEvent: 'created', WatchEvent: 'starred',
    ForkEvent: 'forked', IssuesEvent: 'opened an issue on', PullRequestEvent: 'opened a PR on',
    DeleteEvent: 'deleted', ReleaseEvent: 'released', PublicEvent: 'open-sourced',
  }

  return events.slice(0, 15).map(e => {
    const repo = e.repo?.name || ''
    const verb = verbs[e.type] || e.type
    const icon = icons[e.type] || '📌'
    const date = new Date(e.created_at)
    const timeAgo = getTimeAgo(date)
    return {
      type: e.type, repo, verb, icon, timeAgo,
      date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    }
  })
}

function getTimeAgo(date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000)
  if (s < 60) return '刚刚'
  if (s < 3600) return Math.floor(s / 60) + ' 分钟前'
  if (s < 86400) return Math.floor(s / 3600) + ' 小时前'
  if (s < 2592000) return Math.floor(s / 86400) + ' 天前'
  return Math.floor(s / 2592000) + ' 个月前'
}
