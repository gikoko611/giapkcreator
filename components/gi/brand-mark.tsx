import { useState } from "react";
import { Image, Platform, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { gi } from "@/constants/gi-theme";

const GENERATED_MARK = "/manus-storage/async-images/pzwG28J2CNTGDBzDzZmOVA/image-1.webp";

export function BrandMark({ size = 48 }: { size?: number }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (Platform.OS === "web" && !imageFailed) {
    return (
      <Image
        source={{ uri: GENERATED_MARK }}
        onError={() => setImageFailed(true)}
        resizeMode="contain"
        style={{ width: size, height: size }}
        accessibilityLabel="G.I APK Creator brand mark"
      />
    );
  }

  return (
    <View style={{ width: size, height: size }} accessible accessibilityLabel="G.I brand mark">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path
          d="M69 20H36L27 29V71L36 80H68L76 72V55H58V67H40L38 65V35L40 33H64V42H76V28L69 20Z"
          fill="none"
          stroke={gi.cyan}
          strokeWidth={5.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Path d="M50 39V65" stroke={gi.violet} strokeWidth={6} strokeLinecap="round" />
        <Path d="M76 42H83" stroke={gi.cyan} strokeWidth={4} strokeLinecap="round" />
        <Circle cx={85} cy={42} r={3.5} fill={gi.background} stroke={gi.cyan} strokeWidth={2} />
      </Svg>
    </View>
  );
}
