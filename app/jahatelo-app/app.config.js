import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    eas: {
      projectId:
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
        process.env.EAS_PROJECT_ID ||
        config.extra?.eas?.projectId,
    },
  },
});
