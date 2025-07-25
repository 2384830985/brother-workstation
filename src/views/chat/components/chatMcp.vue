<script setup lang="ts">

import {ApiOutlined} from '@ant-design/icons-vue'
import {ref, computed, onMounted} from 'vue'
import {useChatStore, useMCPServiceStore} from '@/store'
const chatStore = useChatStore()
const mcpServiceStore = useMCPServiceStore()

const showMCPSelector = ref(false)
// MCP 相关数据
const selectedMCPServers = computed(() => chatStore.selectedMCPServers)

// 获取启用的MCP服务器
const enabledMCPServers = computed(() => mcpServiceStore.enabledMCPServers)

// 切换MCP服务器选择
const toggleMCPServer = async (serverId: string) => {
  const index = chatStore.toggleMCPServer(serverId)
  const serverName = enabledMCPServers.value.find(s => s.id === serverId)?.name || serverId
  const action = index > -1 ? '取消选择' : '选择'
  console.log(`[MCP Chat] ${action} MCP 服务器:enabledMCPServers`, enabledMCPServers, serverName)
  if (selectedMCPServers.value.length) {
    mcpServiceStore.initMcpServer(chatStore.selectedMCPServers)
  }
}

onMounted(() => {
  mcpServiceStore.initMcpServer(chatStore.selectedMCPServers)
})

</script>

<template>
  <a-dropdown
    v-model:open="showMCPSelector"
    placement="bottomRight"
    :trigger="['click']"
  >
    <a-button size="small">
      <template #icon>
        <ApiOutlined />
      </template>
      {{ selectedMCPServers.length > 0 ? `${selectedMCPServers.length} 个 MCP` : '选择 MCP' }}
    </a-button>
    <template #overlay>
      <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[300px] max-h-80 overflow-y-auto">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-900">MCP 服务器</span>
          <a-button
            type="link"
            size="small"
            @click="$router.push('/settings/mcp')"
          >
            管理
          </a-button>
        </div>

        <div
          v-if="enabledMCPServers.length === 0"
          class="text-center py-4"
        >
          <div class="text-gray-400 mb-2">
            <ApiOutlined class="text-2xl" />
          </div>
          <p class="text-sm text-gray-500 mb-3">
            暂无可用的 MCP 服务器
          </p>
          <a-button
            type="primary"
            size="small"
            @click="$router.push('/settings/mcp')"
          >
            添加 MCP 服务器
          </a-button>
        </div>

        <div
          v-else
          class="space-y-2"
        >
          <div
            v-for="server in enabledMCPServers"
            :key="server.id"
            class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
            @click="toggleMCPServer(server.id)"
          >
            <div class="flex items-center space-x-3">
              <div
                class="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                :style="{ backgroundColor: server.color || '#6b7280' }"
              >
                {{ server.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <div class="text-sm font-medium text-gray-900">
                  {{ server.name }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ server.tools.length }} 个工具
                </div>
              </div>
            </div>
            <a-checkbox
              :checked="selectedMCPServers.includes(server.id)"
              @click.stop="toggleMCPServer(server.id)"
            />
          </div>
        </div>
      </div>
    </template>
  </a-dropdown>
</template>

<style scoped>
/* 确保按钮高度统一 */
:deep(.ant-btn-sm) {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

:deep(.ant-btn-sm .ant-btn-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
}

:deep(.ant-btn-sm .anticon) {
  display: flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}
</style>
