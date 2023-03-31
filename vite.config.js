import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue2';
import vueJsx from '@vitejs/plugin-vue2-jsx';
import { createHtmlPlugin } from 'vite-plugin-html'
const Url = require('url');
const path = require('path')
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import viteRequireContext from '@originjs/vite-plugin-require-context'
import legacy from '@vitejs/plugin-legacy'
// const IS_BUILD = NODE_ENV !== 'serve';

let proxyConfig = {};

function setProxyConfig( { token, url }) {
    const { pathname, search, host } = Url.parse(url);
    const link = `${pathname}${search}`;
    // eslint-disable-next-line no-magic-numbers
    const getProxyConfig = () => {
        return {
            target: host,
            token,
            link
        }
    }
    proxyConfig = getProxyConfig();
}


export default defineConfig(({ mode }) => {
    const isRunInServe = mode === 'serve';
    const { VUE_APP_TOKEN: token, VUE_APP_DEBUG_URL: url, STATIC_HOST } = loadEnv(mode, process.cwd(), '')
    isRunInServe &&
      setProxyConfig({ token, url })
    return {
        base: './',
        esbuild: {
            jsxFactory: 'h',
            jsxFragment: 'Fragment'
        },
        // base: '/',
        build: {
            commonjsOptions: {
                transformMixedEsModules: true,
                include: /node_modules|libs/
            },
            // 设置最终构建的浏览器兼容目标
            target: 'es2015',
            // 构建后是否生成 source map 文件
            sourcemap: false,
            //  chunk 大小警告的限制（以 kbs 为单位）
            chunkSizeWarningLimit: 2000,
            // 启用/禁用 gzip 压缩大小报告
            reportCompressedSize: false,
            outDir: path.resolve(__dirname, '/dist')
        },
        publicDir: !isRunInServe ? `${process.env.STATIC_HOST}${process.env.BASE_PATH}/` : '/public',
        plugins: [
            vueJsx(),
            viteCommonjs({ skipPreBuild: true }),
            vue(),
            viteRequireContext(),
            createHtmlPlugin({
                minify: true,
                entry: '/src/main.js',
                template: '/public/index.html'
            }),
            legacy({
                targets: ['ie >= 9'],
                additionalLegacyPolyfills: ['regenerator-runtime/runtime']
            })
        ],
        resolve: {
            alias: [
                { find: '@', replacement: path.resolve(__dirname, './src') },
                { find: '@/assets', replacement: path.resolve(__dirname, './src/assets') },
                { find: /^vue$/, replacement: 'vue/dist/vue' },
                { find: 'xxxx/nvwa', replacement: '/node_modules/xxxx/nvwa/lib/c-sku-selector' }
            ],
            // 同 webpack 中的 extensions
            extensions: ['.js', '.vue', '.jsx', 'scss']
        },
        optimizeDeps: {
            include: [
                'vue'
            ],
            exclude: ['vue-lottie']
        },
        server: {
            host: '0.0.0.0',
            port: 6969,
            open: proxyConfig.link || '',
            cors: true,
            proxy: {}
        },
        define: {
            // 同 webpack.DefinePlugin
            'process.env': process.env
        }
    }
})
