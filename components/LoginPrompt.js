import { Button, StyleSheet, Text, View } from "react-native";

export default function LoginPrompt({ large, onPress }) {
  return large ? (
    <View style={styles.loginViewLarge}>
      <Text style={styles.loginViewLargeText}>
        You need to login to use this feature.
      </Text>
      <Button title="Login" onPress={onPress} />
    </View>
  ) : (
    <View style={styles.loginViewSmall}>
      <Text>You need to login to use this feature.</Text>
      <Button title="Login" onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  loginViewLarge: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loginViewLargeText: {
    paddingBottom: 12,
    fontSize: 16,
    fontWeight: "bold",
  },
  loginViewSmall: {
    flexDirection: "row",
    paddingVertical: 16,
    justifyContent: "space-between",
    alignItems: "center",
  },
});
