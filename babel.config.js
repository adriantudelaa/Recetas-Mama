module.exports = function (api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        [
          'module-resolver',
          {
            root: ['./'],
            alias: {
              "@screens": "./app/screens",
              "@navigation": "./app/navigation",
              "@assets": "./assets",
              "@styles": "./app/styles",
              "@config": "./config",
              "@android": "./android",
              "@/components": "./app/component"
          }
        }]
      ]
    };
  };
  