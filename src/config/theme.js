// Ant Design Theme Configuration
// This file defines the global theme tokens for consistent visual design

const theme = {
  token: {
    // Primary Colors
    colorPrimary: "#2C6BA0",
    colorSuccess: "#4caf50",
    colorWarning: "#ff9800",
    colorError: "#f44336",
    colorInfo: "#2196f3",

    // Typography
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    fontSizeHeading6: 14,

    // Border Radius
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,

    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,

    // Shadows
    boxShadow:
      "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
    boxShadowSecondary:
      "0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)",
  },

  components: {
    Button: {
      primaryColor: "#ffffff",
      colorPrimary: "#2C6BA0",
      colorPrimaryHover: "#3d7fb8",
      colorPrimaryActive: "#235a87",
      borderRadius: 6,
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
      paddingContentHorizontal: 16,
    },

    Table: {
      headerBg: "#fafafa",
      headerColor: "rgba(0, 0, 0, 0.88)",
      borderColor: "#f0f0f0",
      rowHoverBg: "#f5f5f5",
      headerSplitColor: "transparent",
      cellPaddingBlock: 8,
      cellPaddingInline: 6,
      rowSelectedBg: "#e6f4ff",
      rowSelectedHoverBg: "#bae0ff",
      colorBgContainer: "#ffffff",
      colorFillAlter: "#fafafa",
    },

    Card: {
      paddingLG: 12,
      paddingMD: 8,
      paddingSM: 8,
    
    },

    Tag: {
      defaultBg: "#f0f0f0",
      defaultColor: "rgba(0, 0, 0, 0.88)",
    },

    Switch: {
      colorPrimary: "#2C6BA0",
      colorPrimaryHover: "#3d7fb8",
    },

    Select: {
      colorBorder: "#d9d9d9",
      colorPrimary: "#2C6BA0",
      controlHeight: 36,
    },

    Modal: {
      headerBg: "#ffffff",
      contentBg: "#ffffff",
      borderRadiusLG: 8,
    },

    Message: {
      contentBg: "#ffffff",
      colorSuccess: "#4caf50",
      colorError: "#f44336",
      colorWarning: "#ff9800",
      colorInfo: "#2196f3",
    },
  },
};

export default theme;
