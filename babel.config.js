module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Drizzle migration files (.sql) are inlined into the bundle as strings.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
