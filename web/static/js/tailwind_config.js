// Tailwind 主题扩展：统一设计令牌与字体（暗亮模式）
if (typeof tailwind !== 'undefined' && tailwind) {
    tailwind.config = {
        darkMode: 'class',
        theme: {
            extend: {
                colors: {
                    primary: '#2563eb',
                    secondary: '#64748b',
                    'secondary-200': '#cbd5e1',
                    success: '#22c55e',
                    warning: '#fbbf24',
                    danger: '#ef4444',
                    background: '#f8fafc',
                    'background-dark': '#0f172a',
                    surface: '#ffffff',
                    'surface-dark': '#0f172a',
                    border: '#e2e8f0',
                    'border-dark': '#334155',
                    muted: '#94a3b8'
                },
                boxShadow: {
                    'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                    'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                    'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
                },
                borderRadius: {
                    'xl': '0.75rem',
                    '2xl': '1rem'
                },
                fontFamily: {
                    sans: [
                        '-apple-system',
                        'BlinkMacSystemFont',
                        'Segoe UI',
                        'PingFang SC',
                        'Hiragino Sans GB',
                        'Microsoft YaHei',
                        'Helvetica Neue',
                        'Noto Sans',
                        'Arial',
                        'sans-serif'
                    ]
                }
            }
        }
    };
}