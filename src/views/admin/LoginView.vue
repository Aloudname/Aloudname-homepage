<!--
  管理员登录页
-->
<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-title">这是什么？点一下</div>

      <el-form
        ref="form"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.native.prevent="handleLogin"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="form.email"
            placeholder="这是什么？"
            prefix-icon="el-icon-user"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="这又是什么!"
            prefix-icon="el-icon-lock"
            show-password
            @keyup.enter.native="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <span>🤫</span>
      </div>
    </div>
  </div>
</template>

<script>
import { signIn } from '@/services/authService'
import authStore from '@/stores/auth'

export default {
  name: 'LoginView',

  data() {
    return {
      form: {
        email: '',
        password: '',
      },
      rules: {
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码至少6位', trigger: 'blur' },
        ],
      },
      loading: false,
    }
  },

  methods: {
    async handleLogin() {
      const valid = await this.$refs.form.validate().catch(() => false)
      if (!valid) return

      this.loading = true
      try {
        const { user } = await signIn(this.form.email, this.form.password)
        authStore.setLoggedIn(user)

        this.$message.success('登录成功')

        // 跳转到 redirect 参数指定的页面或默认仪表盘
        const redirect = this.$route.query.redirect || '/admin/dashboard'
        this.$router.push(redirect)
      } catch (err) {
        this.$message.error(err.message || '登录失败')
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
