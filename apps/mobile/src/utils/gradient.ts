import { Platform, type ViewStyle } from "react-native";

// react-native-web reads plain backgroundImage; native reads the same CSS through the experimental prop.
export const gradient = (image: string) =>
  (Platform.OS === "web"
    ? { backgroundImage: image }
    : { experimental_backgroundImage: image }) as ViewStyle;
