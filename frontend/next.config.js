/* eslint-disable @typescript-eslint/no-var-requires */
const withPrefresh = require("@prefresh/next")

module.exports = withPrefresh({
  reactStrictMode: true,
  experimental: {
    modern: true,
    polyfillsOptimization: true
  },
  webpack(config, { dev, isServer }) {
    const splitChunks = config.optimization && config.optimization.splitChunks
    if (splitChunks) {
      const cacheGroups = splitChunks.cacheGroups
      const test = /[\\/]node_modules[\\/](preact|preact-render-to-string|preact-context-provider)[\\/]/
      if (cacheGroups.framework) {
        cacheGroups.preact = Object.assign({}, cacheGroups.framework, { test })
      }
    }

    const aliases = config.resolve.alias || (config.resolve.alias = {})
    aliases.react = aliases["react-dom"] = "preact/compat"

    if (dev && !isServer) {
      const entry = config.entry
      config.entry = () =>
        entry().then(entries => {
          entries["main.js"] = ["preact/debug"].concat(entries["main.js"] || [])
          return entries
        })
    }

    return config
  }
})
